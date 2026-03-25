using System.Globalization;
using Iyzipay.Model;
using Iyzipay.Request;
using Microsoft.Extensions.Options;
using ReservationSystem.Application.Payments;
using IyziOptions = Iyzipay.Options;

namespace ReservationSystem.Infrastructure.Payment;

public class IyzicoPaymentService(IOptions<IyzicoOptions> opts) : IIyzicoPaymentService
{
    private IyziOptions BuildOptions() => new()
    {
        ApiKey = opts.Value.ApiKey,
        SecretKey = opts.Value.SecretKey,
        BaseUrl = opts.Value.BaseUrl
    };

    public async Task<(string CheckoutFormContent, string Token)> InitializeAsync(
        Guid userId, string email, string firstName, string lastName,
        Guid serviceId, string serviceName, decimal price,
        CancellationToken ct = default)
    {
        var iyzicoOpts = BuildOptions();
        var priceStr = price.ToString("F2", CultureInfo.InvariantCulture);

        var request = new CreateCheckoutFormInitializeRequest
        {
            Locale = Locale.TR.ToString(),
            ConversationId = Guid.NewGuid().ToString("N"),
            Price = priceStr,
            PaidPrice = priceStr,
            Currency = Currency.TRY.ToString(),
            BasketId = serviceId.ToString("N"),
            PaymentGroup = PaymentGroup.PRODUCT.ToString(),
            CallbackUrl = opts.Value.CallbackUrl,
            EnabledInstallments = new List<int> { 1, 2, 3, 6 },

            Buyer = new Buyer
            {
                Id = userId.ToString("N"),
                Name = firstName,
                Surname = lastName,
                GsmNumber = "+905000000000",
                Email = email,
                IdentityNumber = "11111111110",
                RegistrationAddress = "Türkiye",
                Ip = "85.34.78.112",
                City = "Istanbul",
                Country = "Turkey",
                ZipCode = "34000"
            },

            ShippingAddress = new Iyzipay.Model.Address
            {
                ContactName = $"{firstName} {lastName}",
                City = "Istanbul",
                Country = "Turkey",
                Description = "Türkiye",
                ZipCode = "34000"
            },

            BillingAddress = new Iyzipay.Model.Address
            {
                ContactName = $"{firstName} {lastName}",
                City = "Istanbul",
                Country = "Turkey",
                Description = "Türkiye",
                ZipCode = "34000"
            },

            BasketItems = new List<BasketItem>
            {
                new BasketItem
                {
                    Id = serviceId.ToString("N"),
                    Name = serviceName,
                    Category1 = "Eğitim",
                    ItemType = BasketItemType.VIRTUAL.ToString(),
                    Price = priceStr
                }
            }
        };

        var result = await Task.Run(() => CheckoutFormInitialize.Create(request, iyzicoOpts), ct);

        if (result.Status != "success")
            throw new InvalidOperationException($"iyzico init failed: {result.ErrorMessage}");

        return (result.CheckoutFormContent, result.Token);
    }

    public async Task<(bool Success, string? PaymentId, string? ErrorMessage)> VerifyAsync(
        string token, CancellationToken ct = default)
    {
        var iyzicoOpts = BuildOptions();

        var retrieveRequest = new RetrieveCheckoutFormRequest
        {
            Locale = Locale.TR.ToString(),
            ConversationId = Guid.NewGuid().ToString("N"),
            Token = token
        };

        var result = await Task.Run(() => CheckoutForm.Retrieve(retrieveRequest, iyzicoOpts), ct);

        if (result.PaymentStatus == "SUCCESS")
            return (true, result.PaymentId, null);

        return (false, null, result.ErrorMessage ?? result.PaymentStatus);
    }
}
