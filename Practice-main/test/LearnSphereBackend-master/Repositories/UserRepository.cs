using Microsoft.EntityFrameworkCore;
using MyProject.Api.Data;
using MyProject.Api.Models;
using MyProject.Api.Repositories.Interfaces;

namespace MyProject.Api.Repositories;

public class UserRepository : IUserRepository
{
	private readonly AppDbContext _db;

	public UserRepository(AppDbContext db) => _db = db;

	public Task<bool> EmailExistsAsync(string email, CancellationToken ct) =>
		_db.Users.AnyAsync(u => u.Email == email, ct);

	public Task<User?> GetByEmailAsync(string email, CancellationToken ct) =>
		_db.Users.FirstOrDefaultAsync(u => u.Email == email, ct);

	public Task<IEnumerable<User>> GetAllAsync() =>
		_db.Users.Include(u => u.StudentProfile).ToListAsync().ContinueWith(t => t.Result.AsEnumerable());

	public Task AddAsync(User user, CancellationToken ct) =>
		_db.Users.AddAsync(user, ct).AsTask();

	public Task SaveChangesAsync(CancellationToken ct) =>
		_db.SaveChangesAsync(ct);
}