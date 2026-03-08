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
}
