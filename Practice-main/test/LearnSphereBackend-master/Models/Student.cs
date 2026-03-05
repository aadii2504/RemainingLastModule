namespace MyProject.Api.Models;

public class Student
{
	public Guid Id { get; set; } = Guid.NewGuid();

	public Guid UserId { get; set; }
	public User? User { get; set; }

	// Personal
	public string FullName { get; set; } = "";
	public DateOnly? DateOfBirth { get; set; }
	public string? Gender { get; set; }
	public string Email { get; set; } = "";
	public string? Country { get; set; }
	public string? Phone { get; set; }

	// Academic
	public string? RollNumber { get; set; }
	public string? Course { get; set; }
	public int? Year { get; set; }

	// Guardian
	public string? GuardianName { get; set; }
	public string? GuardianPhone { get; set; }
	public string? GuardianEmail { get; set; }
	public string? GuardianAddress { get; set; }

	// Enrollments
	public ICollection<Enrollment> Enrollments { get; set; } = new List<Enrollment>();
}