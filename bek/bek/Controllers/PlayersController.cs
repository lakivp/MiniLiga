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
public class PlayersController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ImageStorageService _imageStorage;

    public PlayersController(
        ApplicationDbContext context,
        ImageStorageService imageStorage)
    {
        _context = context;
        _imageStorage = imageStorage;
    }

    // GET: api/Players
    [HttpGet]
    public async Task<ActionResult<IEnumerable<PlayerDto>>> GetPlayers()
    {
        var players = await _context.Players
            .Include(x => x.Team)
            .OrderBy(x => x.LastName)
            .ThenBy(x => x.FirstName)
            .Select(x => new PlayerDto
            {
                Id = x.Id,
                FirstName = x.FirstName,
                LastName = x.LastName,
                DisplayName = x.DisplayName,
                JerseyNumber = x.JerseyNumber,
                Position = x.Position,
                PhotoUrl = x.PhotoUrl,
                TeamId = x.TeamId,
                TeamName = x.Team.Name,
                IsActive = x.IsActive
            })
            .ToListAsync();

        foreach (var player in players)
        {
            player.PhotoUrl = ImageStorageService.ToPublicUrl(
                Request,
                player.PhotoUrl);
        }

        return Ok(players);
    }

    // GET: api/Players/1
    [HttpGet("{id:int}")]
    public async Task<ActionResult<PlayerDto>> GetPlayer(int id)
    {
        var player = await _context.Players
            .Include(x => x.Team)
            .Where(x => x.Id == id)
            .Select(x => new PlayerDto
            {
                Id = x.Id,
                FirstName = x.FirstName,
                LastName = x.LastName,
                DisplayName = x.DisplayName,
                JerseyNumber = x.JerseyNumber,
                Position = x.Position,
                PhotoUrl = x.PhotoUrl,
                TeamId = x.TeamId,
                TeamName = x.Team.Name,
                IsActive = x.IsActive
            })
            .FirstOrDefaultAsync();

        if (player == null)
        {
            return NotFound(new
            {
                message = "Igrač nije pronađen."
            });
        }

        player.PhotoUrl = ImageStorageService.ToPublicUrl(
            Request,
            player.PhotoUrl);

        return Ok(player);
    }

    // POST: api/Players
    [HttpPost]
    public async Task<ActionResult<PlayerDto>> CreatePlayer(
        CreatePlayerDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.FirstName))
        {
            return BadRequest(new
            {
                message = "Ime igrača je obavezno."
            });
        }

        if (string.IsNullOrWhiteSpace(dto.LastName))
        {
            return BadRequest(new
            {
                message = "Prezime igrača je obavezno."
            });
        }

        var team = await _context.Teams
            .FirstOrDefaultAsync(x => x.Id == dto.TeamId);

        if (team == null)
        {
            return BadRequest(new
            {
                message = "Izabrani tim ne postoji."
            });
        }

        var player = new Player
        {
            FirstName = dto.FirstName.Trim(),
            LastName = dto.LastName.Trim(),
            DisplayName = dto.DisplayName?.Trim(),
            JerseyNumber = dto.JerseyNumber,
            Position = dto.Position?.Trim(),
            PhotoUrl = dto.PhotoUrl?.Trim(),
            TeamId = dto.TeamId,
            IsActive = dto.IsActive
        };

        _context.Players.Add(player);

        await _context.SaveChangesAsync();

        var result = new PlayerDto
        {
            Id = player.Id,
            FirstName = player.FirstName,
            LastName = player.LastName,
            DisplayName = player.DisplayName,
            JerseyNumber = player.JerseyNumber,
            Position = player.Position,
            PhotoUrl = ImageStorageService.ToPublicUrl(Request, player.PhotoUrl),
            TeamId = team.Id,
            TeamName = team.Name,
            IsActive = player.IsActive
        };

        return CreatedAtAction(
            nameof(GetPlayer),
            new { id = player.Id },
            result);
    }

    // PUT: api/Players/1
    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdatePlayer(
        int id,
        UpdatePlayerDto dto)
    {
        var player = await _context.Players
            .FirstOrDefaultAsync(x => x.Id == id);

        if (player == null)
        {
            return NotFound(new
            {
                message = "Igrač nije pronađen."
            });
        }

        if (string.IsNullOrWhiteSpace(dto.FirstName))
        {
            return BadRequest(new
            {
                message = "Ime igrača je obavezno."
            });
        }

        if (string.IsNullOrWhiteSpace(dto.LastName))
        {
            return BadRequest(new
            {
                message = "Prezime igrača je obavezno."
            });
        }

        var team = await _context.Teams
            .FirstOrDefaultAsync(x => x.Id == dto.TeamId);

        if (team == null)
        {
            return BadRequest(new
            {
                message = "Izabrani tim ne postoji."
            });
        }

        player.FirstName = dto.FirstName.Trim();
        player.LastName = dto.LastName.Trim();
        player.DisplayName = dto.DisplayName?.Trim();
        player.JerseyNumber = dto.JerseyNumber;
        player.Position = dto.Position?.Trim();
        player.TeamId = dto.TeamId;
        player.IsActive = dto.IsActive;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpPost("{id:int}/photo")]
    [RequestSizeLimit(ImageStorageService.MaxImageSize)]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UploadPhoto(
        int id,
        [FromForm] IFormFile? file,
        CancellationToken cancellationToken)
    {
        var player = await _context.Players
            .FirstOrDefaultAsync(x => x.Id == id);

        if (player == null)
        {
            return NotFound(new { message = "Igrač nije pronađen." });
        }

        if (file == null)
        {
            return BadRequest(new { message = "Izaberite fotografiju igrača." });
        }

        string newPhotoPath;
        try
        {
            newPhotoPath = await _imageStorage.SaveAsync(
                file,
                "igraci",
                cancellationToken);
        }
        catch (InvalidDataException exception)
        {
            return BadRequest(new { message = exception.Message });
        }

        var previousPhotoPath = player.PhotoUrl;
        player.PhotoUrl = newPhotoPath;

        try
        {
            await _context.SaveChangesAsync(cancellationToken);
        }
        catch
        {
            _imageStorage.DeleteIfStored(newPhotoPath, "igraci");
            throw;
        }

        _imageStorage.DeleteIfStored(previousPhotoPath, "igraci");

        return Ok(new
        {
            photoUrl = ImageStorageService.ToPublicUrl(Request, newPhotoPath)
        });
    }

    [HttpDelete("{id:int}/photo")]
    public async Task<IActionResult> DeletePhoto(int id)
    {
        var player = await _context.Players
            .FirstOrDefaultAsync(x => x.Id == id);

        if (player == null)
        {
            return NotFound(new { message = "Igrač nije pronađen." });
        }

        var previousPhotoPath = player.PhotoUrl;
        player.PhotoUrl = null;
        await _context.SaveChangesAsync();
        _imageStorage.DeleteIfStored(previousPhotoPath, "igraci");

        return NoContent();
    }

    // DELETE: api/Players/1
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeletePlayer(int id)
    {
        var player = await _context.Players
            .FirstOrDefaultAsync(x => x.Id == id);

        if (player == null)
        {
            return NotFound(new
            {
                message = "Igrač nije pronađen."
            });
        }

        _context.Players.Remove(player);

        await _context.SaveChangesAsync();

        return NoContent();
    }
}