using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ReservationSystem.Application.Common.Exceptions;
using ReservationSystem.Application.Common.Interfaces;
using ReservationSystem.API.Hubs;

namespace ReservationSystem.API.Controllers;

[ApiController]
[Route("api/v1/messages")]
[Authorize]
public class MessagesController(
    IApplicationDbContext db,
    ICurrentUserService currentUser) : ControllerBase
{
    /// <summary>
    /// GET /api/v1/messages/conversations
    /// Returns a summary of each unique conversation for the current user.
    /// </summary>
    [HttpGet("conversations")]
    public async Task<IActionResult> GetConversations(CancellationToken ct)
    {
        var userId = currentUser.UserId
            ?? throw new UnauthorizedException("Authentication required.");

        // Fetch all messages where current user is sender or receiver
        var messages = await db.Messages
            .Where(m => m.FromUserId == userId || m.ToUserId == userId)
            .Include(m => m.FromUser)
            .Include(m => m.ToUser)
            .OrderByDescending(m => m.SentAt)
            .ToListAsync(ct);

        // Group by the "other" user
        var conversations = messages
            .GroupBy(m => m.FromUserId == userId ? m.ToUserId : m.FromUserId)
            .Select(g =>
            {
                var last = g.First(); // Already ordered desc
                var otherUser = last.FromUserId == userId ? last.ToUser : last.FromUser;
                var unread = g.Count(m => m.ToUserId == userId && !m.IsRead);

                return new ConversationDto(
                    ConversationUserId: otherUser.Id,
                    ConversationProviderIdForRoute: last.ToProviderId,
                    DisplayName: otherUser.FullName,
                    AvatarUrl: otherUser.AvatarUrl,
                    LastMessage: last.Content,
                    LastMessageAt: last.SentAt,
                    UnreadCount: unread);
            })
            .OrderByDescending(c => c.LastMessageAt)
            .ToList();

        return Ok(conversations);
    }

    /// <summary>
    /// GET /api/v1/messages/conversations/{otherUserId}
    /// Returns the full message thread between the current user and another user.
    /// Also marks incoming unread messages as read.
    /// </summary>
    [HttpGet("conversations/{otherUserId:guid}")]
    public async Task<IActionResult> GetThread(Guid otherUserId, CancellationToken ct)
    {
        var userId = currentUser.UserId
            ?? throw new UnauthorizedException("Authentication required.");

        var messages = await db.Messages
            .Where(m =>
                (m.FromUserId == userId && m.ToUserId == otherUserId) ||
                (m.FromUserId == otherUserId && m.ToUserId == userId))
            .Include(m => m.FromUser)
            .OrderBy(m => m.SentAt)
            .ToListAsync(ct);

        // Mark unread incoming messages as read
        var unread = messages.Where(m => m.ToUserId == userId && !m.IsRead).ToList();
        foreach (var m in unread)
            m.MarkAsRead();

        if (unread.Count > 0)
            await db.SaveChangesAsync(ct);

        var dtos = messages.Select(m => new MessageDto(
            m.Id,
            m.FromUserId,
            m.ToUserId,
            m.ToProviderId,
            m.Content,
            m.SentAt,
            m.IsRead,
            m.FromUser.FullName)).ToList();

        return Ok(dtos);
    }

    /// <summary>
    /// PUT /api/v1/messages/{id}/read
    /// Marks a single message as read.
    /// </summary>
    [HttpPut("{id:guid}/read")]
    public async Task<IActionResult> MarkRead(Guid id, CancellationToken ct)
    {
        var userId = currentUser.UserId
            ?? throw new UnauthorizedException("Authentication required.");

        var message = await db.Messages
            .FirstOrDefaultAsync(m => m.Id == id && m.ToUserId == userId, ct)
            ?? throw new NotFoundException("Message", id);

        message.MarkAsRead();
        await db.SaveChangesAsync(ct);

        return NoContent();
    }

    /// <summary>
    /// GET /api/v1/messages/unread-count
    /// Returns the total unread message count for the badge.
    /// </summary>
    [HttpGet("unread-count")]
    public async Task<IActionResult> GetUnreadCount(CancellationToken ct)
    {
        var userId = currentUser.UserId
            ?? throw new UnauthorizedException("Authentication required.");

        var count = await db.Messages
            .CountAsync(m => m.ToUserId == userId && !m.IsRead, ct);

        return Ok(new { count });
    }
}

public record ConversationDto(
    Guid ConversationUserId,
    Guid ConversationProviderIdForRoute,
    string DisplayName,
    string? AvatarUrl,
    string LastMessage,
    DateTimeOffset LastMessageAt,
    int UnreadCount);
