using System;

namespace MyProject.Api.Models
{
    public class NotificationDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = "";
        public string Message { get; set; } = "";
        public DateTime CreatedAt { get; set; }
        public bool IsRead { get; set; }
        public int? CourseId { get; set; }
        // Type of notification (e.g. LIVE_CLASS, ASSESSMENT_AVAILABLE)
        public string? Type { get; set; }
    }
}