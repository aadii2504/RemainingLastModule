using Microsoft.EntityFrameworkCore;
using MyProject.Api.Data;
using MyProject.Api.Models;
using MyProject.Api.Repositories.Interfaces;

namespace MyProject.Api.Repositories;

public class CourseRepository : ICourseRepository
{
    private readonly AppDbContext _db;
    public CourseRepository(AppDbContext db) { _db = db; }

    public async Task<Course> AddAsync(Course course)
    {
        _db.Courses.Add(course);
        await _db.SaveChangesAsync();
        return course;
    }

    public async Task<IEnumerable<Course>> GetAllAsync()
    {
        return await _db.Courses.AsNoTracking().OrderByDescending(c => c.CreatedAt).ToListAsync();
    }

    public async Task<Course?> GetByIdAsync(int id)
    {
        return await _db.Courses.FindAsync(id);
    }

    public async Task<bool> RemoveAsync(int id)
    {
        var item = await _db.Courses.FindAsync(id);
        if (item == null) return false;
        _db.Courses.Remove(item);
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<Course?> UpdateAsync(int id, Course course)
    {
        var existing = await _db.Courses.FindAsync(id);
        if (existing == null) return null;

        existing.Title = course.Title;
        existing.Slug = course.Slug;
        existing.Summary = course.Summary;
        existing.Description = course.Description;
        existing.Thumbnail = course.Thumbnail;
        existing.Categories = course.Categories;
        existing.Duration = course.Duration;
        existing.Level = course.Level;
        existing.Price = course.Price;
        existing.Status = course.Status;
        existing.UpdatedAt = DateTime.UtcNow;

        _db.Courses.Update(existing);
        await _db.SaveChangesAsync();
        return existing;
    }
}
