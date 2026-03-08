using Microsoft.AspNetCore.Mvc;
using MyProject.Api.DTOs;
using MyProject.Api.Services.Interfaces;

namespace MyProject.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
	private readonly IAuthService _auth;

	public AuthController(IAuthService auth) => _auth = auth;

	[HttpPost("register")]
	public async Task<ActionResult<AuthResponseDto>> Register(RegisterRequestDto req, CancellationToken ct)
	{
		try
		{
			var result = await _auth.RegisterAsync(req, ct);
			return Ok(result);
		}
		catch (InvalidOperationException ex)
		{
			return BadRequest(ex.Message);
		}
	}

	[HttpPost("login")]
	public async Task<ActionResult<AuthResponseDto>> Login(LoginRequestDto req, CancellationToken ct)
	{
		try
		{
			var result = await _auth.LoginAsync(req, ct);
			return Ok(result);
		}
		catch (UnauthorizedAccessException ex)
		{
			return Unauthorized(ex.Message);
		}
	}
}