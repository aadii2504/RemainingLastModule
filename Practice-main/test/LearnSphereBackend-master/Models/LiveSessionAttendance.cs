using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MyProject.Api.Models;

public class LiveSessionAttendance
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int LiveSessionId { get; set; }

    [ForeignKey("LiveSessionId")]
    public LiveSession? LiveSession { get; set; }

    [Required]
    public Guid StudentId { get; set; }

    [ForeignKey("StudentId")]
    public Student? Student { get; set; }

    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
}
