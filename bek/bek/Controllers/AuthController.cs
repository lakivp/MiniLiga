using bek.Data;
using bek.DTOs;
using bek.Services;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace bek.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly JwtService _jwtService;

    public AuthController(
        ApplicationDbContext context,
        JwtService jwtService)
    {
        _context = context;
        _jwtService = jwtService;
    }

    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<ActionResult<LoginResponseDto>> Login(
        [FromBody] LoginRequestDto request)
    {
        if (string.IsNullOrWhiteSpace(request.Email))
        {
            return BadRequest(new
            {
                message = "Email je obavezan."
            });
        }

        if (string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new
            {
                message = "Lozinka je obavezna."
            });
        }

        var email =
            request.Email
                .Trim()
                .ToLowerInvariant();

        var admin =
            await _context.Admins
                .FirstOrDefaultAsync(x =>
                    x.Email == email &&
                    x.IsActive);

        if (admin == null)
        {
            return Unauthorized(new
            {
                message = "Pogrešan email ili lozinka."
            });
        }

        var passwordValid =
            BCrypt.Net.BCrypt.Verify(
                request.Password,
                admin.PasswordHash
            );

        if (!passwordValid)
        {
            return Unauthorized(new
            {
                message = "Pogrešan email ili lozinka."
            });
        }

        admin.LastLoginAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        var tokenResult =
            _jwtService.GenerateToken(admin);

        Response.Cookies.Append(
            "intertoto_admin_session",
            tokenResult.Token,
            new CookieOptions
            {
                HttpOnly = true,
                Secure = !HttpContext.RequestServices
                    .GetRequiredService<IWebHostEnvironment>()
                    .IsDevelopment()
                    || Request.IsHttps,
                SameSite = SameSiteMode.Strict,
                Path = "/",
                Expires = new DateTimeOffset(
                    tokenResult.ExpiresAt,
                    TimeSpan.Zero
                ),
                IsEssential = true
            }
        );

        return Ok(new
        {
            expiresAt = tokenResult.ExpiresAt,
            admin = new AdminDto
            {
                Id = admin.Id,
                Email = admin.Email,
                Name = admin.Name
            }
        });
    }

    [Authorize(Roles = "Admin")]
    [HttpGet("me")]
    public async Task<ActionResult<AdminDto>> Me()
    {
        var adminIdClaim =
            User.FindFirst(
                System.Security.Claims.ClaimTypes.NameIdentifier
            );

        if (adminIdClaim == null)
        {
            return Unauthorized();
        }

        if (!int.TryParse(
                adminIdClaim.Value,
                out var adminId))
        {
            return Unauthorized();
        }

        var admin =
            await _context.Admins
                .AsNoTracking()
                .FirstOrDefaultAsync(
                    x =>
                        x.Id == adminId &&
                        x.IsActive
                );

        if (admin == null)
        {
            return Unauthorized();
        }

        return Ok(new AdminDto
        {
            Id = admin.Id,
            Email = admin.Email,
            Name = admin.Name
        });
    }

    [Authorize(Roles = "Admin")]
    [HttpPost("logout")]
    public IActionResult Logout()
    {
        Response.Cookies.Delete(
            "intertoto_admin_session",
            new CookieOptions
            {
                HttpOnly = true,
                Secure = !HttpContext.RequestServices
                    .GetRequiredService<IWebHostEnvironment>()
                    .IsDevelopment()
                    || Request.IsHttps,
                SameSite = SameSiteMode.Strict,
                Path = "/"
            }
        );

        return NoContent();
    }
}