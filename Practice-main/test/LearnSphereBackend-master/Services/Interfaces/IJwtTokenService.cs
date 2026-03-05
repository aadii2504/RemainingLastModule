using MyProject.Api.Models;

namespace MyProject.Api.Services.Interfaces;

public interface IJwtTokenService
{
	string CreateToken(User user);
}