using MyProject.Api.Models;

namespace MyProject.Api.Repositories.Interfaces;

public interface IEnrollmentRepository
{
    Task<Enrollment?> GetByStudentAndCourseAsync(Guid studentId, int courseId);
    Task<List<Enrollment>> GetStudentEnrollmentsAsync(Guid studentId);
    Task<List<Course>> GetStudentCoursesAsync(Guid studentId);
    Task<Enrollment> AddAsync(Enrollment enrollment);
    Task RemoveAsync(Enrollment enrollment);
    Task SaveAsync();
}
