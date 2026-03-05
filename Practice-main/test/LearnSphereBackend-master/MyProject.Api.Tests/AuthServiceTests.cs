using Microsoft.Extensions.Logging;
using Moq;
using MyProject.Api.DTOs;
using MyProject.Api.Models;
using MyProject.Api.Repositories.Interfaces;
using MyProject.Api.Services;
using MyProject.Api.Services.Interfaces;
using System;
using System.Threading;
using System.Threading.Tasks;
using Xunit;

namespace MyProject.Api.Tests
{
    public class AuthServiceTests
    {
        private readonly Mock<IUserRepository> _mockUsers;
        private readonly Mock<IStudentRepository> _mockStudents;
        private readonly Mock<IJwtTokenService> _mockJwt;
        private readonly Mock<ILogger<AuthService>> _mockLogger;
        private readonly AuthService _authService;

        public AuthServiceTests()
        {
            _mockUsers = new Mock<IUserRepository>();
            _mockStudents = new Mock<IStudentRepository>();
            _mockJwt = new Mock<IJwtTokenService>();
            _mockLogger = new Mock<ILogger<AuthService>>();

            _authService = new AuthService(
                _mockUsers.Object,
                _mockStudents.Object,
                _mockJwt.Object,
                _mockLogger.Object
            );
        }

        [Fact]
        public async Task RegisterAsync_ValidRequest_RegistersUserAndReturnsToken()
        {
            // Arrange
            var req = new RegisterRequestDto
            {
                Name = "Test User",
                Email = "test@example.com",
                Password = "Password123!"
            };

            _mockUsers.Setup(r => r.EmailExistsAsync(req.Email, It.IsAny<CancellationToken>()))
                      .ReturnsAsync(false);
                      
            _mockJwt.Setup(j => j.CreateToken(It.IsAny<User>()))
                    .Returns("fake-jwt-token");

            // Act
            var result = await _authService.RegisterAsync(req, CancellationToken.None);

            // Assert
            Assert.NotNull(result);
            Assert.Equal("fake-jwt-token", result.Token);
            Assert.Equal("Test User", result.Name);
            Assert.Equal("test@example.com", result.Email);
            Assert.Equal("student", result.Role);
            
            _mockUsers.Verify(r => r.AddAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()), Times.Once);
            _mockStudents.Verify(r => r.AddAsync(It.IsAny<Student>(), It.IsAny<CancellationToken>()), Times.Once);
            _mockUsers.Verify(r => r.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
        }
    }
}
