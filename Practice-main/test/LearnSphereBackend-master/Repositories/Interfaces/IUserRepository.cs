using MyProject.Api.Models;

namespace MyProject.Api.Repositories.Interfaces;

public interface IUserRepository
{
	Task<bool> EmailExistsAsync(string email, CancellationToken ct);
	Task<User?> GetByEmailAsync(string email, CancellationToken ct);
	Task<IEnumerable<User>> GetAllAsync();
	Task AddAsync(User user, CancellationToken ct);
	Task SaveChangesAsync(CancellationToken ct);
}