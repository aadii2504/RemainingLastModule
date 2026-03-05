using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MyProject.Api.DTOs;
using MyProject.Api.Repositories.Interfaces;

namespace MyProject.Api.Controllers;

[ApiController]
[Route("api/users")]
public class UsersController : ControllerBase
{
	private readonly IUserRepository _repo;

	public UsersController(IUserRepository repo)
	{
		_repo = repo;
	}

	/// <summary>
	/// Get all users (admin only)
	/// </summary>
	[HttpGet]
	[Authorize]
	public async Task<IActionResult> GetAll()
	{
		// Check if user is admin
		if (!User.Identity?.IsAuthenticated ?? true)
			return StatusCode(401, new { error = "Unauthorized" });

		if (!User.IsInRole("admin"))
			return StatusCode(403, new { error = "Only admins can view users" });

		var users = await _repo.GetAllAsync();
		var dtos = users.Select(u => new UserDto
		{
			Id = u.Id,
			Name = u.Name,
			Email = u.Email,
			Role = u.Role,
			Status = u.Status,
			CreatedAt = u.CreatedAt,
			StudentProfile = u.StudentProfile == null ? null : new StudentMeResponseDto
			{
				FullName = u.StudentProfile.FullName,
				DateOfBirth = u.StudentProfile.DateOfBirth,
				Gender = u.StudentProfile.Gender,
				Email = u.StudentProfile.Email,
				Country = u.StudentProfile.Country,
				Phone = u.StudentProfile.Phone,
				RollNumber = u.StudentProfile.RollNumber,
				Course = u.StudentProfile.Course,
				Year = u.StudentProfile.Year,
				GuardianName = u.StudentProfile.GuardianName,
				GuardianPhone = u.StudentProfile.GuardianPhone,
				GuardianEmail = u.StudentProfile.GuardianEmail,
				GuardianAddress = u.StudentProfile.GuardianAddress
			}
		});

		return Ok(dtos);
	}

	/// <summary>
	/// Update user status (admin only)
	/// </summary>
	[HttpPut("{id}/status")]
	[Authorize]
	public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateUserStatusRequestDto req, CancellationToken ct = default)
	{
		// Check if user is admin
		if (!User.Identity?.IsAuthenticated ?? true)
			return StatusCode(401, new { error = "Unauthorized" });

		if (!User.IsInRole("admin"))
			return StatusCode(403, new { error = "Only admins can update user status" });

		var user = await _repo.GetAllAsync();
		var targetUser = user.FirstOrDefault(u => u.Id == id);
		if (targetUser == null)
			return NotFound(new { error = "User not found" });

		if (req.Status != "active" && req.Status != "inactive")
			return BadRequest(new { error = "Invalid status" });

		targetUser.Status = req.Status;
		await _repo.SaveChangesAsync(ct);

		return Ok(new { message = "Status updated successfully" });
	}
}