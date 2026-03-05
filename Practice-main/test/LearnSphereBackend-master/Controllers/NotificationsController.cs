using System;
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
        // Demo store (in-memory)
        private static readonly List<Notification> notifications = new();

        // GET: /api/notifications?take=20
        [HttpGet]
        public IActionResult GetNotifications([FromQuery] int take = 20)
        {
            var idStr = User.FindFirstValue(ClaimTypes.NameIdentifier)
                      ?? User.FindFirstValue(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub);
            if (!Guid.TryParse(idStr, out var userGuid))
                return Unauthorized(new { error = "Invalid token" });

            // For this app, only return unread notifications (they disappear when seen)
            var list = notifications
                .Where(n => n.RecipientUserId == userGuid && !n.ReadAt.HasValue)
                .OrderByDescending(n => n.CreatedAt)
                .Take(take)
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

        // POST: /api/notifications/{id}/read
        [HttpPost("{id:int}/read")]
        public IActionResult MarkNotificationRead([FromRoute] int id)
        {
            var idStr = User.FindFirstValue(ClaimTypes.NameIdentifier)
                      ?? User.FindFirstValue(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub);
            if (!Guid.TryParse(idStr, out var userGuid))
                return Unauthorized(new { error = "Invalid token" });

            var notification = notifications.FirstOrDefault(n => n.Id == id && n.RecipientUserId == userGuid);
            if (notification == null)
                return NotFound();

            // Remove the notification so it disappears after being marked as seen
            notifications.Remove(notification);
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

            // Remove all notifications for this user so they disappear when marked read-all
            notifications.RemoveAll(n => n.RecipientUserId == userGuid);
            return Ok();
        }

        // Helpers for server-side creation and housekeeping
        public static void AddNotificationForUser(Guid recipientUserId, string title, string message, int? courseId = null, string? type = "NOTIFICATION")
        {
            notifications.Add(new Notification
            {
                Id = notifications.Count + 1,
                Title = title,
                Message = message,
                CreatedAt = DateTime.UtcNow,
                RecipientUserId = recipientUserId,
                CourseId = courseId,
                ReadAt = null,
                Type = type ?? "NOTIFICATION"
            });
        }

        public static bool HasNotification(Guid recipientUserId, int? courseId = null, string? type = null)
        {
            return notifications.Any(n =>
                n.RecipientUserId == recipientUserId &&
                (courseId == null || n.CourseId == courseId) &&
                (type == null || n.Type == type)
            );
        }

        public static void RemoveNotificationsForCourse(int courseId)
        {
            notifications.RemoveAll(n => n.CourseId.HasValue && n.CourseId.Value == courseId);
        }

        // Optional: efficient unread count
        [HttpGet("unread-count")]
        public IActionResult GetUnreadCount()
        {
            var idStr = User.FindFirstValue(ClaimTypes.NameIdentifier)
                      ?? User.FindFirstValue(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub);
            if (!Guid.TryParse(idStr, out var userGuid))
                return Unauthorized(new { error = "Invalid token" });

            var count = notifications.Count(n => n.RecipientUserId == userGuid && !n.ReadAt.HasValue);
            return Ok(new { count });
        }
    }
}