using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MyProject.Api.DTOs;
using MyProject.Api.Models;
using MyProject.Api.Repositories.Interfaces;
using MyProject.Api.Services.Interfaces;

namespace MyProject.Api.Controllers;

[ApiController]
[Route("api/courses")]
public class CoursesController : ControllerBase
{
    private readonly ICourseRepository _courseRepo;
    private readonly IChapterRepository _chapterRepo;
    private readonly ILessonRepository _lessonRepo;
    private readonly ICourseContentRepository _contentRepo;
    private readonly IFileUploadService _fileUploadService;
    private readonly ILogger<CoursesController> _logger;

    public CoursesController(
        ICourseRepository courseRepo,
        IChapterRepository chapterRepo,
        ILessonRepository lessonRepo,
        ICourseContentRepository contentRepo,
        IFileUploadService fileUploadService
        , IStudentRepository studentRepo, IUserRepository userRepo, ILogger<CoursesController> logger)
    {
        _courseRepo = courseRepo;
        _chapterRepo = chapterRepo;
        _lessonRepo = lessonRepo;
        _contentRepo = contentRepo;
        _fileUploadService = fileUploadService;
        _studentRepo = studentRepo;
        _userRepo = userRepo;
        _logger = logger;
    }
    private readonly IStudentRepository _studentRepo;
    private readonly IUserRepository _userRepo;

    /// <summary>
    /// Get all courses (public)
    /// </summary>
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAll()
    {
        try
        {
            var courses = await _courseRepo.GetAllAsync();
            var dtos = courses.Select(c => new CourseResponseDto
            {
                Id = c.Id,
                Title = c.Title,
                Slug = c.Slug,
                Summary = c.Summary,
                Description = c.Description,
                Thumbnail = c.Thumbnail,
                Categories = c.Categories,
                Duration = c.Duration,
                Level = c.Level,
                Price = c.Price,
                Students = c.Students,
                Status = c.Status,
                CreatedAt = c.CreatedAt,
                UpdatedAt = c.UpdatedAt
            });
            return Ok(dtos);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = "Failed to fetch courses", details = ex.Message });
        }
    }

    /// <summary>
    /// Get course by ID (public)
    /// </summary>
    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetById(int id)
    {
        var course = await _courseRepo.GetByIdAsync(id);
        if (course == null) return NotFound(new { error = "Course not found" });

        return Ok(new CourseResponseDto
        {
            Id = course.Id,
            Title = course.Title,
            Slug = course.Slug,
            Summary = course.Summary,
            Description = course.Description,
            Thumbnail = course.Thumbnail,
            Categories = course.Categories,
            Duration = course.Duration,
            Level = course.Level,
            Price = course.Price,
            Students = course.Students,
            Status = course.Status,
            CreatedAt = course.CreatedAt,
            UpdatedAt = course.UpdatedAt
        });
    }

    /// <summary>
    /// Create course (admin/instructor only)
    /// POST /api/v1/courses
    /// Returns 201 Created on success, 403 if not admin, 400 if validation fails
    /// </summary>
    [HttpPost]
    [Authorize]
    public async Task<IActionResult> Create([FromBody] CourseCreateRequestDto req)
    {
        // Validate: must have admin role
        if (!User.Identity?.IsAuthenticated ?? true)
            return StatusCode(401, new { error = "Unauthorized" });

        if (!User.IsInRole("admin"))
            return StatusCode(403, new { error = "Only admins can create courses" });

        // Validate required fields
        if (string.IsNullOrWhiteSpace(req.Title))
            return BadRequest(new { error = "Title is required" });
        if (string.IsNullOrWhiteSpace(req.Slug))
            return BadRequest(new { error = "Slug is required" });
        if (string.IsNullOrWhiteSpace(req.Summary))
            return BadRequest(new { error = "Summary is required" });

        try
        {
            var course = new Course
            {
                Title = req.Title,
                Slug = req.Slug,
                Summary = req.Summary,
                Description = req.Description,
                Thumbnail = req.Thumbnail,
                Categories = req.Categories,
                Duration = req.Duration,
                Level = req.Level,
                Price = req.Price,
                Status = req.Status,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            var created = await _courseRepo.AddAsync(course);

            _logger.LogInformation("admin created a course - {CourseName}", created.Title);

            // Send notification to all students
            try
            {
                var students = await _studentRepo.GetAllAsync();
                foreach (var student in students)
                {
                    if (student.UserId != Guid.Empty)
                    {
                        NotificationsController.AddNotificationForUser(
                            student.UserId,
                            "New Course Added",
                            $"A new course '{created.Title}' has been added.",
                            created.Id
                        );
                    }
                }
            }
            catch { /* ignore notification errors */ }

            var dto = new CourseResponseDto
            {
                Id = created.Id,
                Title = created.Title,
                Slug = created.Slug,
                Summary = created.Summary,
                Description = created.Description,
                Thumbnail = created.Thumbnail,
                Categories = created.Categories,
                Duration = created.Duration,
                Level = created.Level,
                Price = created.Price,
                Students = created.Students,
                Status = created.Status,
                CreatedAt = created.CreatedAt,
                UpdatedAt = created.UpdatedAt
            };

            return CreatedAtAction(nameof(GetById), new { id = created.Id }, dto);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }

    /// <summary>
    /// Update course (admin only)
    /// </summary>
    [HttpPut("{id}")]
    [Authorize]
    public async Task<IActionResult> Update(int id, [FromBody] CourseCreateRequestDto req)
    {
        if (!User.Identity?.IsAuthenticated ?? true)
            return StatusCode(401, new { error = "Unauthorized" });

        if (!User.IsInRole("admin"))
            return StatusCode(403, new { error = "Only admins can update courses" });

        var course = new Course
        {
            Title = req.Title,
            Slug = req.Slug,
            Summary = req.Summary,
            Description = req.Description,
            Thumbnail = req.Thumbnail,
            Categories = req.Categories,
            Duration = req.Duration,
            Level = req.Level,
            Price = req.Price,
            Status = req.Status
        };

        var updated = await _courseRepo.UpdateAsync(id, course);
        if (updated == null) return NotFound(new { error = "Course not found" });

        return Ok(new CourseResponseDto
        {
            Id = updated.Id,
            Title = updated.Title,
            Slug = updated.Slug,
            Summary = updated.Summary,
            Description = updated.Description,
            Thumbnail = updated.Thumbnail,
            Categories = updated.Categories,
            Duration = updated.Duration,
            Level = updated.Level,
            Price = updated.Price,
            Students = updated.Students,
            Status = updated.Status,
            CreatedAt = updated.CreatedAt,
            UpdatedAt = updated.UpdatedAt
        });
    }

    /// <summary>
    /// Delete course (admin only)
    /// </summary>
    [HttpDelete("{id}")]
    [Authorize]
    public async Task<IActionResult> Delete(int id)
    {
        if (!User.Identity?.IsAuthenticated ?? true)
            return StatusCode(401, new { error = "Unauthorized" });

        if (!User.IsInRole("admin"))
            return StatusCode(403, new { error = "Only admins can delete courses" });

        var ok = await _courseRepo.RemoveAsync(id);
        if (!ok) return NotFound(new { error = "Course not found" });

        // Remove notifications related to this course
        try
        {
            NotificationsController.RemoveNotificationsForCourse(id);
        }
        catch
        {
            // ignore cleanup errors
        }

        return NoContent();
    }
    /// <summary>
    /// Get course with full structure (chapters, lessons, content)
    /// GET /api/courses/{id}/structure
    /// </summary>
    [HttpGet("{id}/structure")]
    [AllowAnonymous]
    public async Task<IActionResult> GetCourseStructure(int id)
    {
        var course = await _courseRepo.GetByIdAsync(id);
        if (course == null) return NotFound(new { error = "Course not found" });

        var chapters = await _chapterRepo.GetByCourseIdAsync(id);
        var chapterDtos = new List<ChapterDto>();

        foreach (var chapter in chapters)
        {
            var lessons = await _lessonRepo.GetByChapterIdAsync(chapter.Id);
            var lessonDtos = new List<LessonDto>();

            foreach (var lesson in lessons)
            {
                var contents = await _contentRepo.GetByLessonIdAsync(lesson.Id);
                var contentDtos = contents.Select(c => new CourseContentDto
                {
                    Id = c.Id,
                    Title = c.Title,
                    Description = c.Description,
                    ContentType = c.ContentType,
                    FileUrl = c.FileUrl,
                    FileName = c.FileName,
                    FileSize = c.FileSize,
                    Order = c.Order,
                    CreatedAt = c.CreatedAt,
                    UpdatedAt = c.UpdatedAt
                }).ToList();

                lessonDtos.Add(new LessonDto
                {
                    Id = lesson.Id,
                    Title = lesson.Title,
                    Description = lesson.Description,
                    Duration = lesson.Duration,
                    Order = lesson.Order,
                    Contents = contentDtos,
                    CreatedAt = lesson.CreatedAt,
                    UpdatedAt = lesson.UpdatedAt
                });
            }

            chapterDtos.Add(new ChapterDto
            {
                Id = chapter.Id,
                Title = chapter.Title,
                Description = chapter.Description,
                Order = chapter.Order,
                Lessons = lessonDtos,
                CreatedAt = chapter.CreatedAt,
                UpdatedAt = chapter.UpdatedAt
            });
        }

        var dto = new CourseWithStructureDto
        {
            Id = course.Id,
            Title = course.Title,
            Slug = course.Slug,
            Summary = course.Summary,
            Description = course.Description,
            Thumbnail = course.Thumbnail,
            Categories = course.Categories,
            Duration = course.Duration,
            Level = course.Level,
            Price = course.Price,
            Students = course.Students,
            Status = course.Status,
            Chapters = chapterDtos,
            CreatedAt = course.CreatedAt,
            UpdatedAt = course.UpdatedAt
        };

        return Ok(dto);
    }

    #region Chapter Endpoints

    /// <summary>
    /// Create chapter for a course
    /// POST /api/courses/{courseId}/chapters
    /// </summary>
    [HttpPost("{courseId}/chapters")]
    [Authorize]
    public async Task<IActionResult> CreateChapter(int courseId, [FromBody] ChapterCreateRequestDto req)
    {
        if (!User.IsInRole("admin"))
            return StatusCode(403, new { error = "Only admins can create chapters" });

        if (string.IsNullOrWhiteSpace(req.Title))
            return BadRequest(new { error = "Chapter title is required" });

        try
        {
            var course = await _courseRepo.GetByIdAsync(courseId);
            if (course == null) return NotFound(new { error = "Course not found" });

            var chapter = new Chapter
            {
                CourseId = courseId,
                Title = req.Title,
                Description = req.Description,
                Order = req.Order,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _chapterRepo.AddAsync(chapter);
            await _chapterRepo.SaveAsync();

            var dto = new ChapterDto
            {
                Id = chapter.Id,
                Title = chapter.Title,
                Description = chapter.Description,
                Order = chapter.Order,
                Lessons = new(),
                CreatedAt = chapter.CreatedAt,
                UpdatedAt = chapter.UpdatedAt
            };

            return CreatedAtAction(nameof(GetChapterById), new { courseId, id = chapter.Id }, dto);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }

    /// <summary>
    /// Get chapter by ID
    /// GET /api/courses/{courseId}/chapters/{id}
    /// </summary>
    [HttpGet("{courseId}/chapters/{id}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetChapterById(int courseId, int id)
    {
        var chapter = await _chapterRepo.GetByIdAsync(id);
        if (chapter == null || chapter.CourseId != courseId)
            return NotFound(new { error = "Chapter not found" });

        var lessons = await _lessonRepo.GetByChapterIdAsync(id);
        var lessonDtos = new List<LessonDto>();

        foreach (var lesson in lessons)
        {
            var contents = await _contentRepo.GetByLessonIdAsync(lesson.Id);
            lessonDtos.Add(new LessonDto
            {
                Id = lesson.Id,
                Title = lesson.Title,
                Description = lesson.Description,
                Duration = lesson.Duration,
                Order = lesson.Order,
                Contents = contents.Select(c => new CourseContentDto
                {
                    Id = c.Id,
                    Title = c.Title,
                    Description = c.Description,
                    ContentType = c.ContentType,
                    FileUrl = c.FileUrl,
                    FileName = c.FileName,
                    FileSize = c.FileSize,
                    Order = c.Order,
                    CreatedAt = c.CreatedAt,
                    UpdatedAt = c.UpdatedAt
                }).ToList(),
                CreatedAt = lesson.CreatedAt,
                UpdatedAt = lesson.UpdatedAt
            });
        }

        var dto = new ChapterDto
        {
            Id = chapter.Id,
            Title = chapter.Title,
            Description = chapter.Description,
            Order = chapter.Order,
            Lessons = lessonDtos,
            CreatedAt = chapter.CreatedAt,
            UpdatedAt = chapter.UpdatedAt
        };

        return Ok(dto);
    }

    /// <summary>
    /// Update chapter
    /// PUT /api/courses/{courseId}/chapters/{id}
    /// </summary>
    [HttpPut("{courseId}/chapters/{id}")]
    [Authorize]
    public async Task<IActionResult> UpdateChapter(int courseId, int id, [FromBody] ChapterUpdateRequestDto req)
    {
        if (!User.IsInRole("admin"))
            return StatusCode(403, new { error = "Only admins can update chapters" });

        try
        {
            var chapter = await _chapterRepo.GetByIdAsync(id);
            if (chapter == null || chapter.CourseId != courseId)
                return NotFound(new { error = "Chapter not found" });

            if (!string.IsNullOrWhiteSpace(req.Title)) chapter.Title = req.Title;
            if (req.Description != null) chapter.Description = req.Description;
            if (req.Order.HasValue) chapter.Order = req.Order.Value;

            chapter.UpdatedAt = DateTime.UtcNow;

            await _chapterRepo.UpdateAsync(chapter);
            await _chapterRepo.SaveAsync();

            var dto = new ChapterDto
            {
                Id = chapter.Id,
                Title = chapter.Title,
                Description = chapter.Description,
                Order = chapter.Order,
                Lessons = new(),
                CreatedAt = chapter.CreatedAt,
                UpdatedAt = chapter.UpdatedAt
            };

            return Ok(dto);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }

    /// <summary>
    /// Delete chapter
    /// DELETE /api/courses/{courseId}/chapters/{id}
    /// </summary>
    [HttpDelete("{courseId}/chapters/{id}")]
    [Authorize]
    public async Task<IActionResult> DeleteChapter(int courseId, int id)
    {
        if (!User.IsInRole("admin"))
            return StatusCode(403, new { error = "Only admins can delete chapters" });

        try
        {
            var chapter = await _chapterRepo.GetByIdAsync(id);
            if (chapter == null || chapter.CourseId != courseId)
                return NotFound(new { error = "Chapter not found" });

            await _chapterRepo.DeleteAsync(id);
            await _chapterRepo.SaveAsync();

            return NoContent();
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }

    #endregion

    #region Lesson Endpoints

    /// <summary>
    /// Create lesson in a chapter
    /// POST /api/courses/{courseId}/chapters/{chapterId}/lessons
    /// </summary>
    [HttpPost("{courseId}/chapters/{chapterId}/lessons")]
    [Authorize]
    public async Task<IActionResult> CreateLesson(int courseId, int chapterId, [FromBody] LessonCreateRequestDto req)
    {
        if (!User.IsInRole("admin"))
            return StatusCode(403, new { error = "Only admins can create lessons" });

        if (string.IsNullOrWhiteSpace(req.Title))
            return BadRequest(new { error = "Lesson title is required" });

        try
        {
            var chapter = await _chapterRepo.GetByIdAsync(chapterId);
            if (chapter == null || chapter.CourseId != courseId)
                return NotFound(new { error = "Chapter not found" });

            var lesson = new Lesson
            {
                ChapterId = chapterId,
                Title = req.Title,
                Description = req.Description,
                Duration = req.Duration,
                Order = req.Order,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _lessonRepo.AddAsync(lesson);
            await _lessonRepo.SaveAsync();

            var dto = new LessonDto
            {
                Id = lesson.Id,
                Title = lesson.Title,
                Description = lesson.Description,
                Duration = lesson.Duration,
                Order = lesson.Order,
                Contents = new(),
                CreatedAt = lesson.CreatedAt,
                UpdatedAt = lesson.UpdatedAt
            };

            return CreatedAtAction(nameof(GetLessonById), new { courseId, chapterId, id = lesson.Id }, dto);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }

    /// <summary>
    /// Get lesson by ID
    /// GET /api/courses/{courseId}/chapters/{chapterId}/lessons/{id}
    /// </summary>
    [HttpGet("{courseId}/chapters/{chapterId}/lessons/{id}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetLessonById(int courseId, int chapterId, int id)
    {
        var lesson = await _lessonRepo.GetByIdAsync(id);
        if (lesson == null || lesson.Chapter?.CourseId != courseId || lesson.ChapterId != chapterId)
            return NotFound(new { error = "Lesson not found" });

        var contents = await _contentRepo.GetByLessonIdAsync(id);
        var contentDtos = contents.Select(c => new CourseContentDto
        {
            Id = c.Id,
            Title = c.Title,
            Description = c.Description,
            ContentType = c.ContentType,
            FileUrl = c.FileUrl,
            FileName = c.FileName,
            FileSize = c.FileSize,
            Order = c.Order,
            CreatedAt = c.CreatedAt,
            UpdatedAt = c.UpdatedAt
        }).ToList();

        var dto = new LessonDto
        {
            Id = lesson.Id,
            Title = lesson.Title,
            Description = lesson.Description,
            Duration = lesson.Duration,
            Order = lesson.Order,
            Contents = contentDtos,
            CreatedAt = lesson.CreatedAt,
            UpdatedAt = lesson.UpdatedAt
        };

        return Ok(dto);
    }

    /// <summary>
    /// Update lesson
    /// PUT /api/courses/{courseId}/chapters/{chapterId}/lessons/{id}
    /// </summary>
    [HttpPut("{courseId}/chapters/{chapterId}/lessons/{id}")]
    [Authorize]
    public async Task<IActionResult> UpdateLesson(int courseId, int chapterId, int id, [FromBody] LessonUpdateRequestDto req)
    {
        if (!User.IsInRole("admin"))
            return StatusCode(403, new { error = "Only admins can update lessons" });

        try
        {
            var lesson = await _lessonRepo.GetByIdAsync(id);
            if (lesson == null || lesson.Chapter?.CourseId != courseId || lesson.ChapterId != chapterId)
                return NotFound(new { error = "Lesson not found" });

            if (!string.IsNullOrWhiteSpace(req.Title)) lesson.Title = req.Title;
            if (req.Description != null) lesson.Description = req.Description;
            if (req.Duration != null) lesson.Duration = req.Duration;
            if (req.Order.HasValue) lesson.Order = req.Order.Value;

            lesson.UpdatedAt = DateTime.UtcNow;

            await _lessonRepo.UpdateAsync(lesson);
            await _lessonRepo.SaveAsync();

            var contents = await _contentRepo.GetByLessonIdAsync(id);
            var contentDtos = contents.Select(c => new CourseContentDto
            {
                Id = c.Id,
                Title = c.Title,
                Description = c.Description,
                ContentType = c.ContentType,
                FileUrl = c.FileUrl,
                FileName = c.FileName,
                FileSize = c.FileSize,
                Order = c.Order,
                CreatedAt = c.CreatedAt,
                UpdatedAt = c.UpdatedAt
            }).ToList();

            var dto = new LessonDto
            {
                Id = lesson.Id,
                Title = lesson.Title,
                Description = lesson.Description,
                Duration = lesson.Duration,
                Order = lesson.Order,
                Contents = contentDtos,
                CreatedAt = lesson.CreatedAt,
                UpdatedAt = lesson.UpdatedAt
            };

            return Ok(dto);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }

    /// <summary>
    /// Delete lesson
    /// DELETE /api/courses/{courseId}/chapters/{chapterId}/lessons/{id}
    /// </summary>
    [HttpDelete("{courseId}/chapters/{chapterId}/lessons/{id}")]
    [Authorize]
    public async Task<IActionResult> DeleteLesson(int courseId, int chapterId, int id)
    {
        if (!User.IsInRole("admin"))
            return StatusCode(403, new { error = "Only admins can delete lessons" });

        try
        {
            var lesson = await _lessonRepo.GetByIdAsync(id);
            if (lesson == null || lesson.Chapter?.CourseId != courseId || lesson.ChapterId != chapterId)
                return NotFound(new { error = "Lesson not found" });

            await _lessonRepo.DeleteAsync(id);
            await _lessonRepo.SaveAsync();

            return NoContent();
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }

    #endregion

    #region Content Upload Endpoints

    /// <summary>
    /// Upload multimedia content to a lesson
    /// POST /api/courses/{courseId}/chapters/{chapterId}/lessons/{lessonId}/content
    /// Form data: file (IFormFile), contentType (video/audio/document/image), title, description, order
    /// </summary>
    [HttpPost("{courseId}/chapters/{chapterId}/lessons/{lessonId}/content")]
    [Authorize]
    public async Task<IActionResult> UploadContent(
        int courseId,
        int chapterId,
        int lessonId,
        [FromForm] IFormFile? file,
        [FromForm] string? contentType,
        [FromForm] string? title,
        [FromForm] string? description = null,
        [FromForm] int order = 0
    )
    {
        if (!User.IsInRole("admin"))
            return StatusCode(403, new { error = "Only admins can upload content" });

        // Basic parameter check with diagnostic info
        if (file == null || file.Length == 0)
            return BadRequest(new { error = "File is missing or empty. Check if 'file' field is sent correctly.", received = new { contentType, title } });

        if (string.IsNullOrWhiteSpace(contentType))
            return BadRequest(new { error = "Content type is missing.", received = new { filePresent = file != null, title } });

        if (string.IsNullOrWhiteSpace(title))
            return BadRequest(new { error = "Title is missing.", received = new { filePresent = file != null, contentType } });

        try
        {
            // Verify lesson exists
            var lesson = await _lessonRepo.GetByIdAsync(lessonId);
            if (lesson == null)
                return BadRequest(new { error = $"Lesson with ID {lessonId} not found." });

            if (lesson.ChapterId != chapterId)
                return BadRequest(new { error = $"Lesson with ID {lessonId} does not belong to Chapter {chapterId}. (Belongs to {lesson.ChapterId})" });

            if (lesson.Chapter?.CourseId != courseId)
                return BadRequest(new { error = $"Lesson with ID {lessonId} (Chapter {lesson.ChapterId}) does not belong to Course {courseId}. (CourseId in DB: {lesson.Chapter?.CourseId})" });

            // Upload file
            var (success, fileUrl, fileName, fileSize, uploadError) =
                await _fileUploadService.UploadFileAsync(file, contentType, courseId);

            if (!success)
                return BadRequest(new { error = uploadError });

            // Create course content record
            var courseContent = new CourseContent
            {
                LessonId = lessonId,
                Title = title ?? "Untitled",
                Description = description,
                ContentType = contentType ?? "document",
                FileUrl = fileUrl!,
                FileName = fileName,
                FileSize = fileSize,
                Order = order,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _contentRepo.AddAsync(courseContent);
            await _contentRepo.SaveAsync();

            var dto = new CourseContentDto
            {
                Id = courseContent.Id,
                Title = courseContent.Title,
                Description = courseContent.Description,
                ContentType = courseContent.ContentType,
                FileUrl = courseContent.FileUrl,
                FileName = courseContent.FileName,
                FileSize = courseContent.FileSize,
                Order = courseContent.Order,
                CreatedAt = courseContent.CreatedAt,
                UpdatedAt = courseContent.UpdatedAt
            };

            return CreatedAtAction(nameof(GetContentById), new { courseId, chapterId, lessonId, id = courseContent.Id }, dto);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }

    /// <summary>
    /// Get content by ID
    /// GET /api/courses/{courseId}/chapters/{chapterId}/lessons/{lessonId}/content/{id}
    /// </summary>
    [HttpGet("{courseId}/chapters/{chapterId}/lessons/{lessonId}/content/{id}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetContentById(int courseId, int chapterId, int lessonId, int id)
    {
        var content = await _contentRepo.GetByIdAsync(id);
        if (content == null || content.Lesson?.ChapterId != chapterId || content.Lesson?.Chapter?.CourseId != courseId || content.LessonId != lessonId)
            return NotFound(new { error = "Content not found" });

        var dto = new CourseContentDto
        {
            Id = content.Id,
            Title = content.Title,
            Description = content.Description,
            ContentType = content.ContentType,
            FileUrl = content.FileUrl,
            FileName = content.FileName,
            FileSize = content.FileSize,
            Order = content.Order,
            CreatedAt = content.CreatedAt,
            UpdatedAt = content.UpdatedAt
        };

        return Ok(dto);
    }

    /// <summary>
    /// Delete content
    /// DELETE /api/courses/{courseId}/chapters/{chapterId}/lessons/{lessonId}/content/{id}
    /// </summary>
    [HttpDelete("{courseId}/chapters/{chapterId}/lessons/{lessonId}/content/{id}")]
    [Authorize]
    public async Task<IActionResult> DeleteContent(int courseId, int chapterId, int lessonId, int id)
    {
        if (!User.IsInRole("admin"))
            return StatusCode(403, new { error = "Only admins can delete content" });

        try
        {
            var content = await _contentRepo.GetByIdAsync(id);
            if (content == null || content.Lesson?.ChapterId != chapterId || content.Lesson?.Chapter?.CourseId != courseId || content.LessonId != lessonId)
                return NotFound(new { error = "Content not found" });

            // Delete file from storage
            await _fileUploadService.DeleteFileAsync(content.FileUrl);

            await _contentRepo.DeleteAsync(id);
            await _contentRepo.SaveAsync();

            return NoContent();
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }

    #endregion
}
