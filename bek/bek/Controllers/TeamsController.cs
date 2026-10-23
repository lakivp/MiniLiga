using bek.Data;
using bek.DTOs;
using bek.Models;
using bek.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;

namespace bek.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class TeamsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ImageStorageService _imageStorage;

    public TeamsController(
        ApplicationDbContext context,
        ImageStorageService imageStorage)
    {
        _context = context;
        _imageStorage = imageStorage;
    }

    // GET: api/Teams
    [HttpGet]
    public async Task<ActionResult<IEnumerable<TeamDto>>>
        GetTeams()
    {
        var teams = await _context.Teams
            .OrderBy(x => x.Name)
            .Select(x => new TeamDto
            {
                Id = x.Id,

                Name = x.Name,

                ShortName = x.ShortName,

                LogoUrl = x.LogoUrl,

                PrimaryColor = x.PrimaryColor,

                SecondaryColor = x.SecondaryColor,

                Description = x.Description,

                IsActive = x.IsActive,

                CreatedAt = x.CreatedAt,

                PlayerCount = x.Players
                    .Count(p => p.IsActive)
            })
            .ToListAsync();

        foreach (var team in teams)
        {
            team.LogoUrl = ImageStorageService.ToPublicUrl(
                Request,
                team.LogoUrl);
        }

        return Ok(teams);
    }

    // GET: api/Teams/1
    [HttpGet("{id:int}")]
    public async Task<ActionResult<TeamDto>>
        GetTeam(int id)
    {
        var team = await _context.Teams
            .Where(x => x.Id == id)
            .Select(x => new TeamDto
            {
                Id = x.Id,

                Name = x.Name,

                ShortName = x.ShortName,

                LogoUrl = x.LogoUrl,

                PrimaryColor = x.PrimaryColor,

                SecondaryColor = x.SecondaryColor,

                Description = x.Description,

                IsActive = x.IsActive,

                CreatedAt = x.CreatedAt,

                PlayerCount = x.Players
                    .Count(p => p.IsActive)
            })
            .FirstOrDefaultAsync();

        if (team == null)
        {
            return NotFound(new
            {
                message = "Tim nije pronađen."
            });
        }

        team.LogoUrl = ImageStorageService.ToPublicUrl(
            Request,
            team.LogoUrl);

        return Ok(team);
    }

    // POST: api/Teams
    [HttpPost]
    public async Task<ActionResult<TeamDto>>
        CreateTeam(
            CreateTeamDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name))
        {
            return BadRequest(new
            {
                message = "Naziv tima je obavezan."
            });
        }

        var teamName =
            dto.Name.Trim();

        var exists = await _context.Teams
            .AnyAsync(x =>
                x.Name.ToLower() ==
                teamName.ToLower());

        if (exists)
        {
            return BadRequest(new
            {
                message =
                    "Tim sa tim nazivom već postoji."
            });
        }

        var team = new Team
        {
            Name = teamName,

            ShortName =
                dto.ShortName?.Trim(),

            LogoUrl =
                dto.LogoUrl?.Trim(),

            PrimaryColor =
                dto.PrimaryColor?.Trim(),

            SecondaryColor =
                dto.SecondaryColor?.Trim(),

            Description =
                dto.Description?.Trim(),

            IsActive =
                dto.IsActive,

            CreatedAt =
                DateTime.UtcNow
        };

        _context.Teams.Add(team);

        await _context.SaveChangesAsync();

        var result = new TeamDto
        {
            Id = team.Id,

            Name = team.Name,

            ShortName = team.ShortName,

            LogoUrl = ImageStorageService.ToPublicUrl(Request, team.LogoUrl),

            PrimaryColor = team.PrimaryColor,

            SecondaryColor =
                team.SecondaryColor,

            Description =
                team.Description,

            IsActive =
                team.IsActive,

            CreatedAt =
                team.CreatedAt,

            PlayerCount = 0
        };

        return CreatedAtAction(
            nameof(GetTeam),
            new
            {
                id = team.Id
            },
            result);
    }

    // PUT: api/Teams/1
    [HttpPut("{id:int}")]
    public async Task<IActionResult>
        UpdateTeam(
            int id,
            UpdateTeamDto dto)
    {
        var team = await _context.Teams
            .FirstOrDefaultAsync(
                x => x.Id == id);

        if (team == null)
        {
            return NotFound(new
            {
                message =
                    "Tim nije pronađen."
            });
        }

        if (string.IsNullOrWhiteSpace(dto.Name))
        {
            return BadRequest(new
            {
                message =
                    "Naziv tima je obavezan."
            });
        }

        var teamName =
            dto.Name.Trim();

        var duplicate = await _context.Teams
            .AnyAsync(x =>
                x.Id != id &&
                x.Name.ToLower() ==
                teamName.ToLower());

        if (duplicate)
        {
            return BadRequest(new
            {
                message =
                    "Drugi tim već koristi ovaj naziv."
            });
        }

        team.Name =
            teamName;

        team.ShortName =
            dto.ShortName?.Trim();

        team.PrimaryColor =
            dto.PrimaryColor?.Trim();

        team.SecondaryColor =
            dto.SecondaryColor?.Trim();

        team.Description =
            dto.Description?.Trim();

        team.IsActive =
            dto.IsActive;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpPost("{id:int}/logo")]
    [RequestSizeLimit(ImageStorageService.MaxImageSize)]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UploadLogo(
        int id,
        [FromForm] IFormFile? file,
        CancellationToken cancellationToken)
    {
        var team = await _context.Teams
            .FirstOrDefaultAsync(x => x.Id == id);

        if (team == null)
        {
            return NotFound(new { message = "Tim nije pronađen." });
        }

        if (file == null)
        {
            return BadRequest(new { message = "Izaberite sliku tima." });
        }

        string newLogoPath;
        try
        {
            newLogoPath = await _imageStorage.SaveAsync(
                file,
                "timovi",
                cancellationToken);
        }
        catch (InvalidDataException exception)
        {
            return BadRequest(new { message = exception.Message });
        }

        var previousLogoPath = team.LogoUrl;
        team.LogoUrl = newLogoPath;

        try
        {
            await _context.SaveChangesAsync(cancellationToken);
        }
        catch
        {
            _imageStorage.DeleteIfStored(newLogoPath, "timovi");
            throw;
        }

        _imageStorage.DeleteIfStored(previousLogoPath, "timovi");

        return Ok(new
        {
            logoUrl = ImageStorageService.ToPublicUrl(Request, newLogoPath)
        });
    }

    [HttpDelete("{id:int}/logo")]
    public async Task<IActionResult> DeleteLogo(int id)
    {
        var team = await _context.Teams
            .FirstOrDefaultAsync(x => x.Id == id);

        if (team == null)
        {
            return NotFound(new { message = "Tim nije pronađen." });
        }

        var previousLogoPath = team.LogoUrl;
        team.LogoUrl = null;
        await _context.SaveChangesAsync();
        _imageStorage.DeleteIfStored(previousLogoPath, "timovi");

        return NoContent();
    }

    // DELETE: api/Teams/1
    [HttpDelete("{id:int}")]
    public async Task<IActionResult>
        DeleteTeam(int id)
    {
        var team = await _context.Teams
            .Include(x => x.Players)
            .Include(x => x.GroupTeams)
            .FirstOrDefaultAsync(
                x => x.Id == id);

        if (team == null)
        {
            return NotFound(new
            {
                message =
                    "Tim nije pronađen."
            });
        }

        if (team.Players.Any())
        {
            return BadRequest(new
            {
                message =
                    "Tim ima igrače i ne može biti obrisan. Deaktivirajte ga umesto brisanja."
            });
        }

        if (team.GroupTeams.Any())
        {
            return BadRequest(new
            {
                message =
                    "Tim je već korišćen u takmičenju i ne može biti obrisan."
            });
        }

        _context.Teams.Remove(team);

        await _context.SaveChangesAsync();

        return NoContent();
    }
}