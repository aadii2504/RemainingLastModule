using System.ComponentModel.DataAnnotations;

namespace MyProject.Api.DTOs;

public class RegisterRequestDto
{
	[Required(ErrorMessage = "Name is required")]
	[MaxLength(100, ErrorMessage = "Name cannot exceed 100 characters")]
	public string Name { get; set; } = "";

	[Required(ErrorMessage = "Email is required")]
	[EmailAddress(ErrorMessage = "Invalid email format")]
	public string Email { get; set; } = "";

	[Required(ErrorMessage = "Password is required")]
	[MinLength(6, ErrorMessage = "Password must be at least 6 characters long")]
	[MaxLength(255, ErrorMessage = "Password cannot exceed 255 characters")]
	public string Password { get; set; } = "";
}