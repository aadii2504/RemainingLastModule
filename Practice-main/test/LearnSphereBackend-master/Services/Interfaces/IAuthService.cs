using MyProject.Api.DTOs;

namespace MyProject.Api.Services.Interfaces;

public interface IAuthService
{
	Task<AuthResponseDto> RegisterAsync(RegisterRequestDto req, CancellationToken ct);
	Task<AuthResponseDto> LoginAsync(LoginRequestDto req, CancellationToken ct);
}
