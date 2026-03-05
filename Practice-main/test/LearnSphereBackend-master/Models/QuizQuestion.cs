using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MyProject.Api.Models;

public class QuizQuestion
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int QuizId { get; set; }

    [ForeignKey("QuizId")]
    public Quiz? Quiz { get; set; }

    [Required]
    public string Text { get; set; } = null!;

    /// <summary>JSON-serialized string array of option texts.</summary>
    public string Options { get; set; } = "[]";

    /// <summary>Index into Options that is the correct answer.</summary>
    public int CorrectIndex { get; set; } = 0;

    public int Order { get; set; } = 0;
}
