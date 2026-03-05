using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MyProject.Api.Models;

public class LiveSession
{
    [Key]
    public int Id { get; set; }

    [Required]
    public string Title { get; set; } = null!;

    public string? Description { get; set; }

    [Required]
    public string VideoUrl { get; set; } = null!;

    public string? ThumbnailUrl { get; set; }

    [Required]
    public DateTime StartTime { get; set; }

    [Required]
    public DateTime EndTime { get; set; }

    public int? CourseId { get; set; }

    [ForeignKey("CourseId")]
    public Course? Course { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
