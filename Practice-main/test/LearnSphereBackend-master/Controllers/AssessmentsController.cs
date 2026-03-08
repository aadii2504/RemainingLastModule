using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyProject.Api.Data;
using MyProject.Api.Models;

namespace MyProject.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AssessmentsController : ControllerBase
{
    private readonly AppDbContext _db;
    public AssessmentsController(AppDbContext db) => _db = db;

    private Assessment? _cachedAssessment;
    private const string ASSESSMENT_UNLOCK_TYPE = "ASSESSMENT_AVAILABLE";

    private async Task<Assessment?> GetAssessmentAsync(int courseId)
    {
        if (_cachedAssessment == null || _cachedAssessment.CourseId != courseId)
        {
            _cachedAssessment = await _db.Assessments
                .AsNoTracking()
                .Include(a => a.Questions)
                .FirstOrDefaultAsync(a => a.CourseId == courseId);
        }
        return _cachedAssessment;
    }

    private void InvalidateAssessmentCache(int courseId)
    {
        if (_cachedAssessment?.CourseId == courseId)
        {
            _cachedAssessment = null;
        }
    }

    // -----------------------------------------------------------------------
    // ADMIN / STUDENT: View Assessment
    // -----------------------------------------------------------------------

    /// <summary>Get the assessment for a course (admin sees answers, student does not).</summary>
    [HttpGet("course/{courseId}")]
    [Authorize] // ensure we can check roles & hide answers from students
    public async Task<IActionResult> GetByCourse(int courseId)
    {
        var assessment = await GetAssessmentAsync(courseId);
        if (assessment == null) return Ok(null);

        if (User.IsInRole("admin"))
        {
            return Ok(MapAssessmentAdmin(assessment));
        }
        else
        {
            // Student view: never include correct answers
            return Ok(MapAssessmentStudent(assessment));
        }
    }

    // -----------------------------------------------------------------------
    // ADMIN: Manage Assessment for a Course
    // -----------------------------------------------------------------------

    /// <summary>Admin: Upsert assessment for a course (create or update).</summary>
    [HttpPut("course/{courseId}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Upsert(int courseId, [FromBody] AssessmentUpsertDto dto)
    {
        var course = await _db.Courses.AsNoTracking().FirstOrDefaultAsync(c => c.Id == courseId);
        if (course == null) return NotFound("Course not found.");

        var existing = await GetAssessmentAsync(courseId);
        if (existing == null)
        {
            existing = new Assessment { CourseId = courseId, CreatedAt = DateTime.UtcNow };
            _db.Assessments.Add(existing);
        }

        existing.Title = dto.Title;
        existing.Description = dto.Description;
        existing.TimeLimitMinutes = dto.TimeLimitMinutes;
        existing.PassingScorePercentage = dto.PassingScorePercentage;
        existing.MaxAttempts = dto.MaxAttempts;
        existing.AccessDurationDays = dto.AccessDurationDays;
        existing.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        await UpsertQuestions(existing.Id, dto.Questions ?? new List<AssessmentQuestionDto>());

        // ✅ ensure we don't return stale cached data
        InvalidateAssessmentCache(courseId);
        var fresh = await GetAssessmentAsync(courseId);

        return Ok(MapAssessmentAdmin(fresh!));
    }

    /// <summary>Admin: Delete assessment for a course.</summary>
    [HttpDelete("course/{courseId}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Delete(int courseId)
    {
        var assessment = await _db.Assessments.FirstOrDefaultAsync(a => a.CourseId == courseId);
        if (assessment == null) return NotFound();

        _db.Assessments.Remove(assessment);
        await _db.SaveChangesAsync();

        // ✅ clear cache after delete
        InvalidateAssessmentCache(courseId);

        // Clean up any existing notifications tied to this course (dedupe ledger remains)
        NotificationsController.RemoveNotificationsForCourse(courseId);

        return NoContent();
    }

    // -----------------------------------------------------------------------
    // STUDENT: Eligibility, Start, Submit
    // -----------------------------------------------------------------------

    /// <summary>
    /// Student: Check eligibility.
    /// Soft real-time emit (idempotent) is enabled by default to cover the “open Final Assessment” case:
    /// Sends ONCE per (student, course) if eligible & no attempts exist yet.
    /// </summary>
    [HttpGet("course/{courseId}/eligibility")]
    [Authorize]
    public async Task<IActionResult> CheckEligibility(int courseId, [FromQuery] bool emit = true)
    {
        var studentId = await GetStudentIdAsync();
        if (studentId == null) return Unauthorized("Student profile not found.");

        var result = await ComputeEligibilityAsync(studentId.Value, courseId);

        // --- Soft, idempotent emit: ONLY if eligible now AND no attempts exist AND no prior notification ---
        if (emit && result.Exists && result.Eligible)
        {
            var assessmentId = await _db.Assessments
                .AsNoTracking()
                .Where(a => a.CourseId == courseId)
                .Select(a => a.Id)
                .FirstOrDefaultAsync();

            if (assessmentId > 0)
            {
                var hasAnyAttempt = await _db.AssessmentAttempts
                    .AsNoTracking()
                    .AnyAsync(a => a.AssessmentId == assessmentId && a.StudentId == studentId.Value);

                if (!hasAnyAttempt)
                {
                    var userGuid = GetUserGuid();
                    if (userGuid.HasValue)
                    {
                        await NotifyAssessmentUnlockedIfEligibleAsync(userGuid.Value, courseId, studentId.Value);
                    }
                }
            }
        }

        if (!result.Exists)
            return Ok(new { eligible = false, reason = "No assessment for this course." });

        if (!result.Eligible)
        {
            return Ok(new
            {
                eligible = false,
                reason = result.Reason,
                lessonsCompleted = result.LessonsCompleted,
                lessonsTotal = result.LessonsTotal,
                quizzesPassed = result.QuizzesPassed,
                quizzesTotal = result.QuizzesTotal,
                attemptsUsed = result.AttemptsUsed,
                maxAttempts = result.MaxAttempts,
                dueDate = result.DueDate
            });
        }

        return Ok(new
        {
            eligible = true,
            attemptsUsed = result.AttemptsUsed,
            maxAttempts = result.MaxAttempts,
            timeLimitMinutes = result.TimeLimitMinutes,
            dueDate = result.DueDate,
            ongoingAttemptId = result.OngoingAttemptId,
            ongoingStartedAt = result.OngoingStartedAt
        });
    }

    /// <summary>Student: Start an assessment attempt.</summary>
    [HttpPost("course/{courseId}/start")]
    [Authorize]
    public async Task<IActionResult> Start(int courseId)
    {
        var studentId = await GetStudentIdAsync();
        if (studentId == null) return Unauthorized("Student profile not found.");

        var assessment = await _db.Assessments
            .Include(a => a.Questions)
            .Include(a => a.Attempts.Where(at => at.StudentId == studentId.Value))
            .FirstOrDefaultAsync(a => a.CourseId == courseId);

        if (assessment == null) return NotFound("No assessment for this course.");

        // Attempt limit (count only completed/timed-out)
        var completedAttempts = assessment.Attempts.Count(a => a.Status != "Started");
        if (completedAttempts >= assessment.MaxAttempts)
            return BadRequest($"You have used all {assessment.MaxAttempts} attempts.");

        // Due date guard
        var dueDate = await ComputeAssessmentDueDateAsync(studentId.Value, courseId, assessment.AccessDurationDays);
        if (dueDate.HasValue && DateTime.UtcNow > dueDate.Value)
            return BadRequest("Assessment access window has expired.");

        // Reuse existing ongoing attempt or create new
        var ongoing = assessment.Attempts.FirstOrDefault(a => a.Status == "Started");
        if (ongoing == null)
        {
            ongoing = new AssessmentAttempt
            {
                StudentId = studentId.Value,
                AssessmentId = assessment.Id,
                AttemptNumber = completedAttempts + 1,
                Status = "Started",
            };
            _db.AssessmentAttempts.Add(ongoing);
            await _db.SaveChangesAsync();
        }

        // Return questions WITHOUT correct answers
        var questions = assessment.Questions
            .OrderBy(q => q.Order)
            .Select(q => new
            {
                q.Id,
                q.Text,
                q.Type,
                Options = SafeDeserialize<List<string>>(q.Options),
                q.Order
            });

        return Ok(new
        {
            attemptId = ongoing.Id,
            startedAt = ongoing.StartedAt,
            timeLimitMinutes = assessment.TimeLimitMinutes,
            questions
        });
    }

    /// <summary>Student: Submit assessment answers.</summary>
    [HttpPost("attempt/{attemptId}/submit")]
    [Authorize]
    public async Task<IActionResult> Submit(int attemptId, [FromBody] AssessmentSubmitDto dto)
    {
        var studentId = await GetStudentIdAsync();
        if (studentId == null) return Unauthorized("Student profile not found.");

        if (dto == null || dto.Answers == null) return BadRequest("Answers are required.");

        var attempt = await _db.AssessmentAttempts
            .Include(a => a.Assessment)!.ThenInclude(a => a!.Questions)
            .FirstOrDefaultAsync(a => a.Id == attemptId && a.StudentId == studentId.Value);

        if (attempt == null) return NotFound("Attempt not found.");
        if (attempt.Status != "Started") return BadRequest("This attempt is already completed.");

        var assessment = attempt.Assessment!;

        // Auto-fail if past time limit (with 1 minute grace)
        var elapsed = DateTime.UtcNow - attempt.StartedAt;
        if (elapsed.TotalMinutes > assessment.TimeLimitMinutes + 1)
        {
            attempt.Status = "TimedOut";
            attempt.Score = 0;
            attempt.CompletedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return Ok(new { score = 0, passed = false, reason = "Time expired." });
        }

        int correct = 0;
        int total = assessment.Questions.Count;

        foreach (var question in assessment.Questions)
        {
            var correctIndices = JsonSerializer.Deserialize<List<int>>(question.CorrectIndices) ?? new List<int>();

            if ((question.Type ?? "MCQ").Equals("MCQ", StringComparison.OrdinalIgnoreCase))
            {
                if (dto.Answers.TryGetValue(question.Id, out var selected) &&
                    selected is JsonElement el &&
                    el.ValueKind == JsonValueKind.Number &&
                    correctIndices.Contains(el.GetInt32()))
                {
                    correct++;
                }
            }
            else // MultipleSelect
            {
                if (dto.Answers.TryGetValue(question.Id, out var selected) &&
                    selected is JsonElement multiEl &&
                    multiEl.ValueKind == JsonValueKind.Array)
                {
                    var selectedList = multiEl.EnumerateArray().Select(e => e.GetInt32()).OrderBy(x => x).ToList();
                    var sortedCorrect = correctIndices.OrderBy(x => x).ToList();
                    if (selectedList.SequenceEqual(sortedCorrect)) correct++;
                }
            }
        }

        float score = total > 0 ? (float)correct / total * 100f : 0;
        bool passed = score >= assessment.PassingScorePercentage;

        attempt.Score = score;
        attempt.Passed = passed;
        attempt.Status = "Completed";
        attempt.CompletedAt = DateTime.UtcNow;

        // Update Enrollment
        var enrollment = await _db.Enrollments.FirstOrDefaultAsync(e => e.CourseId == assessment.CourseId && e.StudentId == studentId.Value);
        if (enrollment != null)
        {
            // Always update highest score if multiple attempts
            if (enrollment.Score == null || score > enrollment.Score)
            {
                enrollment.Score = score;
                enrollment.Grade = score >= 80 ? "A" : score >= 60 ? "B" : "C";
            }

            // Set attendance date when completed
            enrollment.Attendance = DateTime.UtcNow.ToString("yyyy-MM-dd");

            if (passed)
            {
                enrollment.CompletedAt = DateTime.UtcNow;
                enrollment.Status = "completed";

                // Calculate due date (same logic as CheckEligibility)
                DateTime? calculatedDueDate = null;
                if (assessment.AccessDurationDays.HasValue)
                {
                    var courseChapters = await _db.Chapters.Where(c => c.CourseId == assessment.CourseId).Include(c => c.Lessons).ToListAsync();
                    var allLessonIds = courseChapters.SelectMany(c => c.Lessons).Select(l => l.Id).ToList();
                    var lpDates = await _db.LessonProgresses.Where(lp => lp.StudentId == studentId.Value && allLessonIds.Contains(lp.LessonId)).Select(lp => lp.CompletedAt).ToListAsync();
                    var allQuizzes = await _db.Quizzes.Where(q => courseChapters.Select(c => c.Id).Contains(q.ChapterId)).ToListAsync();
                    var quizIds = allQuizzes.Select(q => q.Id).ToList();
                    var passedQuizAttempts = await _db.QuizAttempts.Where(qa => qa.StudentId == studentId.Value && qa.Passed && quizIds.Contains(qa.QuizId)).GroupBy(qa => qa.QuizId).Select(g => g.OrderByDescending(qa => qa.AttemptedAt).First()).ToListAsync();
                    var qaDates = passedQuizAttempts.Select(qa => qa.AttemptedAt).ToList();
                    var allCompletionDates = lpDates.Where(d => d.HasValue).Select(d => d!.Value).Concat(qaDates).ToList();
                    if (allCompletionDates.Any())
                    {
                        var latestCompletion = allCompletionDates.Max();
                        calculatedDueDate = latestCompletion.AddDays(assessment.AccessDurationDays.Value);
                    }
                }

                if (calculatedDueDate.HasValue)
                {
                    enrollment.Compliance = DateTime.UtcNow <= calculatedDueDate.Value ? "Compliant" : "Non-Compliant";
                }
                else
                {
                    enrollment.Compliance = "Compliant";
                }
            }
        }

        await _db.SaveChangesAsync();

        // Remove notifications for the student and course after final assessment completion
        NotificationsController.RemoveNotificationsForStudentCourse(studentId.Value, assessment.CourseId);

        return Ok(new
        {
            score,
            passed,
            correct,
            total,
            passingScore = assessment.PassingScorePercentage,
            attemptsUsed = await _db.AssessmentAttempts.CountAsync(a =>
                a.AssessmentId == assessment.Id &&
                a.StudentId == studentId.Value &&
                a.Status != "Started"),
            maxAttempts = assessment.MaxAttempts
        });
    }

    /// <summary>Student: Get my assessment attempts for a course.</summary>
    [HttpGet("course/{courseId}/my-attempts")]
    [Authorize]
    public async Task<IActionResult> GetMyAttempts(int courseId)
    {
        var studentId = await GetStudentIdAsync();
        if (studentId == null) return Unauthorized("Student profile not found.");

        var assessment = await _db.Assessments.AsNoTracking().FirstOrDefaultAsync(a => a.CourseId == courseId);
        if (assessment == null) return Ok(new List<object>());

        var attempts = await _db.AssessmentAttempts
            .AsNoTracking()
            .Where(a => a.AssessmentId == assessment.Id && a.StudentId == studentId.Value)
            .OrderBy(a => a.AttemptNumber)
            .Select(a => new { a.Id, a.AttemptNumber, a.Score, a.Passed, a.Status, a.StartedAt, a.CompletedAt })
            .ToListAsync();

        return Ok(attempts);
    }

    // -----------------------------------------------------------------------
    // STUDENT: Lesson Progress
    // -----------------------------------------------------------------------

    /// <summary>
    /// Student: Mark a lesson as completed.
    /// Emits a one-time unlock notification when eligibility transitions false → true.
    /// (Never emits after the student has any attempt.)
    /// </summary>
    [HttpPost("lesson/{lessonId}/complete")]
    [Authorize]
    public async Task<IActionResult> CompleteLesson(int lessonId)
    {
        var studentId = await GetStudentIdAsync();
        if (studentId == null) return Unauthorized("Student profile not found.");

        int courseId = await GetCourseIdForLesson(lessonId);
        if (courseId <= 0) return NotFound("Lesson or course not found.");

        var prevEligibility = await ComputeEligibilityAsync(studentId.Value, courseId);

        // Upsert lesson progress
        var existing = await _db.LessonProgresses
            .FirstOrDefaultAsync(lp => lp.StudentId == studentId.Value && lp.LessonId == lessonId);

        if (existing == null)
        {
            _db.LessonProgresses.Add(new LessonProgress
            {
                StudentId = studentId.Value,
                LessonId = lessonId,
                IsCompleted = true,
                CompletedAt = DateTime.UtcNow,
            });
        }
        else
        {
            existing.IsCompleted = true;
            existing.CompletedAt = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync();

        var newEligibility = await ComputeEligibilityAsync(studentId.Value, courseId);

        // Notify only on transition: previously not eligible -> now eligible (and only if no attempts exist)
        if (newEligibility.Exists && !prevEligibility.Eligible && newEligibility.Eligible)
        {
            // ensure no attempts exist before sending (defensive)
            var assessmentId = await _db.Assessments
                .AsNoTracking()
                .Where(a => a.CourseId == courseId)
                .Select(a => a.Id)
                .FirstOrDefaultAsync();

            var hasAnyAttempt = assessmentId > 0 && await _db.AssessmentAttempts
                .AsNoTracking()
                .AnyAsync(a => a.AssessmentId == assessmentId && a.StudentId == studentId.Value);

            if (!hasAnyAttempt)
            {
                var userGuid = GetUserGuid();
                if (userGuid.HasValue)
                {
                    await NotifyAssessmentUnlockedIfEligibleAsync(userGuid.Value, courseId, studentId.Value);
                }
            }
        }

        return Ok(new { lessonId, completed = true });
    }

    /// <summary>Student: Get completed lesson ids and passed quiz ids for a course.</summary>
    [HttpGet("course/{courseId}/progress")]
    [Authorize]
    public async Task<IActionResult> GetProgress(int courseId)
    {
        var studentId = await GetStudentIdAsync();
        if (studentId == null) return Unauthorized("Student profile not found.");

        var allLessonIds = await _db.Chapters
            .AsNoTracking()
            .Where(c => c.CourseId == courseId)
            .SelectMany(c => c.Lessons.Select(l => l.Id))
            .ToListAsync();

        var completedIds = await _db.LessonProgresses
            .AsNoTracking()
            .Where(lp => lp.StudentId == studentId.Value && lp.IsCompleted && allLessonIds.Contains(lp.LessonId))
            .Select(lp => lp.LessonId)
            .ToListAsync();

        var passedQuizIds = await _db.QuizAttempts
            .AsNoTracking()
            .Where(qa => qa.StudentId == studentId.Value && qa.Passed)
            .Select(qa => qa.QuizId)
            .Distinct()
            .ToListAsync();

        return Ok(new
        {
            completedLessonIds = completedIds,
            passedQuizIds,
            totalLessons = allLessonIds.Count
        });
    }

    // -----------------------------------------------------------------------
    // Helpers
    // -----------------------------------------------------------------------

    private Guid? GetUserGuid()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                 ?? User.FindFirst("sub")?.Value;
        if (!Guid.TryParse(claim, out var userId)) return null;
        return userId;
    }

    private async Task<Guid?> GetStudentIdAsync()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                 ?? User.FindFirst("sub")?.Value;
        if (!Guid.TryParse(claim, out var userId)) return null;

        var student = await _db.Students.AsNoTracking().FirstOrDefaultAsync(s => s.UserId == userId);
        return student?.Id;
    }

    private async Task<int> GetCourseIdForLesson(int lessonId)
    {
        var lesson = await _db.Lessons
            .AsNoTracking()
            .Include(l => l.Chapter)
            .FirstOrDefaultAsync(l => l.Id == lessonId);
        return lesson?.Chapter?.CourseId ?? 0;
    }

    private async Task UpsertQuestions(int assessmentId, List<AssessmentQuestionDto> questions)
    {
        var existing = await _db.AssessmentQuestions.Where(q => q.AssessmentId == assessmentId).ToListAsync();
        _db.AssessmentQuestions.RemoveRange(existing);

        for (int i = 0; i < questions.Count; i++)
        {
            var q = questions[i];
            _db.AssessmentQuestions.Add(new AssessmentQuestion
            {
                AssessmentId = assessmentId,
                Text = q.Text,
                Type = q.Type ?? "MCQ",
                Options = JsonSerializer.Serialize(q.Options ?? new List<string>()),
                CorrectIndices = JsonSerializer.Serialize(q.CorrectIndices ?? new List<int>()),
                Order = i,
            });
        }
        await _db.SaveChangesAsync();
    }

    private object MapAssessmentAdmin(Assessment a) => new
    {
        a.Id,
        a.CourseId,
        a.Title,
        a.Description,
        a.TimeLimitMinutes,
        a.PassingScorePercentage,
        a.MaxAttempts,
        a.AccessDurationDays,
        a.CreatedAt,
        a.UpdatedAt,
        Questions = a.Questions.OrderBy(q => q.Order).Select(q => new
        {
            q.Id,
            q.Text,
            q.Type,
            Options = SafeDeserialize<List<string>>(q.Options),
            CorrectIndices = SafeDeserialize<List<int>>(q.CorrectIndices),
            q.Order
        })
    };

    private object MapAssessmentStudent(Assessment a) => new
    {
        a.Id,
        a.CourseId,
        a.Title,
        a.Description,
        a.TimeLimitMinutes,
        a.PassingScorePercentage,
        a.MaxAttempts,
        a.AccessDurationDays,
        a.CreatedAt,
        a.UpdatedAt,
        // ❗ Never send correct answers to students
        Questions = a.Questions.OrderBy(q => q.Order).Select(q => new
        {
            q.Id,
            q.Text,
            q.Type,
            Options = SafeDeserialize<List<string>>(q.Options),
            q.Order
        })
    };

    private static T SafeDeserialize<T>(string? json) where T : new()
    {
        if (string.IsNullOrWhiteSpace(json)) return new T();
        try { return JsonSerializer.Deserialize<T>(json) ?? new T(); }
        catch { return new T(); }
    }

    private static TimeZoneInfo GetIstZone()
    {
        try { return TimeZoneInfo.FindSystemTimeZoneById("India Standard Time"); }   // Windows
        catch { return TimeZoneInfo.FindSystemTimeZoneById("Asia/Kolkata"); }        // Linux/macOS
    }

    // -------------------------------
    // Eligibility & Notification helpers
    // -------------------------------

    private sealed class EligibilityResult
    {
        public bool Exists { get; init; }
        public bool Eligible { get; init; }
        public string? Reason { get; init; }

        public int AttemptsUsed { get; init; }
        public int MaxAttempts { get; init; }
        public int TimeLimitMinutes { get; init; }

        public int LessonsCompleted { get; init; }
        public int LessonsTotal { get; init; }
        public int QuizzesPassed { get; init; }
        public int QuizzesTotal { get; init; }

        public DateTime? DueDate { get; init; }
        public int? OngoingAttemptId { get; init; }
        public DateTime? OngoingStartedAt { get; init; }
    }

    /// <summary>
    /// Computes due date as: max(lesson completions, passed quiz attempts) + AccessDurationDays.
    /// Returns null if no access window or no completion dates.
    /// </summary>
    private async Task<DateTime?> ComputeAssessmentDueDateAsync(Guid studentId, int courseId, int? accessDurationDays)
    {
        if (!accessDurationDays.HasValue) return null;

        // Lessons:
        var allLessonIds = await _db.Chapters
            .AsNoTracking()
            .Where(c => c.CourseId == courseId)
            .SelectMany(c => c.Lessons.Select(l => l.Id))
            .ToListAsync();

        var lpDates = await _db.LessonProgresses
            .AsNoTracking()
            .Where(lp => lp.StudentId == studentId && allLessonIds.Contains(lp.LessonId))
            .Select(lp => lp.CompletedAt)
            .ToListAsync();

        // Quizzes:
        var chapterIds = await _db.Chapters
            .AsNoTracking()
            .Where(c => c.CourseId == courseId)
            .Select(c => c.Id)
            .ToListAsync();

        var quizIds = await _db.Quizzes
            .AsNoTracking()
            .Where(q => chapterIds.Contains(q.ChapterId))
            .Select(q => q.Id)
            .ToListAsync();

        var passedQuizDates = await _db.QuizAttempts
            .AsNoTracking()
            .Where(qa => qa.StudentId == studentId && qa.Passed && quizIds.Contains(qa.QuizId))
            .GroupBy(qa => qa.QuizId)
            .Select(g => g.OrderByDescending(x => x.AttemptedAt).First().AttemptedAt)
            .ToListAsync();

        var allCompletionDates = lpDates
            .Where(d => d.HasValue)
            .Select(d => d!.Value)
            .Concat(passedQuizDates)
            .ToList();

        if (!allCompletionDates.Any()) return null;

        var latestCompletion = allCompletionDates.Max();
        return latestCompletion.AddDays(accessDurationDays.Value);
    }

    /// <summary>
    /// Compute a detailed eligibility snapshot (no side effects).
    /// </summary>
    private async Task<EligibilityResult> ComputeEligibilityAsync(Guid studentId, int courseId)
    {
        var assessment = await _db.Assessments
            .Include(a => a.Attempts.Where(at => at.StudentId == studentId))
            .FirstOrDefaultAsync(a => a.CourseId == courseId);

        if (assessment == null)
        {
            return new EligibilityResult { Exists = false, Eligible = false, Reason = "No assessment for this course." };
        }

        // Attempt usage
        var attemptsUsed = assessment.Attempts.Count(a => a.Status != "Started");
        if (attemptsUsed >= assessment.MaxAttempts)
        {
            return new EligibilityResult
            {
                Exists = true,
                Eligible = false,
                Reason = "Maximum attempts reached.",
                AttemptsUsed = attemptsUsed,
                MaxAttempts = assessment.MaxAttempts,
                TimeLimitMinutes = assessment.TimeLimitMinutes
            };
        }

        // Course structure
        var courseChapters = await _db.Chapters
            .AsNoTracking()
            .Where(c => c.CourseId == courseId)
            .Include(c => c.Lessons)
            .ToListAsync();

        var allLessonIds = courseChapters.SelectMany(c => c.Lessons).Select(l => l.Id).ToList();
        var lessonsTotal = allLessonIds.Count;

        var completedLessonIds = await _db.LessonProgresses
            .AsNoTracking()
            .Where(lp => lp.StudentId == studentId && lp.IsCompleted && allLessonIds.Contains(lp.LessonId))
            .Select(lp => lp.LessonId)
            .Distinct()
            .ToListAsync();

        var lessonsCompleted = completedLessonIds.Count;
        if (lessonsCompleted < lessonsTotal)
        {
            return new EligibilityResult
            {
                Exists = true,
                Eligible = false,
                Reason = "Complete all lessons first.",
                LessonsCompleted = lessonsCompleted,
                LessonsTotal = lessonsTotal,
                AttemptsUsed = attemptsUsed,
                MaxAttempts = assessment.MaxAttempts,
                TimeLimitMinutes = assessment.TimeLimitMinutes
            };
        }

        // Quizzes
        var chapterIds = courseChapters.Select(c => c.Id).ToList();
        var allQuizzes = await _db.Quizzes
            .AsNoTracking()
            .Where(q => chapterIds.Contains(q.ChapterId))
            .Select(q => new { q.Id })
            .ToListAsync();

        var quizzesTotal = allQuizzes.Count;
        var quizIds = allQuizzes.Select(q => q.Id).ToList();

        var passedQuizAttempts = await _db.QuizAttempts
            .AsNoTracking()
            .Where(qa => qa.StudentId == studentId && qa.Passed && quizIds.Contains(qa.QuizId))
            .GroupBy(qa => qa.QuizId)
            .Select(g => g.OrderByDescending(qa => qa.AttemptedAt).First())
            .ToListAsync();

        var quizzesPassed = passedQuizAttempts.Count;
        if (quizzesPassed < quizzesTotal)
        {
            return new EligibilityResult
            {
                Exists = true,
                Eligible = false,
                Reason = "Pass all chapter quizzes first.",
                LessonsCompleted = lessonsCompleted,
                LessonsTotal = lessonsTotal,
                QuizzesPassed = quizzesPassed,
                QuizzesTotal = quizzesTotal,
                AttemptsUsed = attemptsUsed,
                MaxAttempts = assessment.MaxAttempts,
                TimeLimitMinutes = assessment.TimeLimitMinutes
            };
        }

        // Due date
        var dueDate = await ComputeAssessmentDueDateAsync(studentId, courseId, assessment.AccessDurationDays);
        if (dueDate.HasValue && DateTime.UtcNow > dueDate.Value)
        {
            return new EligibilityResult
            {
                Exists = true,
                Eligible = false,
                Reason = "Assessment access window has expired.",
                LessonsCompleted = lessonsCompleted,
                LessonsTotal = lessonsTotal,
                QuizzesPassed = quizzesPassed,
                QuizzesTotal = quizzesTotal,
                AttemptsUsed = attemptsUsed,
                MaxAttempts = assessment.MaxAttempts,
                TimeLimitMinutes = assessment.TimeLimitMinutes,
                DueDate = dueDate
            };
        }

        // Ongoing attempt
        var ongoingAttempt = assessment.Attempts.FirstOrDefault(a => a.Status == "Started");

        return new EligibilityResult
        {
            Exists = true,
            Eligible = true,
            LessonsCompleted = lessonsCompleted,
            LessonsTotal = lessonsTotal,
            QuizzesPassed = quizzesPassed,
            QuizzesTotal = quizzesTotal,
            AttemptsUsed = attemptsUsed,
            MaxAttempts = assessment.MaxAttempts,
            TimeLimitMinutes = assessment.TimeLimitMinutes,
            DueDate = dueDate,
            OngoingAttemptId = ongoingAttempt?.Id,
            OngoingStartedAt = ongoingAttempt?.StartedAt
        };
    }

    /// <summary>
    /// Sends a one-time "Assessment Unlocked" notification when eligible now.
    /// NEVER notifies after the student has any attempt (started/completed/timed-out).
    /// Prevents duplicates with a per-(course, student) key + server ledger.
    /// ALWAYS includes a Due Date line: formatted when available; "Not configured" otherwise.
    /// </summary>
    private async Task NotifyAssessmentUnlockedIfEligibleAsync(Guid userGuid, int courseId, Guid studentGuid)
    {
        // Block if the student has any attempt on this course (defensive)
        var assessmentId = await _db.Assessments
            .AsNoTracking()
            .Where(a => a.CourseId == courseId)
            .Select(a => a.Id)
            .FirstOrDefaultAsync();

        if (assessmentId <= 0) return;

        var hasAnyAttempt = await _db.AssessmentAttempts
            .AsNoTracking()
            .AnyAsync(a => a.AssessmentId == assessmentId && a.StudentId == studentGuid);

        if (hasAnyAttempt) return;

        // Dedupe using ledger + existing notifications
        if (NotificationsController.HasNotification(userGuid, courseId, ASSESSMENT_UNLOCK_TYPE)) return;

        var assessment = await _db.Assessments.AsNoTracking().FirstOrDefaultAsync(a => a.CourseId == courseId);
        if (assessment == null) return;

        // ✅ Load the course so we can use course.Title in the message
        var course = await _db.Courses.AsNoTracking().FirstOrDefaultAsync(c => c.Id == courseId);
        if (course == null) return;

        // Compute due date using your rule and format in IST
        var dueUtc = await ComputeAssessmentDueDateAsync(studentGuid, courseId, assessment.AccessDurationDays);
        var ist = GetIstZone();
        var dueText = assessment.AccessDurationDays.HasValue
            ? (dueUtc.HasValue
                ? TimeZoneInfo.ConvertTimeFromUtc(dueUtc.Value, ist).ToString("dd-MM-yyyy HH:mm:ss")
                : "Not configured")
            : "Not configured";

        NotificationsController.AddNotificationForUserOnce(
            userGuid,
            "Assessment Unlocked",
            $"Final assessment for '{course.Title}' is now available. Due Date is: {dueText}",
            courseId,
            ASSESSMENT_UNLOCK_TYPE
        );
    }
}

// -----------------------------------------------------------------------
// DTOs
// -----------------------------------------------------------------------

public record AssessmentUpsertDto(
    string Title,
    string? Description,
    int TimeLimitMinutes,
    int PassingScorePercentage,
    int MaxAttempts,
    int? AccessDurationDays,
    List<AssessmentQuestionDto>? Questions
);

public record AssessmentQuestionDto(
    string Text,
    string? Type,
    List<string> Options,
    List<int> CorrectIndices
);

public class AssessmentSubmitDto
{
    public Dictionary<int, object> Answers { get; set; } = new();
}