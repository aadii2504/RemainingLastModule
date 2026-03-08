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
			
			if (result.Role.ToLower() == "admin")
			{
			    _logger.LogInformation("admin is signed in email - {Email}", result.Email);
			}
			else
			{
			    _logger.LogInformation("user is signed in with email - {Email}", result.Email);
			}
			
			return Ok(result);
		}
		catch (UnauthorizedAccessException ex)
		{
			return Unauthorized(ex.Message);
		}
	}

	[HttpPost("logout")]
	public IActionResult Logout([FromBody] LoginRequestDto req)
	{
	    _logger.LogInformation("user is logged out email - {Email}", req.Email);
	    return Ok(new { message = "Logged out" });
	}

	[HttpPost("reset-password")]
	public async Task<IActionResult> ResetPassword(ResetPasswordRequestDto req, CancellationToken ct)
	{
		try
		{
			await _auth.ResetPasswordAsync(req, ct);
			_logger.LogInformation("user reset password email - {Email}", req.Email);
			return Ok(new { message = "Password updated successfully" });
		}
		catch (InvalidOperationException ex)
		{
			return BadRequest(ex.Message);
		}
	}
}