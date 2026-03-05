using Microsoft.AspNetCore.Identity;
using MyProject.Api.DTOs;
using MyProject.Api.Models;
using MyProject.Api.Repositories.Interfaces;
using MyProject.Api.Services.Interfaces;

namespace MyProject.Api.Services;

public class AuthService : IAuthService
{
	private readonly IUserRepository _users;
	private readonly IStudentRepository _students;
	private readonly IJwtTokenService _jwt;
	private readonly PasswordHasher<User> _hasher = new();
	private readonly ILogger<AuthService> _logger;

	public AuthService(IUserRepository users, IStudentRepository students, IJwtTokenService jwt, ILogger<AuthService> logger)
	{
		_users = users;
		_students = students;
		_jwt = jwt;
		_logger = logger;
	}

	public async Task<AuthResponseDto> RegisterAsync(RegisterRequestDto req, CancellationToken ct)
	{
		var email = req.Email.Trim().ToLower();

		if (await _users.EmailExistsAsync(email, ct))
			throw new InvalidOperationException("Email already exists");

		var user = new User
		{
			Name = req.Name.Trim(),
			Email = email,
			Role = "student",
			Status = "active",
			CreatedAt = DateTime.UtcNow
		};

		user.PasswordHash = _hasher.HashPassword(user, req.Password);

		await _users.AddAsync(user, ct);

		var student = new Student
		{
			UserId = user.Id,
			FullName = user.Name,
			Email = user.Email
		};

		await _students.AddAsync(student, ct);

		await _users.SaveChangesAsync(ct);

		_logger.LogInformation("New user signed up successfully. Email: {Email}", user.Email);

		return new AuthResponseDto
		{
			Token = _jwt.CreateToken(user),
			Name = user.Name,
			Email = user.Email,
			Role = user.Role
		};
	}

	public async Task<AuthResponseDto> LoginAsync(LoginRequestDto req, CancellationToken ct)
	{
		var email = req.Email.Trim().ToLower();

		var user = await _users.GetByEmailAsync(email, ct);
		if (user is null)
		{
			_logger.LogWarning("Sign in failed. Email not found: {Email}", email);
			throw new UnauthorizedAccessException("Invalid email or password");
		}

		if (user.Status != "active")
		{
			_logger.LogWarning("Sign in failed. Account deactivated: {Email}", email);
			throw new UnauthorizedAccessException("Account is deactivated");
		}

		var verify = _hasher.VerifyHashedPassword(user, user.PasswordHash, req.Password);
		if (verify == PasswordVerificationResult.Failed)
		{
			_logger.LogWarning("Sign in failed. Invalid password for email: {Email}", email);
			throw new UnauthorizedAccessException("Invalid email or password");
		}

		_logger.LogInformation("User signed in successfully with this email: {Email}", user.Email);

		return new AuthResponseDto
		{
			Token = _jwt.CreateToken(user),
			Name = user.Name,
			Email = user.Email,
			Role = user.Role
		};
	}
}