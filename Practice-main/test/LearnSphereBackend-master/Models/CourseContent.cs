using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MyProject.Api.Models;

public class CourseContent
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int LessonId { get; set; }

    [ForeignKey("LessonId")]
    public Lesson? Lesson { get; set; }

    [Required]
    public string Title { get; set; } = null!;

    public string? Description { get; set; }

    [Required]
    public string ContentType { get; set; } = null!; // video, audio, document, image

    [Required]
    public string FileUrl { get; set; } = null!; // URL to the stored file

    public string? FileName { get; set; } // Original file name

    public long? FileSize { get; set; } // File size in bytes

    public int Order { get; set; } = 0; // For sorting content within a lesson

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
