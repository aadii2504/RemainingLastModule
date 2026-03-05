using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MyProject.Api.Models;

public class Quiz
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

    public int TimeLimitMinutes { get; set; } = 15;

    public int PassingScorePercentage { get; set; } = 60;

    public int Order { get; set; } = 0;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public ICollection<QuizQuestion> Questions { get; set; } = new List<QuizQuestion>();
}
