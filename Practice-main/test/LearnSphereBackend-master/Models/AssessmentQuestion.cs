using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MyProject.Api.Models;

public class AssessmentQuestion
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int AssessmentId { get; set; }

    [ForeignKey("AssessmentId")]
    public Assessment? Assessment { get; set; }

    [Required]
    public string Text { get; set; } = null!;

    /// <summary>MCQ or MultipleSelect</summary>
    public string Type { get; set; } = "MCQ";

    /// <summary>JSON-serialized string array of option texts.</summary>
    public string Options { get; set; } = "[]";

    /// <summary>
    /// For MCQ: JSON array with one index e.g. [2].
    /// For MultipleSelect: JSON array with multiple indices e.g. [0,2].
    /// </summary>
    public string CorrectIndices { get; set; } = "[0]";

    public int Order { get; set; } = 0;
}
