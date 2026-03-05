using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MyProject.Api.Models;

public class QuizAttempt
{
    [Key]
    public int Id { get; set; }

    [Required]
    public Guid StudentId { get; set; }

    [ForeignKey("StudentId")]
    public Student? Student { get; set; }

    [Required]
    public int QuizId { get; set; }

    [ForeignKey("QuizId")]
    public Quiz? Quiz { get; set; }

    public float? Score { get; set; }

    public bool Passed { get; set; } = false;

    public DateTime AttemptedAt { get; set; } = DateTime.UtcNow;
}
