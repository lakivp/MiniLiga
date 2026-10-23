using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

using bek.Models;

using Microsoft.IdentityModel.Tokens;

namespace bek.Services;

public class JwtService
{
    private readonly IConfiguration _configuration;

    public JwtService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public (string Token, DateTime ExpiresAt) GenerateToken(Admin admin)
    {
        var key = _configuration["Jwt:Key"];

        if (string.IsNullOrWhiteSpace(key))
        {
            throw new InvalidOperationException(
                "JWT ključ nije podešen u appsettings.json."
            );
        }

        var issuer = _configuration["Jwt:Issuer"];
        var audience = _configuration["Jwt:Audience"];

        var expirationMinutes =
            _configuration.GetValue<int>(
                "Jwt:ExpirationMinutes"
            );

        if (expirationMinutes <= 0)
        {
            expirationMinutes = 480;
        }

        var expiresAt =
            DateTime.UtcNow.AddMinutes(expirationMinutes);

        var claims = new List<Claim>
        {
            new Claim(
                ClaimTypes.NameIdentifier,
                admin.Id.ToString()
            ),

            new Claim(
                ClaimTypes.Email,
                admin.Email
            ),

            new Claim(
                ClaimTypes.Name,
                admin.Name
            ),

            new Claim(
                ClaimTypes.Role,
                "Admin"
            )
        };

        var securityKey =
            new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(key)
            );

        var credentials =
            new SigningCredentials(
                securityKey,
                SecurityAlgorithms.HmacSha256
            );

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: expiresAt,
            signingCredentials: credentials
        );

        var tokenString =
            new JwtSecurityTokenHandler()
                .WriteToken(token);

        return (tokenString, expiresAt);
    }
}