using Microsoft.EntityFrameworkCore;
using MyProject.Api.Data;
using MyProject.Api.Models;
using MyProject.Api.Repositories.Interfaces;

namespace MyProject.Api.Repositories;

public class EnrollmentRepository : IEnrollmentRepository
{
    private readonly AppDbContext _context;

    public EnrollmentRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<Enrollment?> GetByStudentAndCourseAsync(Guid studentId, int courseId)
    {
        return await _context.Enrollments
            .FirstOrDefaultAsync(e => e.StudentId == studentId && e.CourseId == courseId);
    }

    public async Task<List<Enrollment>> GetStudentEnrollmentsAsync(Guid studentId)
    {
        return await _context.Enrollments
            .Where(e => e.StudentId == studentId)
            .Include(e => e.Course)
            .ToListAsync();
    }

    public async Task<List<Course>> GetStudentCoursesAsync(Guid studentId)
    {
        return await _context.Enrollments
            .Where(e => e.StudentId == studentId)
            .Include(e => e.Course)
            .Select(e => e.Course!)
            .ToListAsync();
    }

    public async Task<Enrollment> AddAsync(Enrollment enrollment)
    {
        _context.Enrollments.Add(enrollment);
        await _context.SaveChangesAsync();
        return enrollment;
    }

    public async Task RemoveAsync(Enrollment enrollment)
    {
        _context.Enrollments.Remove(enrollment);
        await _context.SaveChangesAsync();
    }

    public async Task SaveAsync()
    {
        await _context.SaveChangesAsync();
    }
}
