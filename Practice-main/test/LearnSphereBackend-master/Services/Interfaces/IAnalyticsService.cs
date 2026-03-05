using MyProject.Api.DTOs;

namespace MyProject.Api.Services.Interfaces;

public interface IAnalyticsService
{
    Task<AnalyticsSummaryDto> GetSummaryStatsAsync(CancellationToken ct = default);
    Task<List<StudentPerformanceDto>> GetStudentPerformanceAsync(CancellationToken ct = default);
    Task<List<CoursePerformanceDto>> GetCoursePerformanceAsync(CancellationToken ct = default);
}
