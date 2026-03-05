using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MyProject.Api.Models;

public class Assessment
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int CourseId { get; set; }

    [ForeignKey("CourseId")]
    public Course? Course { get; set; }

    [Required]
    public string Title { get; set; } = "Final Assessment";

    public string? Description { get; set; }

    public int TimeLimitMinutes { get; set; } = 30;

    public int PassingScorePercentage { get; set; } = 70;

    public int MaxAttempts { get; set; } = 2;

    public int? AccessDurationDays { get; set; }


    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public ICollection<AssessmentQuestion> Questions { get; set; } = new List<AssessmentQuestion>();
    public ICollection<AssessmentAttempt> Attempts { get; set; } = new List<AssessmentAttempt>();
}
