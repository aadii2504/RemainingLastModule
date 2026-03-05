using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using MyProject.Api.Models;
using MyProject.Api.Services.Interfaces;

namespace MyProject.Api.Services;

public class JwtTokenService : IJwtTokenService
{
	private readonly IConfiguration _config;

	public JwtTokenService(IConfiguration config) => _config = config;

	public string CreateToken(User user)
	{
		var jwt = _config.GetSection("Jwt");

		var key = jwt["Key"]!;
		var issuer = jwt["Issuer"];
		var audience = jwt["Audience"];

		int expiresMinutes = 120;
		_ = int.TryParse(jwt["ExpiresMinutes"], out expiresMinutes);

		var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));
		var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

		var claims = new List<Claim>
		{
			new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
			new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
			new Claim(JwtRegisteredClaimNames.Email, user.Email),
			new Claim("name", user.Name),
			new Claim(ClaimTypes.Role, user.Role)
		};

		var token = new JwtSecurityToken(
			issuer: issuer,
			audience: audience,
			claims: claims,
			expires: DateTime.UtcNow.AddMinutes(expiresMinutes),
			signingCredentials: credentials
		);

		return new JwtSecurityTokenHandler().WriteToken(token);
	}
}