using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using ReservationSystem.Application.Common.Interfaces;
using ReservationSystem.Domain.Entities;

namespace ReservationSystem.API.Hubs;

[Authorize]
public class ChatHub(
    IApplicationDbContext db,
    ICurrentUserService currentUser,
    IEmailService emailService,
    ILogger<ChatHub> logger) : Hub
{
    public override async Task OnConnectedAsync()
    {
        var userId = currentUser.UserId;
        if (userId.HasValue)
            await Groups.AddToGroupAsync(Context.ConnectionId, userId.Value.ToString());

        await base.OnConnectedAsync();
    }

    public async Task SendMessage(Guid toUserId, Guid toProviderId, string content)
    {
        var fromUserId = currentUser.UserId
            ?? throw new HubException("Authentication required.");

        var tenantId = currentUser.TenantId
            ?? throw new HubException("Tenant context required.");

        if (string.IsNullOrWhiteSpace(content) || content.Length > 2000)
            throw new HubException("Message content is invalid.");

        var message = Message.Create(tenantId, fromUserId, toUserId, toProviderId, content);
        await db.Messages.AddAsync(message);
        await db.SaveChangesAsync(CancellationToken.None);

        // Load sender info for display name
        var fromUser = await db.Users
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(u => u.Id == fromUserId);

        var dto = new MessageDto(
            message.Id,
            message.FromUserId,
            message.ToUserId,
            message.ToProviderId,
            message.Content,
            message.SentAt,
            message.IsRead,
            fromUser?.FullName ?? "Bilinmiyor");

        // Relay to recipient
        await Clients.Group(toUserId.ToString()).SendAsync("ReceiveMessage", dto);

        // Confirm to sender
        await Clients.Caller.SendAsync("ReceiveMessage", dto);

        // Background email notification — only for the first unread message in this conversation.
        // If the recipient already has unread messages from this sender, they were already notified.
        var unreadCount = await db.Messages
            .CountAsync(m => m.FromUserId == fromUserId && m.ToUserId == toUserId && !m.IsRead);

        if (unreadCount == 1)
        {
            _ = Task.Run(async () =>
            {
                try
                {
                    var toUser = await db.Users
                        .IgnoreQueryFilters()
                        .FirstOrDefaultAsync(u => u.Id == toUserId);

                    if (toUser?.Email is not null)
                    {
                        var preview = content.Length > 120 ? content[..120] + "…" : content;
                        var messagesUrl = $"{GetAppBaseUrl()}/client/messages";

                        await emailService.SendNewMessageNotificationAsync(new MessageNotificationData(
                            toUser.Email,
                            toUser.FullName,
                            fromUser?.FullName ?? "Kullanıcı",
                            preview,
                            messagesUrl));
                    }
                }
                catch (Exception ex)
                {
                    logger.LogError(ex, "Message email notification failed");
                }
            }, CancellationToken.None);
        }
    }

    private static string GetAppBaseUrl() => "https://sevdailematematik.com";
}

public record MessageDto(
    Guid Id,
    Guid FromUserId,
    Guid ToUserId,
    Guid ToProviderId,
    string Content,
    DateTimeOffset SentAt,
    bool IsRead,
    string FromUserName);
