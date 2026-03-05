namespace MyProject.Api.Models;

public class Enrollment
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid StudentId { get; set; }
    public Student? Student { get; set; }

    public int CourseId { get; set; }
    public Course? Course { get; set; }

    public DateTime EnrolledAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }
    public string Status { get; set; } = "active"; // active, completed, dropped

    // Analytics Fields
    public string? Grade { get; set; } // A, B, C, etc.
    public float? Score { get; set; }
    public string? Compliance { get; set; } // "Compliant", "Non-Compliant"
    public string? Attendance { get; set; } // JSON or comma-separated dates
    public int AttendanceCount { get; set; } = 0;
}
