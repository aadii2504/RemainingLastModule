using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MyProject.Api.Models;

public class AssessmentAttempt
{
    [Key]
    public int Id { get; set; }

    [Required]
    public Guid StudentId { get; set; }

    [ForeignKey("StudentId")]
    public Student? Student { get; set; }

    [Required]
    public int AssessmentId { get; set; }

    [ForeignKey("AssessmentId")]
    public Assessment? Assessment { get; set; }

    public int AttemptNumber { get; set; } = 1;

    public float? Score { get; set; }

    public bool? Passed { get; set; }

    /// <summary>Started, Completed, TimedOut</summary>
    public string Status { get; set; } = "Started";

    public DateTime StartedAt { get; set; } = DateTime.UtcNow;

    public DateTime? CompletedAt { get; set; }
}
