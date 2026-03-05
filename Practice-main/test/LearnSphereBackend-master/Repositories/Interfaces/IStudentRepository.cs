// File: Repositories/Interfaces/IStudentRepository.cs
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using MyProject.Api.Models;

namespace MyProject.Api.Repositories.Interfaces
{
	public interface IStudentRepository
	{
		// -------- Queries --------
		Task<List<Student>> GetAllAsync();
		Task<List<Student>> GetAllAsync(CancellationToken ct);

		Task<Student?> GetByIdAsync(Guid id);
		Task<Student?> GetByIdAsync(Guid id, CancellationToken ct);

		// Default (no-tracking)
		Task<Student?> GetByUserIdAsync(Guid userId);
		Task<Student?> GetByUserIdAsync(Guid userId, CancellationToken ct);

		// With tracking switch
		Task<Student?> GetByUserIdAsync(Guid userId, bool asNoTracking);
		Task<Student?> GetByUserIdAsync(Guid userId, bool asNoTracking, CancellationToken ct);

		// Explicit tracked (for updates)
		Task<Student?> GetByUserIdTrackedAsync(Guid userId);
		Task<Student?> GetByUserIdTrackedAsync(Guid userId, CancellationToken ct);

		// -------- Commands --------
		Task AddAsync(Student student);                              // save immediately
		Task AddAsync(Student student, bool saveChanges);            // optional immediate save
		Task AddAsync(Student student, CancellationToken ct);        // save immediately with CT

		Task UpdateAsync(Student student);                           // save immediately
		Task UpdateAsync(Student student, CancellationToken ct);     // save immediately with CT

		Task DeleteAsync(Guid id);                                   // save immediately
		Task DeleteAsync(Guid id, CancellationToken ct);             // save immediately with CT

		// -------- Save aliases --------
		Task SaveAsync();
		Task SaveChangesAsync();
		Task SaveChangesAsync(CancellationToken ct);
	}
}