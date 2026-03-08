using System.Text;
using Serilog;
using MyProject.Api.Middleware;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using MyProject.Api.Data;
using MyProject.Api.Repositories;
using MyProject.Api.Repositories.Interfaces;
using MyProject.Api.Services;
using MyProject.Api.Services.Interfaces;

// Configure Serilog
Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .WriteTo.File("logs/log-.txt", rollingInterval: RollingInterval.Day)
    .CreateLogger();

try
{
    Log.Information("Starting web application");

    var builder = WebApplication.CreateBuilder(args);

    // Add Serilog
    builder.Host.UseSerilog();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
	c.SwaggerDoc("v1", new OpenApiInfo { Title = "MyProject", Version = "v1" });

	c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
	{
		Name = "Authorization",
		Type = SecuritySchemeType.Http,
		Scheme = "bearer",
		BearerFormat = "JWT",
		In = ParameterLocation.Header,
		Description = "Paste ONLY the token in the Authorize box (do not type 'Bearer')."
	});

	c.AddSecurityRequirement(new OpenApiSecurityRequirement
	{
		{
			new OpenApiSecurityScheme
			{
				Reference = new OpenApiReference
				{
					Type = ReferenceType.SecurityScheme,
					Id = "Bearer"
				}
			},
			Array.Empty<string>()
		}
	});
});

// EF Core SQL Server
builder.Services.AddDbContext<AppDbContext>(options =>
	options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"))
);

// Repositories
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IStudentRepository, StudentRepository>();
builder.Services.AddScoped<ICourseRepository, CourseRepository>();
builder.Services.AddScoped<IEnrollmentRepository, EnrollmentRepository>();
builder.Services.AddScoped<IChapterRepository, ChapterRepository>();
builder.Services.AddScoped<ILessonRepository, LessonRepository>();
builder.Services.AddScoped<ICourseContentRepository, CourseContentRepository>();

// Services
builder.Services.AddScoped<IJwtTokenService, JwtTokenService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IAnalyticsService, AnalyticsService>();
builder.Services.AddScoped<IFileUploadService, FileUploadService>();

// JWT Authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
	.AddJwtBearer(options =>
	{
		var jwt = builder.Configuration.GetSection("Jwt");

		options.TokenValidationParameters = new TokenValidationParameters
		{
			ValidateIssuer = true,
			ValidateAudience = true,
			ValidateLifetime = true,
			ValidateIssuerSigningKey = true,

			ValidIssuer = jwt["Issuer"],
			ValidAudience = jwt["Audience"],
			IssuerSigningKey = new SymmetricSecurityKey(
				Encoding.UTF8.GetBytes(jwt["Key"]!)
			)
		};
	});

builder.Services.AddAuthorization();
builder.Services.AddCors(options =>
{
	options.AddPolicy("ViteCors", p =>
		p.WithOrigins("http://localhost:5173")
		 .AllowAnyHeader()
		 .AllowAnyMethod()
	);
});

var app = builder.Build();

// Create wwwroot/uploads directory if it doesn't exist
if (!string.IsNullOrEmpty(app.Environment.WebRootPath))
{
	var uploadsDir = Path.Combine(app.Environment.WebRootPath, "uploads");
	if (!Directory.Exists(uploadsDir))
		Directory.CreateDirectory(uploadsDir);
}

// Seed admin user on startup
await SeedDataService.SeedAdminUserAsync(app.Services);

app.UseCors("ViteCors");

// Serve static files
app.UseStaticFiles();

app.UseSwagger();
app.UseSwaggerUI();


// Add global exception handling middleware
    app.UseMiddleware<GlobalExceptionMiddleware>();

    app.UseAuthentication();
    app.UseAuthorization();

    app.MapControllers();
    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Application terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}