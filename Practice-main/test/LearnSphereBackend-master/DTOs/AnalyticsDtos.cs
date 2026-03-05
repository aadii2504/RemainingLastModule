namespace MyProject.Api.DTOs;

public class AnalyticsSummaryDto
{
    public int TotalCourses { get; set; }
    public int TotalEnrolled { get; set; }
    public int TotalPassed { get; set; }
    public int TotalFailed { get; set; }
    public int TotalStudents { get; set; }
    public int TotalSessions { get; set; }
}

public class StudentCourseDetailDto
{
    public int CourseId { get; set; }
    public string CourseTitle { get; set; } = "";
    public string? Grade { get; set; }
    public float? Score { get; set; }
    public string Status { get; set; } = "";
    public string? Compliance { get; set; }
    public string? Attendance { get; set; }
}

public class StudentPerformanceDto
{
    public Guid StudentId { get; set; }
    public string StudentName { get; set; } = "";
    public string StudentEmail { get; set; } = "";
    public int CoursesEnrolled { get; set; }
    public List<StudentCourseDetailDto> Enrollments { get; set; } = new();
}

public class CoursePerformanceDto
{
    public int Id { get; set; }
    public string Title { get; set; } = "";
    public string Type { get; set; } = "";
    public List<string> Categories { get; set; } = new();
    public int Enrolled { get; set; }
    public int Passed { get; set; }
    public int Failed { get; set; }
    public DateTime CreatedAt { get; set; }
    public AttendanceStatsDto? AttendanceStats { get; set; }
}

public class AttendanceStatsDto
{
    public int Enrolled { get; set; } // Total students expected to attend
    public int Attended { get; set; } // Total actual attendance count
}