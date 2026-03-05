using Microsoft.AspNetCore.Mvc;
using MyProject.Api.DTOs;
using MyProject.Api.Services.Interfaces;

namespace MyProject.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
	private readonly IAuthService _auth;
	private readonly ILogger<AuthController> _logger;

	public AuthController(IAuthService auth, ILogger<AuthController> logger)
	{
		_auth = auth;
		_logger = logger;
	}
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

	[HttpPost("logout")]
	public IActionResult Logout([FromBody] LogoutRequestDto req)
	{
		_logger.LogInformation("User logged out. Email is {Email}", req.Email);
		return Ok(new { message = "Logged out successfully" });
	}
}