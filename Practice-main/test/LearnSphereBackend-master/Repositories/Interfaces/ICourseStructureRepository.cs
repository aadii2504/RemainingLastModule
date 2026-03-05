using MyProject.Api.Models;

namespace MyProject.Api.Repositories.Interfaces;

public interface IChapterRepository
{
    Task<List<Chapter>> GetByCourseIdAsync(int courseId);
    Task<Chapter?> GetByIdAsync(int id);
    Task AddAsync(Chapter chapter);
    Task UpdateAsync(Chapter chapter);
    Task DeleteAsync(int id);
    Task SaveAsync();
}

public interface ILessonRepository
{
    Task<List<Lesson>> GetByChapterIdAsync(int chapterId);
    Task<Lesson?> GetByIdAsync(int id);
    Task AddAsync(Lesson lesson);
    Task UpdateAsync(Lesson lesson);
    Task DeleteAsync(int id);
    Task SaveAsync();
}

public interface ICourseContentRepository
{
    Task<List<CourseContent>> GetByLessonIdAsync(int lessonId);
    Task<CourseContent?> GetByIdAsync(int id);
    Task AddAsync(CourseContent content);
    Task UpdateAsync(CourseContent content);
    Task DeleteAsync(int id);
    Task SaveAsync();
}
