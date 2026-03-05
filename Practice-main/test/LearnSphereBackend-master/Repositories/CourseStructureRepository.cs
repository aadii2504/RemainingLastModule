using Microsoft.EntityFrameworkCore;
using MyProject.Api.Data;
using MyProject.Api.Models;
using MyProject.Api.Repositories.Interfaces;

namespace MyProject.Api.Repositories;

public class ChapterRepository : IChapterRepository
{
    private readonly AppDbContext _context;

    public ChapterRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<Chapter>> GetByCourseIdAsync(int courseId)
    {
        return await _context.Chapters
            .Where(c => c.CourseId == courseId)
            .OrderBy(c => c.Order)
            .Include(c => c.Lessons)
            .ToListAsync();
    }

    public async Task<Chapter?> GetByIdAsync(int id)
    {
        return await _context.Chapters
            .Include(c => c.Course)
            .Include(c => c.Lessons)
            .FirstOrDefaultAsync(c => c.Id == id);
    }

    public async Task AddAsync(Chapter chapter)
    {
        await _context.Chapters.AddAsync(chapter);
    }

    public async Task UpdateAsync(Chapter chapter)
    {
        _context.Chapters.Update(chapter);
        await Task.CompletedTask;
    }

    public async Task DeleteAsync(int id)
    {
        var chapter = await GetByIdAsync(id);
        if (chapter != null)
        {
            _context.Chapters.Remove(chapter);
        }
    }

    public async Task SaveAsync()
    {
        await _context.SaveChangesAsync();
    }
}

public class LessonRepository : ILessonRepository
{
    private readonly AppDbContext _context;

    public LessonRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<Lesson>> GetByChapterIdAsync(int chapterId)
    {
        return await _context.Lessons
            .Where(l => l.ChapterId == chapterId)
            .OrderBy(l => l.Order)
            .Include(l => l.Contents)
            .ToListAsync();
    }

    public async Task<Lesson?> GetByIdAsync(int id)
    {
        return await _context.Lessons
            .Include(l => l.Chapter)
            .Include(l => l.Contents)
            .FirstOrDefaultAsync(l => l.Id == id);
    }

    public async Task AddAsync(Lesson lesson)
    {
        await _context.Lessons.AddAsync(lesson);
    }

    public async Task UpdateAsync(Lesson lesson)
    {
        _context.Lessons.Update(lesson);
        await Task.CompletedTask;
    }

    public async Task DeleteAsync(int id)
    {
        var lesson = await GetByIdAsync(id);
        if (lesson != null)
        {
            _context.Lessons.Remove(lesson);
        }
    }

    public async Task SaveAsync()
    {
        await _context.SaveChangesAsync();
    }
}

public class CourseContentRepository : ICourseContentRepository
{
    private readonly AppDbContext _context;

    public CourseContentRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<CourseContent>> GetByLessonIdAsync(int lessonId)
    {
        return await _context.CourseContents
            .Where(cc => cc.LessonId == lessonId)
            .OrderBy(cc => cc.Order)
            .ToListAsync();
    }

    public async Task<CourseContent?> GetByIdAsync(int id)
    {
        return await _context.CourseContents
            .Include(cc => cc.Lesson)
                .ThenInclude(l => l != null ? l.Chapter : null)
            .FirstOrDefaultAsync(cc => cc.Id == id);
    }

    public async Task AddAsync(CourseContent content)
    {
        await _context.CourseContents.AddAsync(content);
    }

    public async Task UpdateAsync(CourseContent content)
    {
        _context.CourseContents.Update(content);
        await Task.CompletedTask;
    }

    public async Task DeleteAsync(int id)
    {
        var content = await GetByIdAsync(id);
        if (content != null)
        {
            _context.CourseContents.Remove(content);
        }
    }

    public async Task SaveAsync()
    {
        await _context.SaveChangesAsync();
    }
}
