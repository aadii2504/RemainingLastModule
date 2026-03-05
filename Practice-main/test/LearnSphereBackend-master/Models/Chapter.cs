using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MyProject.Api.Models;

public class Chapter
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int CourseId { get; set; }

    [ForeignKey("CourseId")]
    public Course? Course { get; set; }

    [Required]
    public string Title { get; set; } = null!;

    public string? Description { get; set; }

    public int Order { get; set; } = 0; // For sorting chapters

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public ICollection<Lesson> Lessons { get; set; } = new List<Lesson>();
    public ICollection<Quiz> Quizzes { get; set; } = new List<Quiz>();
}
