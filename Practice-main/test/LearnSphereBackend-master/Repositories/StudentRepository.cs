// File: Repositories/StudentRepository.cs
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using MyProject.Api.Data;
using MyProject.Api.Models;
using MyProject.Api.Repositories.Interfaces;

namespace MyProject.Api.Repositories
{
	public class StudentRepository : IStudentRepository
	{
		private readonly AppDbContext _db;

		public StudentRepository(AppDbContext db)
		{
			_db = db;
		}

		// -----------------------
		// Queries
		// -----------------------

		public async Task<List<Student>> GetAllAsync()
		{
			return await _db.Students.AsNoTracking().ToListAsync();
		}

		public async Task<List<Student>> GetAllAsync(CancellationToken ct)
		{
			return await _db.Students.AsNoTracking().ToListAsync(ct);
		}

		public async Task<Student?> GetByIdAsync(Guid id)
		{
			return await _db.Students.FindAsync(id);
		}

		public async Task<Student?> GetByIdAsync(Guid id, CancellationToken ct)
		{
			// FindAsync doesn't accept CT in the simple overload; use a query:
			return await _db.Students.FirstOrDefaultAsync(s => s.Id == id, ct);
		}

		// Default: no-tracking
		public async Task<Student?> GetByUserIdAsync(Guid userId)
		{
			return await _db.Students.AsNoTracking().Include(s => s.User).FirstOrDefaultAsync(s => s.UserId == userId);
		}

		public async Task<Student?> GetByUserIdAsync(Guid userId, CancellationToken ct)
		{
			return await _db.Students.AsNoTracking().Include(s => s.User).FirstOrDefaultAsync(s => s.UserId == userId, ct);
		}

		// With tracking switch
		public async Task<Student?> GetByUserIdAsync(Guid userId, bool asNoTracking)
		{
			var query = _db.Students.Include(s => s.User).AsQueryable();
			if (asNoTracking) query = query.AsNoTracking();
			return await query.FirstOrDefaultAsync(s => s.UserId == userId);
		}

		public async Task<Student?> GetByUserIdAsync(Guid userId, bool asNoTracking, CancellationToken ct)
		{
			var query = _db.Students.Include(s => s.User).AsQueryable();
			if (asNoTracking) query = query.AsNoTracking();
			return await query.FirstOrDefaultAsync(s => s.UserId == userId, ct);
		}

		// Explicit tracked (good for updates)
		public async Task<Student?> GetByUserIdTrackedAsync(Guid userId)
		{
			return await _db.Students.Include(s => s.User).FirstOrDefaultAsync(s => s.UserId == userId);
		}

		public async Task<Student?> GetByUserIdTrackedAsync(Guid userId, CancellationToken ct)
		{
			return await _db.Students.Include(s => s.User).FirstOrDefaultAsync(s => s.UserId == userId, ct);
		}

		// -----------------------
		// Commands
		// -----------------------

		public async Task AddAsync(Student student)
		{
			_db.Students.Add(student);
			await _db.SaveChangesAsync();
		}

		public async Task AddAsync(Student student, bool saveChanges)
		{
			_db.Students.Add(student);
			if (saveChanges)
			{
				await _db.SaveChangesAsync();
			}
		}

		public async Task AddAsync(Student student, CancellationToken ct)
		{
			await _db.Students.AddAsync(student, ct);
			await _db.SaveChangesAsync(ct);
		}

		public async Task UpdateAsync(Student student)
		{
			_db.Students.Update(student);
			await _db.SaveChangesAsync();
		}

		public async Task UpdateAsync(Student student, CancellationToken ct)
		{
			_db.Students.Update(student);
			await _db.SaveChangesAsync(ct);
		}

		public async Task DeleteAsync(Guid id)
		{
			var existing = await _db.Students.FindAsync(id);
			if (existing != null)
			{
				_db.Students.Remove(existing);
				await _db.SaveChangesAsync();
			}
		}

		public async Task DeleteAsync(Guid id, CancellationToken ct)
		{
			var existing = await _db.Students.FirstOrDefaultAsync(s => s.Id == id, ct);
			if (existing != null)
			{
				_db.Students.Remove(existing);
				await _db.SaveChangesAsync(ct);
			}
		}

		// -----------------------
		// Save aliases
		// -----------------------
		public Task SaveAsync() => _db.SaveChangesAsync();
		public Task SaveChangesAsync() => _db.SaveChangesAsync();
		public Task SaveChangesAsync(CancellationToken ct) => _db.SaveChangesAsync(ct);
	}
}
