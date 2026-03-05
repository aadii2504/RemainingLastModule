using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using MyProject.Api.Models;

namespace MyProject.Api.Data;

public class AppDbContext : DbContext
{
	public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

	public DbSet<User> Users => Set<User>();
	public DbSet<Student> Students => Set<Student>();
	public DbSet<Course> Courses => Set<Course>();
	public DbSet<Enrollment> Enrollments => Set<Enrollment>();
	public DbSet<Chapter> Chapters => Set<Chapter>();
	public DbSet<Lesson> Lessons => Set<Lesson>();
	public DbSet<CourseContent> CourseContents => Set<CourseContent>();

	// Quiz
	public DbSet<Quiz> Quizzes => Set<Quiz>();
	public DbSet<QuizQuestion> QuizQuestions => Set<QuizQuestion>();
	public DbSet<QuizAttempt> QuizAttempts => Set<QuizAttempt>();

	// Assessment
	public DbSet<Assessment> Assessments => Set<Assessment>();
	public DbSet<AssessmentQuestion> AssessmentQuestions => Set<AssessmentQuestion>();
	public DbSet<AssessmentAttempt> AssessmentAttempts => Set<AssessmentAttempt>();

	// Progress
	public DbSet<LessonProgress> LessonProgresses => Set<LessonProgress>();

	// Live Sessions
	public DbSet<LiveSession> LiveSessions => Set<LiveSession>();
	public DbSet<LiveSessionAttendance> LiveSessionAttendances => Set<LiveSessionAttendance>();

	protected override void OnModelCreating(ModelBuilder modelBuilder)
	{
		// Unique Email
		modelBuilder.Entity<User>()
			.HasIndex(u => u.Email)
			.IsUnique();

		// 1-1 relation: User <-> Student
		modelBuilder.Entity<User>()
			.HasOne(u => u.StudentProfile)
			.WithOne(s => s.User!)
			.HasForeignKey<Student>(s => s.UserId);

		// 1-N relation: Student <-> Enrollment
		modelBuilder.Entity<Student>()
			.HasMany(s => s.Enrollments)
			.WithOne(e => e.Student!)
			.HasForeignKey(e => e.StudentId)
			.OnDelete(DeleteBehavior.Cascade);

		// 1-N relation: Course <-> Enrollment
		modelBuilder.Entity<Course>()
			.HasMany(c => c.Enrollments)
			.WithOne(e => e.Course!)
			.HasForeignKey(e => e.CourseId)
			.OnDelete(DeleteBehavior.Cascade);

		// Unique constraint: one enrollment per student per course
		modelBuilder.Entity<Enrollment>()
			.HasIndex(e => new { e.StudentId, e.CourseId })
			.IsUnique();

		// 1-N relation: Course <-> Chapter
		modelBuilder.Entity<Course>()
			.HasMany(c => c.Chapters)
			.WithOne(c => c.Course!)
			.HasForeignKey(c => c.CourseId)
			.OnDelete(DeleteBehavior.Cascade);

		// 1-N relation: Chapter <-> Lesson
		modelBuilder.Entity<Chapter>()
			.HasMany(c => c.Lessons)
			.WithOne(l => l.Chapter!)
			.HasForeignKey(l => l.ChapterId)
			.OnDelete(DeleteBehavior.Cascade);

		// 1-N relation: Lesson <-> CourseContent
		modelBuilder.Entity<Lesson>()
			.HasMany(l => l.Contents)
			.WithOne(cc => cc.Lesson!)
			.HasForeignKey(cc => cc.LessonId)
			.OnDelete(DeleteBehavior.Cascade);

		// 1-N relation: Chapter <-> Quiz
		modelBuilder.Entity<Chapter>()
			.HasMany(c => c.Quizzes)
			.WithOne(q => q.Chapter!)
			.HasForeignKey(q => q.ChapterId)
			.OnDelete(DeleteBehavior.Cascade);

		// 1-N relation: Quiz <-> QuizQuestion
		modelBuilder.Entity<Quiz>()
			.HasMany(q => q.Questions)
			.WithOne(qq => qq.Quiz!)
			.HasForeignKey(qq => qq.QuizId)
			.OnDelete(DeleteBehavior.Cascade);

		// 1-N relation: Student <-> QuizAttempt
		modelBuilder.Entity<Student>()
			.HasMany<QuizAttempt>()
			.WithOne(qa => qa.Student!)
			.HasForeignKey(qa => qa.StudentId)
			.OnDelete(DeleteBehavior.NoAction);

		// 1-N relation: Quiz <-> QuizAttempt
		modelBuilder.Entity<Quiz>()
			.HasMany<QuizAttempt>()
			.WithOne(qa => qa.Quiz!)
			.HasForeignKey(qa => qa.QuizId)
			.OnDelete(DeleteBehavior.Cascade);

		// 1-1 relation: Course <-> Assessment
		modelBuilder.Entity<Course>()
			.HasOne<Assessment>()
			.WithOne(a => a.Course!)
			.HasForeignKey<Assessment>(a => a.CourseId)
			.OnDelete(DeleteBehavior.Cascade);

		// 1-N relation: Assessment <-> AssessmentQuestion
		modelBuilder.Entity<Assessment>()
			.HasMany(a => a.Questions)
			.WithOne(aq => aq.Assessment!)
			.HasForeignKey(aq => aq.AssessmentId)
			.OnDelete(DeleteBehavior.Cascade);

		// 1-N relation: Assessment <-> AssessmentAttempt
		modelBuilder.Entity<Assessment>()
			.HasMany(a => a.Attempts)
			.WithOne(aa => aa.Assessment!)
			.HasForeignKey(aa => aa.AssessmentId)
			.OnDelete(DeleteBehavior.Cascade);

		// 1-N relation: Student <-> AssessmentAttempt
		modelBuilder.Entity<Student>()
			.HasMany<AssessmentAttempt>()
			.WithOne(aa => aa.Student!)
			.HasForeignKey(aa => aa.StudentId)
			.OnDelete(DeleteBehavior.NoAction);

		// LessonProgress: unique per student per lesson
		modelBuilder.Entity<LessonProgress>()
			.HasIndex(lp => new { lp.StudentId, lp.LessonId })
			.IsUnique();

		modelBuilder.Entity<LessonProgress>()
			.HasOne(lp => lp.Student)
			.WithMany()
			.HasForeignKey(lp => lp.StudentId)
			.OnDelete(DeleteBehavior.NoAction);

		modelBuilder.Entity<LessonProgress>()
			.HasOne(lp => lp.Lesson)
			.WithMany()
			.HasForeignKey(lp => lp.LessonId)
			.OnDelete(DeleteBehavior.Cascade);

		// DateOnly conversion for SQL Server
		var converter = new ValueConverter<DateOnly?, DateTime?>(
			d => d.HasValue ? d.Value.ToDateTime(TimeOnly.MinValue) : null,
			d => d.HasValue ? DateOnly.FromDateTime(d.Value) : null
		);

		modelBuilder.Entity<Student>()
			.Property(s => s.DateOfBirth)
			.HasConversion(converter);

		modelBuilder.Entity<Course>()
			.Property(c => c.Price)
			.HasPrecision(18, 2);

		// 1-N relation: Course <-> LiveSession
		modelBuilder.Entity<Course>()
			.HasMany(c => c.LiveSessions)
			.WithOne(ls => ls.Course!)
			.HasForeignKey(ls => ls.CourseId)
			.OnDelete(DeleteBehavior.SetNull);

		// 1-N relation: LiveSession <-> LiveSessionAttendance
		modelBuilder.Entity<LiveSessionAttendance>()
			.HasOne(lsa => lsa.LiveSession)
			.WithMany()
			.HasForeignKey(lsa => lsa.LiveSessionId)
			.OnDelete(DeleteBehavior.Cascade);

		// Unique constraint for Attendance
		modelBuilder.Entity<LiveSessionAttendance>()
			.HasIndex(a => new { a.LiveSessionId, a.StudentId })
			.IsUnique();

		// Global UTC DateTime converter for SQL Server
		var dateTimeConverter = new ValueConverter<DateTime, DateTime>(
			v => v.Kind == DateTimeKind.Utc ? v : v.ToUniversalTime(),
			v => DateTime.SpecifyKind(v, DateTimeKind.Utc)
		);

		foreach (var entityType in modelBuilder.Model.GetEntityTypes())
		{
			foreach (var property in entityType.GetProperties())
			{
				if (property.ClrType == typeof(DateTime) || property.ClrType == typeof(DateTime?))
				{
					property.SetValueConverter(dateTimeConverter);
				}
			}
		}

		base.OnModelCreating(modelBuilder);
	}
}