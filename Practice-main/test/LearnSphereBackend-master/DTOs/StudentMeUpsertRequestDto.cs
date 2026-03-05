namespace MyProject.Api.DTOs;

public class StudentMeUpsertRequestDto
{
	// Personal
	public string? FullName { get; set; }
	public DateOnly? DateOfBirth { get; set; }
	public string? Gender { get; set; }
	public string? Email { get; set; }
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
}