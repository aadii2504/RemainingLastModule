using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MyProject.Api.DTOs;
using MyProject.Api.Services.Interfaces;

namespace MyProject.Api.Controllers;

[ApiController]
[Route("api/analytics")]
[Authorize] // Require authentication for analytics
public class AnalyticsController : ControllerBase
{
    private readonly IAnalyticsService _analyticsService;

    public AnalyticsController(IAnalyticsService analyticsService)
    {
        _analyticsService = analyticsService;
    }

    [HttpGet("summary")]
    public async Task<ActionResult<AnalyticsSummaryDto>> GetSummary(CancellationToken ct)
    {
        var stats = await _analyticsService.GetSummaryStatsAsync(ct);
        return Ok(stats);
    }

    [HttpGet("students")]
    public async Task<ActionResult<List<StudentPerformanceDto>>> GetStudentPerformance(CancellationToken ct)
    {
        var data = await _analyticsService.GetStudentPerformanceAsync(ct);
        return Ok(data);
    }

    [HttpGet("courses")]
    public async Task<ActionResult<List<CoursePerformanceDto>>> GetCoursePerformance(CancellationToken ct)
    {
        var data = await _analyticsService.GetCoursePerformanceAsync(ct);
        return Ok(data);
    }
}
