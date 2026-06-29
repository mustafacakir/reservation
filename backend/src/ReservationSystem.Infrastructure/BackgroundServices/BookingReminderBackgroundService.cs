using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using ReservationSystem.Application.Common.Interfaces;
using ReservationSystem.Domain.Enums;
using ReservationSystem.Infrastructure.Persistence;

namespace ReservationSystem.Infrastructure.BackgroundServices;

public class BookingReminderBackgroundService(
    IServiceProvider services,
    ILogger<BookingReminderBackgroundService> logger)
    : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try { await SendDueRemindersAsync(stoppingToken); }
            catch (Exception ex) { logger.LogError(ex, "Reminder background service error"); }

            await Task.Delay(TimeSpan.FromMinutes(30), stoppingToken);
        }
    }

    private async Task SendDueRemindersAsync(CancellationToken ct)
    {
        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var emailService = scope.ServiceProvider.GetRequiredService<IEmailService>();

        var now = DateTimeOffset.UtcNow;
        var windowStart = now.AddHours(11);  // between 11h and 13h from now (~12h reminder)
        var windowEnd = now.AddHours(13);

        var bookings = await db.Bookings
            .IgnoreQueryFilters()
            .Include(b => b.Service)
            .Include(b => b.Provider).ThenInclude(p => p.User)
            .Include(b => b.Client)
            .Where(b =>
                b.Status == BookingStatus.Confirmed &&
                b.StartUtc >= windowStart &&
                b.StartUtc < windowEnd &&
                b.ReminderSentAt == null)
            .ToListAsync(ct);

        foreach (var b in bookings)
        {
            var data = new BookingEmailData(
                b.Id,
                b.Service.Name,
                b.Provider.User.FullName,
                b.Provider.User.Email,
                b.Client.FullName,
                b.Client.Email,
                b.StartUtc,
                b.EndUtc);

            await emailService.SendBookingReminderAsync(data, ct);
            b.MarkReminderSent();
        }

        if (bookings.Count > 0)
        {
            await db.SaveChangesAsync(ct);
            logger.LogInformation("Sent {Count} booking reminders", bookings.Count);
        }
    }
}
