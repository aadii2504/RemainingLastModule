using Microsoft.AspNetCore.Identity;
using MyProject.Api.Data;
using MyProject.Api.Models;

namespace MyProject.Api.Services;

public static class SeedDataService
{
    public static async Task SeedAdminUserAsync(IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // Check if admin already exists
        var adminUser = db.Users.FirstOrDefault(u => u.Email == "admin@example.com");
        var hasher = new PasswordHasher<User>();

        if (adminUser == null)
        {
            adminUser = new User
            {
                Name = "Admin",
                Email = "admin@example.com",
                Role = "admin",
                Status = "active"
            };
            adminUser.PasswordHash = hasher.HashPassword(adminUser, "Instructor@123");
            db.Users.Add(adminUser);
        }
        else
        {
            // Enforce admin role and status even if they registered manually
            adminUser.Role = "admin";
            adminUser.Status = "active";
            // Force reset password to ensure credentials work
            adminUser.PasswordHash = hasher.HashPassword(adminUser, "Instructor@123");
            db.Users.Update(adminUser);
        }

        await db.SaveChangesAsync();
    }
}
    