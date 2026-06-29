using ReservationSystem.Domain.Common;

namespace ReservationSystem.Domain.Entities;

public class Message : BaseEntity, ITenantEntity
{
    public Guid TenantId { get; private set; }
    public Guid FromUserId { get; private set; }
    public Guid ToUserId { get; private set; }
    public Guid ToProviderId { get; private set; }
    public string Content { get; private set; } = default!;
    public DateTimeOffset SentAt { get; private set; }
    public bool IsRead { get; private set; }

    // Navigation
    public User FromUser { get; private set; } = default!;
    public User ToUser { get; private set; } = default!;

    private Message() { }

    public static Message Create(
        Guid tenantId,
        Guid fromUserId,
        Guid toUserId,
        Guid toProviderId,
        string content)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(content);

        return new Message
        {
            TenantId = tenantId,
            FromUserId = fromUserId,
            ToUserId = toUserId,
            ToProviderId = toProviderId,
            Content = content.Trim(),
            SentAt = DateTimeOffset.UtcNow,
            IsRead = false
        };
    }

    public void MarkAsRead()
    {
        IsRead = true;
        SetUpdatedAt();
    }
}
