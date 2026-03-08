using System.ComponentModel.DataAnnotations;

namespace MyProject.Api.DTOs;

public class ResetPasswordRequestDto
{
	[Required(ErrorMessage = "Email is required")]
	[EmailAddress(ErrorMessage = "Invalid email format")]
	public string Email { get; set; } = "";

	[Required(ErrorMessage = "New password is required")]
	[MinLength(6, ErrorMessage = "Password must be at least 6 characters long")]
	[MaxLength(255, ErrorMessage = "Password cannot exceed 255 characters")]
	public string NewPassword { get; set; } = "";
}
