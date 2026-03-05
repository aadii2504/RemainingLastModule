namespace MyProject.Api.DTOs;

public class EnrollmentRequestDto
{
    public int CourseId { get; set; }
}

public class EnrollmentResponseDto
{
    public Guid Id { get; set; }
    public Guid StudentId { get; set; }
    public int CourseId { get; set; }
    public DateTime EnrolledAt { get; set; }
    public string Status { get; set; } = "active";
}
