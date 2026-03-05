namespace MyProject.Api.Models;

public class User
{
	public Guid Id { get; set; } = Guid.NewGuid();

	public string Name { get; set; } = "";
	public string Email { get; set; } = "";
	public string PasswordHash { get; set; } = "";

	public string Role { get; set; } = "student";
	public string Status { get; set; } = "active"; // active, inactive

	public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

	public Student? StudentProfile { get; set; }
}
