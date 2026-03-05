using Microsoft.EntityFrameworkCore;
using MyProject.Api.Data;
using MyProject.Api.DTOs;
using MyProject.Api.Services.Interfaces;

namespace MyProject.Api.Services;

public class AnalyticsService : IAnalyticsService
{
    private readonly AppDbContext _db;

    public AnalyticsService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<AnalyticsSummaryDto> GetSummaryStatsAsync(CancellationToken ct = default)
    {
        var totalCourses = await _db.Courses.CountAsync(ct);
        var totalStudents = await _db.Students.CountAsync(ct);
        var totalSessions = await _db.LiveSessions.CountAsync(ct);

        // "Total Enrolled" - distinct students who have at least one enrollment
        var totalEnrolled = await _db.Enrollments
            .Select(e => e.StudentId)
            .Distinct()
            .CountAsync(ct);

        // "Passed" - Grade A or B
        var totalPassed = await _db.Enrollments
            .CountAsync(e => e.Grade == "A" || e.Grade == "B", ct);

        // "Failed" - Grade C or below (assuming C is failed based on frontend "Failed: Grade C")
        // Frontend comment says: "Subtitle: Grade C" for Failed box.
        var totalFailed = await _db.Enrollments
            .CountAsync(e => e.Grade == "C" || e.Grade == "D" || e.Grade == "F", ct);

        return new AnalyticsSummaryDto
        {
            TotalCourses = totalCourses,
            TotalSessions = totalSessions,
            TotalEnrolled = totalEnrolled,
            TotalPassed = totalPassed,
            TotalFailed = totalFailed,
            TotalStudents = totalStudents
        };
    }

    public async Task<List<StudentPerformanceDto>> GetStudentPerformanceAsync(CancellationToken ct = default)
    {
        var enrollments = await _db.Enrollments
            .Include(e => e.Student)
            .Include(e => e.Course)
            .ToListAsync(ct);

        var liveAttendances = await _db.LiveSessionAttendances
            .Include(a => a.LiveSession)
            .Include(a => a.Student)
            .Where(a => a.JoinedAt >= a.LiveSession!.StartTime && a.JoinedAt <= a.LiveSession!.EndTime)
            .ToListAsync(ct);

        var studentIds = enrollments.Select(e => e.StudentId)
            .Concat(liveAttendances.Select(l => l.StudentId))
            .Distinct()
            .ToList();

        var result = new List<StudentPerformanceDto>();

        foreach(var sId in studentIds)
        {
            var studentEnrs = enrollments.Where(e => e.StudentId == sId).ToList();
            var studentAtts = liveAttendances.Where(la => la.StudentId == sId).ToList();
            var student = studentEnrs.FirstOrDefault()?.Student ?? studentAtts.FirstOrDefault()?.Student;

            var details = studentEnrs.Select(e => new StudentCourseDetailDto
            {
                CourseId = e.CourseId,
                CourseTitle = e.Course?.Title ?? "Unknown",
                Grade = e.Grade,
                Score = e.Score,
                Status = e.Status,
                Compliance = e.Compliance,
                Attendance = e.Attendance
            }).ToList();

            foreach (var la in studentAtts)
            {
                details.Add(new StudentCourseDetailDto
                {
                    CourseId = la.LiveSessionId + 1000000,
                    CourseTitle = la.LiveSession?.Title ?? "Unknown Live Session",
                    Grade = "NA",
                    Score = null,
                    Status = "Enrolled",
                    Compliance = "Compliant",
                    Attendance = la.JoinedAt.ToString("yyyy-MM-dd")
                });
            }

            result.Add(new StudentPerformanceDto
            {
                StudentId = sId,
                StudentName = student != null ? student.FullName : "Unknown",
                StudentEmail = student != null ? student.Email : "",
                CoursesEnrolled = details.Count,
                Enrollments = details
            });
        }

        return result;
    }

    public async Task<List<CoursePerformanceDto>> GetCoursePerformanceAsync(CancellationToken ct = default)
    {
        var courses = await _db.Courses
            .Include(c => c.Enrollments)
            .ToListAsync(ct);

        var result = courses.Select(c => new CoursePerformanceDto
        {
            Id = c.Id,
            Title = c.Title,
            Type = c.Type,
            Categories = !string.IsNullOrEmpty(c.Categories)
                ? c.Categories.Split(',', StringSplitOptions.RemoveEmptyEntries).Select(s => s.Trim()).ToList()
                : new List<string>(),
            Enrolled = c.Enrollments.Count,
            Passed = c.Enrollments.Count(e => e.Grade == "A" || e.Grade == "B"),
            Failed = c.Enrollments.Count(e => e.Grade == "C" || e.Grade == "D" || e.Grade == "F"),
            CreatedAt = c.CreatedAt,
            AttendanceStats = new AttendanceStatsDto
            {
                Enrolled = c.Enrollments.Count,
                Attended = c.Enrollments.Count(e => !string.IsNullOrEmpty(e.Attendance) || e.AttendanceCount > 0)
            }
        }).ToList();

        // Include Live Sessions as separate entries
        var liveSessions = await _db.LiveSessions
            .Include(ls => ls.Course)
                .ThenInclude(c => c!.Enrollments)
            .ToListAsync(ct);
            
        var attendances = await _db.LiveSessionAttendances
            .Include(a => a.LiveSession)
            .Where(a => a.JoinedAt >= a.LiveSession!.StartTime && a.JoinedAt <= a.LiveSession!.EndTime)
            .ToListAsync(ct);

        foreach (var ls in liveSessions)
        {
            int attended = attendances.Count(a => a.LiveSessionId == ls.Id);
            int enrolled = attended; // For Live Sessions, Total Enrolled = Attended

            result.Add(new CoursePerformanceDto
            {
                Id = ls.Id + 1000000, // offset Id to avoid UI key collisions
                Title = ls.Title,
                Type = "Live Session",
                Categories = new List<string>(),
                Enrolled = enrolled,
                Passed = 0,
                Failed = 0,
                CreatedAt = ls.CreatedAt,
                AttendanceStats = new AttendanceStatsDto
                {
                    Enrolled = enrolled,
                    Attended = attended
                }
            });
        }

        return result.OrderByDescending(r => r.CreatedAt).ToList();
    }
}