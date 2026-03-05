using System.ComponentModel.DataAnnotations;

namespace MyProject.Api.Models;

public class Course
{
    [Key]
    public int Id { get; set; }

    [Required]
    public string Title { get; set; } = null!;

    public string? Slug { get; set; }

    public string? Summary { get; set; }

    public string? Description { get; set; }

    public string? Thumbnail { get; set; }

    // Comma-separated or JSON array string
    public string? Categories { get; set; }

    public string? Duration { get; set; }

    public string Level { get; set; } = "beginner"; // beginner, intermediate, advanced

    public decimal Price { get; set; } = 0;

    public int Students { get; set; } = 0;

    public string Type { get; set; } = "Self-Paced"; // Live, Self-Paced

    public string Status { get; set; } = "published"; // published, draft

    // ISO 8601 datetime
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Enrollments
    public ICollection<Enrollment> Enrollments { get; set; } = new List<Enrollment>();

    // Chapters
    public ICollection<Chapter> Chapters { get; set; } = new List<Chapter>();
    public ICollection<LiveSession> LiveSessions { get; set; } = new List<LiveSession>();
}
