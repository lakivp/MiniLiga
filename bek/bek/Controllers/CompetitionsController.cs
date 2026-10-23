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
public class CompetitionsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly CompetitionCascadeDeleteService _cascadeDeleteService;

    public CompetitionsController(
        ApplicationDbContext context,
        CompetitionCascadeDeleteService cascadeDeleteService)
    {
        _context = context;
        _cascadeDeleteService = cascadeDeleteService;
    }

    // GET: api/Competitions
    [HttpGet]
    public async Task<ActionResult<IEnumerable<CompetitionDto>>> GetCompetitions()
    {
        var competitions = await _context.Competitions
            .Include(x => x.Season)
            .OrderByDescending(x => x.Season.Number)
            .ThenBy(x => x.Name)
            .Select(x => new CompetitionDto
            {
                Id = x.Id,
                SeasonId = x.SeasonId,
                SeasonName = x.Season.Name,
                Name = x.Name,
                Description = x.Description,
                IsActive = x.IsActive
            })
            .ToListAsync();

        return Ok(competitions);
    }

    // GET: api/Competitions/1
    [HttpGet("{id:int}")]
    public async Task<ActionResult<CompetitionDto>> GetCompetition(int id)
    {
        var competition = await _context.Competitions
            .Include(x => x.Season)
            .Where(x => x.Id == id)
            .Select(x => new CompetitionDto
            {
                Id = x.Id,
                SeasonId = x.SeasonId,
                SeasonName = x.Season.Name,
                Name = x.Name,
                Description = x.Description,
                IsActive = x.IsActive
            })
            .FirstOrDefaultAsync();

        if (competition == null)
        {
            return NotFound(new
            {
                message = "Takmičenje nije pronađeno."
            });
        }

        return Ok(competition);
    }

    // GET: api/Competitions/season/1
    [HttpGet("season/{seasonId:int}")]
    public async Task<ActionResult<IEnumerable<CompetitionDto>>> GetCompetitionsBySeason(
        int seasonId)
    {
        var seasonExists = await _context.Seasons
            .AnyAsync(x => x.Id == seasonId);

        if (!seasonExists)
        {
            return NotFound(new
            {
                message = "Sezona nije pronađena."
            });
        }

        var competitions = await _context.Competitions
            .Include(x => x.Season)
            .Where(x => x.SeasonId == seasonId)
            .OrderBy(x => x.Name)
            .Select(x => new CompetitionDto
            {
                Id = x.Id,
                SeasonId = x.SeasonId,
                SeasonName = x.Season.Name,
                Name = x.Name,
                Description = x.Description,
                IsActive = x.IsActive
            })
            .ToListAsync();

        return Ok(competitions);
    }

    // POST: api/Competitions
    [HttpPost]
    public async Task<ActionResult<CompetitionDto>> CreateCompetition(
        CreateCompetitionDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name))
        {
            return BadRequest(new
            {
                message = "Naziv takmičenja je obavezan."
            });
        }

        var season = await _context.Seasons
            .FirstOrDefaultAsync(x => x.Id == dto.SeasonId);

        if (season == null)
        {
            return BadRequest(new
            {
                message = "Izabrana sezona ne postoji."
            });
        }

        var competition = new Competition
        {
            SeasonId = dto.SeasonId,
            Name = dto.Name.Trim(),
            Description = dto.Description?.Trim(),
            IsActive = dto.IsActive
        };

        _context.Competitions.Add(competition);

        await _context.SaveChangesAsync();

        var result = new CompetitionDto
        {
            Id = competition.Id,
            SeasonId = competition.SeasonId,
            SeasonName = season.Name,
            Name = competition.Name,
            Description = competition.Description,
            IsActive = competition.IsActive
        };

        return CreatedAtAction(
            nameof(GetCompetition),
            new { id = competition.Id },
            result);
    }

    // PUT: api/Competitions/1
    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateCompetition(
        int id,
        UpdateCompetitionDto dto)
    {
        var competition = await _context.Competitions
            .FirstOrDefaultAsync(x => x.Id == id);

        if (competition == null)
        {
            return NotFound(new
            {
                message = "Takmičenje nije pronađeno."
            });
        }

        if (string.IsNullOrWhiteSpace(dto.Name))
        {
            return BadRequest(new
            {
                message = "Naziv takmičenja je obavezan."
            });
        }

        var seasonExists = await _context.Seasons
            .AnyAsync(x => x.Id == dto.SeasonId);

        if (!seasonExists)
        {
            return BadRequest(new
            {
                message = "Izabrana sezona ne postoji."
            });
        }

        competition.SeasonId = dto.SeasonId;
        competition.Name = dto.Name.Trim();
        competition.Description = dto.Description?.Trim();
        competition.IsActive = dto.IsActive;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    // DELETE: api/Competitions/1
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteCompetition(int id)
    {
        var deleted = await _cascadeDeleteService
            .DeleteCompetitionAsync(id);

        if (!deleted)
        {
            return NotFound(new
            {
                message = "Takmičenje nije pronađeno."
            });
        }

        return NoContent();
    }
}