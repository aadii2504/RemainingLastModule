using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MyProject.Api.Models;

public class LessonProgress
{
    [Key]
    public int Id { get; set; }

    [Required]
    public Guid StudentId { get; set; }

    [ForeignKey("StudentId")]
    public Student? Student { get; set; }

    [Required]
    public int LessonId { get; set; }

    [ForeignKey("LessonId")]
    public Lesson? Lesson { get; set; }

    public bool IsCompleted { get; set; } = false;

    public DateTime? CompletedAt { get; set; }
}
