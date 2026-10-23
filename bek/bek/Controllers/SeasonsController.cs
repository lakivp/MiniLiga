using bek.Data;
using bek.DTOs;
using bek.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace bek.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SeasonsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public SeasonsController(ApplicationDbContext context)
    {
        _context = context;
    }

    // GET: api/seasons
    [HttpGet]
    public async Task<ActionResult<IEnumerable<SeasonDto>>> GetSeasons()
    {
        var seasons = await _context.Seasons
            .OrderByDescending(x => x.Number)
            .Select(x => new SeasonDto
            {
                Id = x.Id,
                Name = x.Name,
                Number = x.Number,
                StartDate = x.StartDate,
                EndDate = x.EndDate,
                IsActive = x.IsActive,
                Description = x.Description
            })
            .ToListAsync();

        return Ok(seasons);
    }

    // GET: api/seasons/1
    [HttpGet("{id:int}")]
    public async Task<ActionResult<SeasonDto>> GetSeason(int id)
    {
        var season = await _context.Seasons
            .Where(x => x.Id == id)
            .Select(x => new SeasonDto
            {
                Id = x.Id,
                Name = x.Name,
                Number = x.Number,
                StartDate = x.StartDate,
                EndDate = x.EndDate,
                IsActive = x.IsActive,
                Description = x.Description
            })
            .FirstOrDefaultAsync();

        if (season == null)
        {
            return NotFound(new
            {
                message = "Sezona nije pronađena."
            });
        }

        return Ok(season);
    }

    // POST: api/seasons
    [HttpPost]
    public async Task<ActionResult<SeasonDto>> CreateSeason(
        CreateSeasonDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name))
        {
            return BadRequest(new
            {
                message = "Naziv sezone je obavezan."
            });
        }

        if (dto.Number <= 0)
        {
            return BadRequest(new
            {
                message = "Broj sezone mora biti veći od 0."
            });
        }

        var existingSeason = await _context.Seasons
            .AnyAsync(x => x.Number == dto.Number);

        if (existingSeason)
        {
            return Conflict(new
            {
                message = $"Sezona broj {dto.Number} već postoji."
            });
        }

        var season = new Season
        {
            Name = dto.Name.Trim(),
            Number = dto.Number,
            StartDate = dto.StartDate,
            EndDate = dto.EndDate,
            IsActive = dto.IsActive,
            Description = dto.Description?.Trim()
        };

        _context.Seasons.Add(season);

        await _context.SaveChangesAsync();

        var result = new SeasonDto
        {
            Id = season.Id,
            Name = season.Name,
            Number = season.Number,
            StartDate = season.StartDate,
            EndDate = season.EndDate,
            IsActive = season.IsActive,
            Description = season.Description
        };

        return CreatedAtAction(
            nameof(GetSeason),
            new { id = season.Id },
            result);
    }

    // PUT: api/seasons/1
    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateSeason(
        int id,
        UpdateSeasonDto dto)
    {
        var season = await _context.Seasons
            .FirstOrDefaultAsync(x => x.Id == id);

        if (season == null)
        {
            return NotFound(new
            {
                message = "Sezona nije pronađena."
            });
        }

        if (string.IsNullOrWhiteSpace(dto.Name))
        {
            return BadRequest(new
            {
                message = "Naziv sezone je obavezan."
            });
        }

        if (dto.Number <= 0)
        {
            return BadRequest(new
            {
                message = "Broj sezone mora biti veći od 0."
            });
        }

        var numberExists = await _context.Seasons
            .AnyAsync(x =>
                x.Number == dto.Number &&
                x.Id != id);

        if (numberExists)
        {
            return Conflict(new
            {
                message = $"Sezona broj {dto.Number} već postoji."
            });
        }

        season.Name = dto.Name.Trim();
        season.Number = dto.Number;
        season.StartDate = dto.StartDate;
        season.EndDate = dto.EndDate;
        season.IsActive = dto.IsActive;
        season.Description = dto.Description?.Trim();

        await _context.SaveChangesAsync();

        return NoContent();
    }

    // DELETE: api/seasons/1
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteSeason(int id)
    {
        var season = await _context.Seasons
            .FirstOrDefaultAsync(x => x.Id == id);

        if (season == null)
        {
            return NotFound(new
            {
                message = "Sezona nije pronađena."
            });
        }

        _context.Seasons.Remove(season);

        await _context.SaveChangesAsync();

        return NoContent();
    }
}