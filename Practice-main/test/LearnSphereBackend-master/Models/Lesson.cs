using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MyProject.Api.Models;

public class Lesson
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int ChapterId { get; set; }

    [ForeignKey("ChapterId")]
    public Chapter? Chapter { get; set; }

    [Required]
    public string Title { get; set; } = null!;

    public string? Description { get; set; }

    public int Order { get; set; } = 0; // For sorting lessons

    public string? Duration { get; set; } // Duration in seconds or "HH:MM:SS" format

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation property
    public ICollection<CourseContent> Contents { get; set; } = new List<CourseContent>();
}
