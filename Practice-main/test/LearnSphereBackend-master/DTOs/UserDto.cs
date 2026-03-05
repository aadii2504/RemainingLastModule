namespace MyProject.Api.DTOs;

public class UserDto
{
	public Guid Id { get; set; }
	public string Name { get; set; } = "";
	public string Email { get; set; } = "";
	public string Role { get; set; } = "student";
	public string Status { get; set; } = "active";
	public DateTime CreatedAt { get; set; }
	public StudentMeResponseDto? StudentProfile { get; set; }
}