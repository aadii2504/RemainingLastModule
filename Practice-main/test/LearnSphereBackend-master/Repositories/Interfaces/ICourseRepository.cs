using MyProject.Api.Models;
namespace MyProject.Api.Repositories.Interfaces;

public interface ICourseRepository
{
    Task<IEnumerable<Course>> GetAllAsync();
    Task<Course?> GetByIdAsync(int id);
    Task<Course> AddAsync(Course course);
    Task<Course?> UpdateAsync(int id, Course course);
    Task<bool> RemoveAsync(int id);
}
