using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MyProject.Api.Models;

namespace MyProject.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class NotificationsController : ControllerBase
    {
        // In-memory store (demo)
        private static readonly List<Notification> notifications = new();
        private static readonly object _lock = new();
        private static int _nextNotificationId = 0;

        // Ledger to ensure once-per-(user, course, type)
        private static readonly ConcurrentDictionary<string, DateTime> SentOnceKeys = new();

        private static string MakeKey(Guid userId, int? courseId, string? type)
            => $"{userId:N}:{(courseId.HasValue ? courseId.Value.ToString() : "-")}:{(type ?? "-")}";

        // GET: /api/notifications?take=20
        // Returns only UNREAD notifications for the current user
        [HttpGet]
        public IActionResult GetNotifications([FromQuery] int take = 20)
        {
            var idStr = User.FindFirstValue(ClaimTypes.NameIdentifier)
                      ?? User.FindFirstValue(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub);
            if (!Guid.TryParse(idStr, out var userGuid))
                return Unauthorized(new { error = "Invalid token" });

            List<Notification> userUnread;
            lock (_lock)
            {
                userUnread = notifications
                    .Where(n => n.RecipientUserId == userGuid && !n.ReadAt.HasValue)
                    .OrderByDescending(n => n.CreatedAt)
                    .Take(take)
                    .ToList();
            }

            var list = userUnread
                .Select(n => new NotificationDto
                {
                    Id = n.Id,
                    Title = n.Title,
                    Message = n.Message,
                    CreatedAt = n.CreatedAt,
                    IsRead = n.ReadAt.HasValue,
                    CourseId = n.CourseId,
                    Type = n.Type
                })
                .ToList();

            return Ok(list);
        }

        // POST: /api/notifications/{id:int}/read
        [HttpPost("{id:int}/read")]
        public IActionResult MarkNotificationRead([FromRoute] int id)
        {
            var idStr = User.FindFirstValue(ClaimTypes.NameIdentifier)
                      ?? User.FindFirstValue(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub);
            if (!Guid.TryParse(idStr, out var userGuid))
                return Unauthorized(new { error = "Invalid token" });

            lock (_lock)
            {
                var notification = notifications.FirstOrDefault(n => n.Id == id && n.RecipientUserId == userGuid);
                if (notification == null) return NotFound();

                // ✅ mark as read instead of removing (supports dedupe)
                notification.ReadAt = DateTime.UtcNow;
            }

            return Ok();
        }

        // POST: /api/notifications/read-all
        [HttpPost("read-all")]
        public IActionResult MarkAllRead()
        {
            var idStr = User.FindFirstValue(ClaimTypes.NameIdentifier)
                      ?? User.FindFirstValue(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub);
            if (!Guid.TryParse(idStr, out var userGuid))
                return Unauthorized(new { error = "Invalid token" });

            lock (_lock)
            {
                foreach (var n in notifications.Where(n => n.RecipientUserId == userGuid && !n.ReadAt.HasValue))
                {
                    n.ReadAt = DateTime.UtcNow;
                }
            }

            return Ok();
        }

        // Optional: unread count
        [HttpGet("unread-count")]
        public IActionResult GetUnreadCount()
        {
            var idStr = User.FindFirstValue(ClaimTypes.NameIdentifier)
                      ?? User.FindFirstValue(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub);
            if (!Guid.TryParse(idStr, out var userGuid))
                return Unauthorized(new { error = "Invalid token" });

            int count;
            lock (_lock)
            {
                count = notifications.Count(n => n.RecipientUserId == userGuid && !n.ReadAt.HasValue);
            }
            return Ok(new { count });
        }

        // -------------------------------
        // Helpers for server-side creation and housekeeping
        // -------------------------------

        public static void AddNotificationForUser(Guid recipientUserId, string title, string message, int? courseId = null, string? type = "NOTIFICATION")
        {
            lock (_lock)
            {
                notifications.Add(new Notification
                {
                    Id = System.Threading.Interlocked.Increment(ref _nextNotificationId), // ✅ thread-safe IDs
                    Title = title,
                    Message = message,
                    CreatedAt = DateTime.UtcNow,
                    RecipientUserId = recipientUserId,
                    CourseId = courseId,
                    ReadAt = null,
                    Type = type ?? "NOTIFICATION"
                });
            }
        }

        public static void AddNotificationForUserOnce(Guid recipientUserId, string title, string message, int? courseId = null, string? type = "NOTIFICATION")
        {
            var key = MakeKey(recipientUserId, courseId, type);
            if (SentOnceKeys.TryAdd(key, DateTime.UtcNow))
            {
                AddNotificationForUser(recipientUserId, title, message, courseId, type);
            }
        }

        public static bool HasNotification(Guid recipientUserId, int? courseId = null, string? type = null)
        {
            var key = MakeKey(recipientUserId, courseId, type);
            if (SentOnceKeys.ContainsKey(key)) return true;

            lock (_lock)
            {
                return notifications.Any(n =>
                    n.RecipientUserId == recipientUserId &&
                    (courseId == null || n.CourseId == courseId) &&
                    (type == null || n.Type == type));
            }
        }

        public static void RemoveNotificationsForCourse(int courseId)
        {
            lock (_lock)
            {
                notifications.RemoveAll(n => n.CourseId.HasValue && n.CourseId.Value == courseId);
            }
            // Note: We intentionally do NOT clear SentOnceKeys here to keep idempotency.
        }

        public static void RemoveNotificationsForStudentCourse(Guid studentId, int courseId)
        {
            lock (_lock)
            {
                notifications.RemoveAll(n => n.RecipientUserId == studentId && n.CourseId == courseId);
            }
            // Note: We intentionally do NOT clear SentOnceKeys here to keep idempotency.
        }
    }
}