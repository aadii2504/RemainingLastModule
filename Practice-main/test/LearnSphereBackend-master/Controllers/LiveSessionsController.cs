// File: Controllers/LiveSessionsController.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyProject.Api.Data;
using MyProject.Api.Models;
using MyProject.Api.Services.Interfaces;
using MyProject.Api.Repositories.Interfaces;

namespace MyProject.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LiveSessionsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IFileUploadService _fileUpload;
    private readonly IStudentRepository _studentRepo;

    public LiveSessionsController(AppDbContext db, IFileUploadService fileUpload, IStudentRepository studentRepo)
    {
        _db = db;
        _fileUpload = fileUpload;
        _studentRepo = studentRepo;
    }

    /// <summary>Get all live sessions.</summary>
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var sessions = await _db.LiveSessions
            .OrderByDescending(ls => ls.StartTime)
            .ToListAsync();
        return Ok(sessions);
    }

    /// <summary>Get a single live session by id.</summary>
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var session = await _db.LiveSessions.FindAsync(id);
        if (session == null) return NotFound();
        return Ok(session);
    }

    /// <summary>Student: Record attendance for joining a live session.</summary>
    [HttpPost("{id}/join")]
    [Authorize]
    public async Task<IActionResult> JoinSession(int id)
    {
        var claim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                 ?? User.FindFirst("sub")?.Value;
        if (!Guid.TryParse(claim, out var userId)) return Unauthorized("Student profile not found.");

        var student = await _db.Students.FirstOrDefaultAsync(s => s.UserId == userId);
        if (student == null) return Unauthorized("Student profile not found.");

        var session = await _db.LiveSessions.FindAsync(id);
        if (session == null) return NotFound("Live session not found.");

        var now = DateTime.UtcNow;
        if (now < session.StartTime || now > session.EndTime)
        {
            return Ok(new { joined = false, message = "Session is not currently live." });
        }

        var existing = await _db.LiveSessionAttendances
            .FirstOrDefaultAsync(a => a.LiveSessionId == id && a.StudentId == student.Id);

        if (existing == null)
        {
            _db.LiveSessionAttendances.Add(new LiveSessionAttendance
            {
                LiveSessionId = id,
                StudentId = student.Id,
                JoinedAt = DateTime.UtcNow
            });
            await _db.SaveChangesAsync();
        }

        return Ok(new { joined = true });
    }

    /// <summary>Admin: Create a live session.</summary>
    [HttpPost]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Create([FromForm] LiveSessionCreateDto dto)
    {
        // Validation: Start time must be in the future
        if (dto.StartTime < DateTime.UtcNow.AddMinutes(-1))
        {
            return BadRequest(new { error = "Start time cannot be in the past." });
        }

        // Validation: End time must be after start time
        if (dto.EndTime <= dto.StartTime)
        {
            return BadRequest(new { error = "End time must be after the start time." });
        }
        string videoUrl = dto.VideoUrl ?? "";
        string thumbnailUrl = dto.ThumbnailUrl ?? "";
        var uploadCourseId = dto.CourseId ?? 0; // ensure non-null for uploader

        if (dto.VideoFile != null)
        {
            var result = await _fileUpload.UploadFileAsync(dto.VideoFile, "video", uploadCourseId);
            if (!result.success) return BadRequest(new { error = result.error });
            videoUrl = result.fileUrl!;
        }

        if (dto.ThumbnailFile != null)
        {
            var result = await _fileUpload.UploadFileAsync(dto.ThumbnailFile, "image", uploadCourseId);
            if (!result.success) return BadRequest(new { error = result.error });
            thumbnailUrl = result.fileUrl!;
        }

        var session = new LiveSession
        {
            Title = dto.Title,
            Description = dto.Description,
            VideoUrl = videoUrl,
            ThumbnailUrl = thumbnailUrl,
            StartTime = dto.StartTime,
            EndTime = dto.EndTime,
            CourseId = dto.CourseId,
            UpdatedAt = DateTime.UtcNow
        };

        _db.LiveSessions.Add(session);
        await _db.SaveChangesAsync();

        // notify all students about new live session (show StartTime in IST)
        try
        {
            var students = await _studentRepo.GetAllAsync();

            // Convert StartTime (assumed UTC in DB) -> IST for message
            var istZone = GetIstZone();
            var istStart = TimeZoneInfo.ConvertTimeFromUtc(session.StartTime, istZone);
            var whenText = $"{istStart:yyyy-MM-dd HH:mm:ss} IST";

            foreach (var student in students)
            {
                if (student.UserId != Guid.Empty)
                {
                    NotificationsController.AddNotificationForUser(
                        student.UserId,
                        "New Live Session",
                        $"A new live session '{session.Title}' has been scheduled for {whenText}.",
                        session.CourseId,
                        "LIVE_CLASS"
                    );
                }
            }
        }
        catch
        {
            // ignore notification errors
        }

        return CreatedAtAction(nameof(GetById), new { id = session.Id }, session);
    }

    /// <summary>Admin: Update a live session.</summary>
    [HttpPut("{id}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Update(int id, [FromForm] LiveSessionUpdateDto dto)
    {
        // Validation: End time must be after start time
        if (dto.EndTime <= dto.StartTime)
        {
            return BadRequest(new { error = "End time must be after the start time." });
        }
        
        // Note: We don't strictly enforce future StartTime on Update, 
        // in case the admin is correcting an ongoing or recently finished session (e.g. extending time).
        // But we could if needed.

        var existing = await _db.LiveSessions.FindAsync(id);
        if (existing == null) return NotFound();

        var uploadCourseId = dto.CourseId ?? 0; // ensure non-null for uploader

        if (dto.VideoFile != null)
        {
            var result = await _fileUpload.UploadFileAsync(dto.VideoFile, "video", uploadCourseId);
            if (!result.success) return BadRequest(new { error = result.error });
            existing.VideoUrl = result.fileUrl!;
        }
        else if (dto.VideoUrl != null)
        {
            existing.VideoUrl = dto.VideoUrl;
        }

        if (dto.ThumbnailFile != null)
        {
            var result = await _fileUpload.UploadFileAsync(dto.ThumbnailFile, "image", uploadCourseId);
            if (!result.success) return BadRequest(new { error = result.error });
            existing.ThumbnailUrl = result.fileUrl!;
        }
        else if (dto.ThumbnailUrl != null)
        {
            existing.ThumbnailUrl = dto.ThumbnailUrl;
        }

        existing.Title = dto.Title;
        existing.Description = dto.Description;
        existing.StartTime = dto.StartTime;
        existing.EndTime = dto.EndTime;
        existing.CourseId = dto.CourseId;
        existing.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return Ok(existing);
    }

    /// <summary>Admin: Delete a live session.</summary>
    [HttpDelete("{id}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var session = await _db.LiveSessions.FindAsync(id);
        if (session == null) return NotFound();

        // Optional: delete files from disk
        if (!string.IsNullOrWhiteSpace(session.VideoUrl))
            await _fileUpload.DeleteFileAsync(session.VideoUrl);
        if (!string.IsNullOrWhiteSpace(session.ThumbnailUrl))
            await _fileUpload.DeleteFileAsync(session.ThumbnailUrl);

        _db.LiveSessions.Remove(session);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // -----------------------
    // Helpers (IST timezone)
    // -----------------------
    private static TimeZoneInfo GetIstZone()
    {
        // Windows uses "India Standard Time"; Linux/macOS use "Asia/Kolkata"
        try { return TimeZoneInfo.FindSystemTimeZoneById("India Standard Time"); }
        catch { return TimeZoneInfo.FindSystemTimeZoneById("Asia/Kolkata"); }
    }
}

public class LiveSessionCreateDto
{
    public string Title { get; set; } = null!;
    public string? Description { get; set; }
    public string? VideoUrl { get; set; }
    public IFormFile? VideoFile { get; set; }
    public string? ThumbnailUrl { get; set; }
    public IFormFile? ThumbnailFile { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public int? CourseId { get; set; }
}

public class LiveSessionUpdateDto : LiveSessionCreateDto { }