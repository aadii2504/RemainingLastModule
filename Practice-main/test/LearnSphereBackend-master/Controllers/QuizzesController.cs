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
public class QuizzesController : ControllerBase
{
    private readonly AppDbContext _db;
    public QuizzesController(AppDbContext db) => _db = db;

    // -----------------------------------------------------------------------
    // ADMIN: CRUD for Quizzes
    // -----------------------------------------------------------------------

    /// <summary>Get all quizzes for a chapter.</summary>
    [HttpGet("chapter/{chapterId}")]
    public async Task<IActionResult> GetByChapter(int chapterId)
    {
        var quizzes = await _db.Quizzes
            .Where(q => q.ChapterId == chapterId)
            .OrderBy(q => q.Order)
            .Include(q => q.Questions)
            .ToListAsync();

        var result = quizzes.Select(MapQuiz);
        return Ok(result);
    }

    /// <summary>Get a single quiz by id (with questions).</summary>
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var quiz = await _db.Quizzes
            .Include(q => q.Questions)
            .FirstOrDefaultAsync(q => q.Id == id);
        if (quiz == null) return NotFound();

        return Ok(MapQuiz(quiz));
    }

    /// <summary>Admin: Create a quiz for a chapter.</summary>
    [HttpPost]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Create([FromBody] QuizUpsertDto dto)
    {
        var chapter = await _db.Chapters.FindAsync(dto.ChapterId);
        if (chapter == null) return NotFound("Chapter not found.");

        var quiz = new Quiz
        {
            ChapterId = dto.ChapterId,
            Title = dto.Title,
            Description = dto.Description,
            TimeLimitMinutes = dto.TimeLimitMinutes,
            PassingScorePercentage = dto.PassingScorePercentage,
            Order = dto.Order,
        };

        _db.Quizzes.Add(quiz);
        await _db.SaveChangesAsync();

        if (dto.Questions != null)
            await UpsertQuestions(quiz.Id, dto.Questions);

        return CreatedAtAction(nameof(GetById), new { id = quiz.Id },
            MapQuiz(await _db.Quizzes.Include(q => q.Questions).FirstAsync(q => q.Id == quiz.Id)));
    }

    /// <summary>Admin: Update a quiz (title, settings, and replace all questions).</summary>
    [HttpPut("{id}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Update(int id, [FromBody] QuizUpsertDto dto)
    {
        var quiz = await _db.Quizzes.Include(q => q.Questions).FirstOrDefaultAsync(q => q.Id == id);
        if (quiz == null) return NotFound();

        quiz.Title = dto.Title;
        quiz.Description = dto.Description;
        quiz.TimeLimitMinutes = dto.TimeLimitMinutes;
        quiz.PassingScorePercentage = dto.PassingScorePercentage;
        quiz.Order = dto.Order;
        quiz.UpdatedAt = DateTime.UtcNow;

        await UpsertQuestions(id, dto.Questions ?? new List<QuizQuestionDto>());
        await _db.SaveChangesAsync();
        return Ok(MapQuiz(await _db.Quizzes.Include(q => q.Questions).FirstAsync(q => q.Id == id)));
    }

    /// <summary>Admin: Delete a quiz.</summary>
    [HttpDelete("{id}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var quiz = await _db.Quizzes.FindAsync(id);
        if (quiz == null) return NotFound();
        _db.Quizzes.Remove(quiz);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // -----------------------------------------------------------------------
    // STUDENT: Submit Quiz
    // -----------------------------------------------------------------------

    /// <summary>Student: Submit quiz answers and record result.</summary>
    [HttpPost("{id}/submit")]
    [Authorize]
    public async Task<IActionResult> Submit(int id, [FromBody] QuizSubmitDto dto)
    {
        var studentId = await GetStudentIdAsync();
        if (studentId == null) return Unauthorized("Student profile not found.");

        if (dto == null || dto.Answers == null) return BadRequest("Answers are required.");

        var quiz = await _db.Quizzes.Include(q => q.Questions).FirstOrDefaultAsync(q => q.Id == id);
        if (quiz == null) return NotFound("Quiz not found.");

        int correct = 0;
        foreach (var question in quiz.Questions)
        {
            if (dto.Answers.TryGetValue(question.Id, out int selected) && selected == question.CorrectIndex)
                correct++;
        }

        float score = quiz.Questions.Count > 0 ? (float)correct / quiz.Questions.Count * 100f : 0;
        bool passed = score >= quiz.PassingScorePercentage;

        var attempt = new QuizAttempt
        {
            StudentId = studentId.Value,
            QuizId = id,
            Score = score,
            Passed = passed,
        };
        _db.QuizAttempts.Add(attempt);
        await _db.SaveChangesAsync();

        return Ok(new { score, passed, correct, total = quiz.Questions.Count });
    }

    /// <summary>Student: Get my latest quiz attempt for a quiz.</summary>
    [HttpGet("{id}/my-attempt")]
    [Authorize]
    public async Task<IActionResult> GetMyAttempt(int id)
    {
        var studentId = await GetStudentIdAsync();
        if (studentId == null) return Unauthorized("Student profile not found.");

        var attempt = await _db.QuizAttempts
            .Where(qa => qa.QuizId == id && qa.StudentId == studentId.Value)
            .OrderByDescending(qa => qa.AttemptedAt)
            .FirstOrDefaultAsync();

        if (attempt == null) return Ok(null);
        return Ok(new { attempt.Score, attempt.Passed, attempt.AttemptedAt });
    }

    // -----------------------------------------------------------------------
    // Helpers
    // -----------------------------------------------------------------------

    private async Task UpsertQuestions(int quizId, List<QuizQuestionDto> questions)
    {
        var existing = await _db.QuizQuestions.Where(q => q.QuizId == quizId).ToListAsync();
        _db.QuizQuestions.RemoveRange(existing);

        for (int i = 0; i < questions.Count; i++)
        {
            var q = questions[i];
            _db.QuizQuestions.Add(new QuizQuestion
            {
                QuizId = quizId,
                Text = q.Text,
                Options = JsonSerializer.Serialize(q.Options),
                CorrectIndex = q.CorrectIndex,
                Order = i,
            });
        }
        await _db.SaveChangesAsync();
    }

    private async Task<Guid?> GetStudentIdAsync()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                 ?? User.FindFirst("sub")?.Value;
        if (!Guid.TryParse(claim, out var userId)) return null;

        var student = await _db.Students.FirstOrDefaultAsync(s => s.UserId == userId);
        return student?.Id;
    }

    private object MapQuiz(Quiz q) => new
    {
        q.Id,
        q.ChapterId,
        q.Title,
        q.Description,
        q.TimeLimitMinutes,
        q.PassingScorePercentage,
        q.Order,
        q.CreatedAt,
        q.UpdatedAt,
        Questions = q.Questions.OrderBy(qq => qq.Order).Select(qq => new
        {
            qq.Id,
            qq.Text,
            Options = SafeDeserialize<List<string>>(qq.Options),
            qq.CorrectIndex,
            qq.Order
        })
    };

    private static T SafeDeserialize<T>(string? json) where T : new()
    {
        if (string.IsNullOrWhiteSpace(json)) return new T();
        try { return JsonSerializer.Deserialize<T>(json) ?? new T(); }
        catch { return new T(); }
    }
}

// -----------------------------------------------------------------------
// DTOs
// -----------------------------------------------------------------------

public record QuizUpsertDto(
    int ChapterId,
    string Title,
    string? Description,
    int TimeLimitMinutes,
    int PassingScorePercentage,
    int Order,
    List<QuizQuestionDto>? Questions
);

public record QuizQuestionDto(string Text, List<string> Options, int CorrectIndex);

public record QuizSubmitDto(Dictionary<int, int> Answers);
