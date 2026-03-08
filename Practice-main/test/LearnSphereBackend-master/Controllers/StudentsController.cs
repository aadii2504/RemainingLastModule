using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MyProject.Api.DTOs;
using MyProject.Api.Models;
using MyProject.Api.Repositories.Interfaces;

namespace MyProject.Api.Controllers;

[ApiController]
[Route("api/students")]
public class StudentsController : ControllerBase
{
	private readonly IStudentRepository _students;
	private readonly IEnrollmentRepository _enrollments;
	private readonly ICourseRepository _courses;
	private readonly ILogger<StudentsController> _logger;

	public StudentsController(IStudentRepository students, IEnrollmentRepository enrollments, ICourseRepository courses, ILogger<StudentsController> logger)
	{
		_students = students;
		_enrollments = enrollments;
		_courses = courses;
		_logger = logger;
	}

	[Authorize]
	[HttpGet("me")]
	public async Task<ActionResult<StudentMeResponseDto>> GetMe(CancellationToken ct)
	{
		var idStr = User.FindFirstValue(ClaimTypes.NameIdentifier)
				 ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub);

		if (!Guid.TryParse(idStr, out var userId))
			return Unauthorized("Invalid token");

		var s = await _students.GetByUserIdAsync(userId, ct);
		
		if (s is null)
		{
			// Auto-create basic profile if missing (e.g. for users created before auto-creation was added)
			// But we need the Name and Email. We can get them from Claims.
			var name = User.FindFirstValue(ClaimTypes.Name) ?? "Student";
			var email = User.FindFirstValue(ClaimTypes.Email) ?? "";

			s = new Student
			{
				UserId = userId,
				FullName = name,
				Email = email
			};
			await _students.AddAsync(s, ct);
			s = await _students.GetByUserIdAsync(userId, ct); // Re-fetch to get User relation
		}

		if (s is null) return NotFound("Student profile not found");

		return Ok(ToMeDto(s));
	}

	// ✅ NEW: Upsert profile for current user
	[Authorize]
	[HttpPost("me")]
	public async Task<ActionResult<StudentMeResponseDto>> UpsertMe(
		[FromBody] StudentMeUpsertRequestDto req,
		CancellationToken ct)
	{
		var idStr = User.FindFirstValue(ClaimTypes.NameIdentifier)
				 ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub);

		if (!Guid.TryParse(idStr, out var userId))
			return Unauthorized("Invalid token");

		var s = await _students.GetByUserIdTrackedAsync(userId, ct);

		if (s is null)
		{
			// create if missing
			s = new Student
			{
				UserId = userId,
				FullName = req.FullName ?? "",
				Email = req.Email ?? ""
			};

			await _students.AddAsync(s, ct);
			s = await _students.GetByUserIdTrackedAsync(userId, ct);
		}

		if (s is null) return NotFound("Failed to initialize student profile");

		// Update only non-null fields
		if (req.FullName is not null) s.FullName = req.FullName;
		if (req.DateOfBirth is not null) s.DateOfBirth = req.DateOfBirth;
		if (req.Gender is not null) s.Gender = req.Gender;
		if (req.Email is not null) s.Email = req.Email;
		if (req.Country is not null) s.Country = req.Country;
		if (req.Phone is not null) s.Phone = req.Phone;

		if (req.RollNumber is not null) s.RollNumber = req.RollNumber;
		if (req.Course is not null) s.Course = req.Course;
		if (req.Year is not null) s.Year = req.Year;

		if (req.GuardianName is not null) s.GuardianName = req.GuardianName;
		if (req.GuardianPhone is not null) s.GuardianPhone = req.GuardianPhone;
		if (req.GuardianEmail is not null) s.GuardianEmail = req.GuardianEmail;
		if (req.GuardianAddress is not null) s.GuardianAddress = req.GuardianAddress;

		await _students.SaveChangesAsync(ct);

		var reloaded = await _students.GetByUserIdAsync(userId, ct);
		return Ok(ToMeDto(reloaded ?? s));
	}

	private static StudentMeResponseDto ToMeDto(Student s) => new()
	{
		FullName = s.FullName,
		DateOfBirth = s.DateOfBirth,
		Gender = s.Gender,
		Email = s.Email,
		Country = s.Country,
		Phone = s.Phone,
		RollNumber = s.RollNumber,
		Course = s.Course,
		Year = s.Year,
		GuardianName = s.GuardianName,
		GuardianPhone = s.GuardianPhone,
		GuardianEmail = s.GuardianEmail,
		GuardianAddress = s.GuardianAddress,
		RegistrationDate = s.User?.CreatedAt.ToString("yyyy-MM-dd") ?? "—"
	};

	// ✅ NEW: Enroll in a course
	[Authorize]
	[HttpPost("me/enroll")]
	public async Task<ActionResult<CourseDto>> EnrollInCourse(
		[FromBody] EnrollmentRequestDto req,
		CancellationToken ct)
	{
		var idStr = User.FindFirstValue(ClaimTypes.NameIdentifier)
				 ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub);

		if (!Guid.TryParse(idStr, out var userId))
			return Unauthorized("Invalid token");

		var student = await _students.GetByUserIdAsync(userId, ct);
		if (student is null)
			return NotFound("Student profile not found");

		// Check if already enrolled
		var existing = await _enrollments.GetByStudentAndCourseAsync(student.Id, req.CourseId);
		if (existing is not null)
			return BadRequest("Already enrolled in this course");

		var enrollment = new Enrollment
		{
			StudentId = student.Id,
			CourseId = req.CourseId,
			Status = "active"
		};

		await _enrollments.AddAsync(enrollment);

        var course = await _courses.GetByIdAsync(req.CourseId);
		_logger.LogInformation("student - {Email} enrolled in course - {CourseName}", student.Email, course?.Title ?? "Unknown");

		return Ok(new { message = "Enrolled successfully" });
	}

	[Authorize]
	[HttpGet("me/courses")]
	public async Task<ActionResult<List<CourseDto>>> GetEnrolledCourses(CancellationToken ct)
	{
		var idStr = User.FindFirstValue(ClaimTypes.NameIdentifier)
				 ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub);

		if (!Guid.TryParse(idStr, out var userId))
			return Unauthorized("Invalid token");

		var student = await _students.GetByUserIdAsync(userId, ct);
		if (student is null)
			return NotFound("Student profile not found");

		var enrollments = await _enrollments.GetStudentEnrollmentsAsync(student.Id);
		var courseDtos = enrollments.Select(e => new CourseDto
		{
			Id = e.Course!.Id,
			Title = e.Course.Title,
			Slug = e.Course.Slug,
			Summary = e.Course.Summary,
			Description = e.Course.Description,
			Thumbnail = e.Course.Thumbnail,
			Categories = e.Course.Categories,
			Duration = e.Course.Duration,
			Level = e.Course.Level,
			Price = e.Course.Price,
			Status = e.Status // Now using enrollment status
		}).ToList();

		return Ok(courseDtos);
	}

	// ✅ NEW: Unenroll from a course
	[Authorize]
	[HttpDelete("me/courses/{courseId}")]
	public async Task<ActionResult> UnenrollFromCourse(int courseId, CancellationToken ct)
	{
		var idStr = User.FindFirstValue(ClaimTypes.NameIdentifier)
				 ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub);

		if (!Guid.TryParse(idStr, out var userId))
			return Unauthorized("Invalid token");

		var student = await _students.GetByUserIdAsync(userId, ct);
		if (student is null)
			return NotFound("Student profile not found");

		var enrollment = await _enrollments.GetByStudentAndCourseAsync(student.Id, courseId);
		if (enrollment is null)
			return NotFound("Enrollment not found");

		await _enrollments.RemoveAsync(enrollment);
		return Ok(new { message = "Unenrolled successfully" });
	}
}
