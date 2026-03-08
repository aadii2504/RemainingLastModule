using Moq;
using Xunit;
using MyProject.Api.DTOs;
using MyProject.Api.Models;
using MyProject.Api.Repositories.Interfaces;
using MyProject.Api.Services;
using MyProject.Api.Services.Interfaces;
using Microsoft.AspNetCore.Identity;

namespace LearnSphereBackend.Tests;

public class AuthServiceTests
{
    private readonly Mock<IUserRepository> _mockUsers;
    private readonly Mock<IStudentRepository> _mockStudents;
    private readonly Mock<IJwtTokenService> _mockJwt;
    private readonly PasswordHasher<User> _hasher;
    private readonly AuthService _service;

    public AuthServiceTests()
    {
        _mockUsers = new Mock<IUserRepository>();
        _mockStudents = new Mock<IStudentRepository>();
        _mockJwt = new Mock<IJwtTokenService>();
        _hasher = new PasswordHasher<User>();

        _service = new AuthService(_mockUsers.Object, _mockStudents.Object, _mockJwt.Object);
    }

    [Fact]
    public async Task LoginAsync_ValidCredentials_ReturnsAuthResponse()
    {
        // Arrange
        var password = "password123";
        var user = new User
        {
            Id = Guid.NewGuid(),
            Name = "Test User",
            Email = "test@example.com",
            Role = "user",
            Status = "active"
        };
        user.PasswordHash = _hasher.HashPassword(user, password);

        _mockUsers.Setup(r => r.GetByEmailAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);
        
        _mockJwt.Setup(j => j.CreateToken(It.IsAny<User>()))
            .Returns("fake-jwt-token");

        var request = new LoginRequestDto { Email = "test@example.com", Password = password };

        // Act
        var result = await _service.LoginAsync(request, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("Test User", result.Name);
        Assert.Equal("test@example.com", result.Email);
        Assert.Equal("fake-jwt-token", result.Token);
    }

    [Fact]
    public async Task LoginAsync_InvalidEmail_ThrowsUnauthorizedAccessException()
    {
        // Arrange
        _mockUsers.Setup(r => r.GetByEmailAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((User)null!); // Mock user not found

        var request = new LoginRequestDto { Email = "nonexistent@example.com", Password = "wrongpassword" };

        // Act & Assert
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() => 
            _service.LoginAsync(request, CancellationToken.None));
    }

    [Fact]
    public async Task LoginAsync_DeactivatedAccount_ThrowsUnauthorizedAccessException()
    {
        // Arrange
        var user = new User { Email = "test@example.com", Status = "inactive" };
        _mockUsers.Setup(r => r.GetByEmailAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);

        var request = new LoginRequestDto { Email = "test@example.com", Password = "password123" };

        // Act & Assert
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() => 
            _service.LoginAsync(request, CancellationToken.None));
    }

    [Fact]
    public async Task LoginAsync_InvalidPassword_ThrowsUnauthorizedAccessException()
    {
        // Arrange
        var password = "password123";
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = "test@example.com",
            Status = "active"
        };
        // Hash a different password than what will be provided
        user.PasswordHash = _hasher.HashPassword(user, "differentpassword");

        _mockUsers.Setup(r => r.GetByEmailAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);

        var request = new LoginRequestDto { Email = "test@example.com", Password = password };

        // Act & Assert
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() => 
            _service.LoginAsync(request, CancellationToken.None));
    }

    [Fact]
    public async Task RegisterAsync_ValidRequest_ReturnsAuthResponse()
    {
        // Arrange
        _mockUsers.Setup(r => r.EmailExistsAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);
            
        _mockJwt.Setup(j => j.CreateToken(It.IsAny<User>()))
            .Returns("fake-jwt-token");

        var request = new RegisterRequestDto 
        { 
            Name = "New Student",
            Email = "newstudent@example.com",
            Password = "password123"
        };

        // Act
        var result = await _service.RegisterAsync(request, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("New Student", result.Name);
        Assert.Equal("newstudent@example.com", result.Email);
        Assert.Equal("student", result.Role);
        Assert.Equal("fake-jwt-token", result.Token);

        _mockUsers.Verify(r => r.AddAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()), Times.Once);
        _mockStudents.Verify(r => r.AddAsync(It.IsAny<Student>(), It.IsAny<CancellationToken>()), Times.Once);
        _mockUsers.Verify(r => r.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task RegisterAsync_ExistingEmail_ThrowsInvalidOperationException()
    {
        // Arrange
        _mockUsers.Setup(r => r.EmailExistsAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        var request = new RegisterRequestDto 
        { 
            Name = "Existing Student",
            Email = "existing@example.com",
            Password = "password123"
        };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => 
            _service.RegisterAsync(request, CancellationToken.None));
            
        Assert.Equal("Email already exists", ex.Message);
        
        // Ensure nothing was saved
        _mockUsers.Verify(r => r.AddAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()), Times.Never);
    }
}
