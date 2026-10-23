using bek.Data;
using bek.DTOs;
using bek.Models;
using bek.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace bek.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CompetitionPhasesController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly CompetitionCascadeDeleteService _cascadeDeleteService;

    public CompetitionPhasesController(
        ApplicationDbContext context,
        CompetitionCascadeDeleteService cascadeDeleteService)
    {
        _context = context;
        _cascadeDeleteService = cascadeDeleteService;
    }

    // GET: api/CompetitionPhases
    [HttpGet]
    public async Task<ActionResult<IEnumerable<CompetitionPhaseDto>>>
        GetPhases()
    {
        var phases = await _context.CompetitionPhases
            .Include(x => x.Competition)
            .Include(x => x.Groups)
            .Include(x => x.Matches)
            .OrderBy(x => x.CompetitionId)
            .ThenBy(x => x.Order)
            .Select(x => new CompetitionPhaseDto
            {
                Id = x.Id,

                CompetitionId = x.CompetitionId,

                CompetitionName = x.Competition.Name,

                Name = x.Name,

                Order = x.Order,

                Type = (int)x.Type,

                TypeName = x.Type.ToString(),

                GroupsCount = x.Groups.Count,

                MatchesCount = x.Matches.Count
            })
            .ToListAsync();

        return Ok(phases);
    }


    // GET: api/CompetitionPhases/5
    [HttpGet("{id:int}")]
    public async Task<ActionResult<CompetitionPhaseDto>>
        GetPhase(int id)
    {
        var phase = await _context.CompetitionPhases
            .Include(x => x.Competition)
            .Include(x => x.Groups)
            .Include(x => x.Matches)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (phase == null)
        {
            return NotFound(new
            {
                message = "Faza takmičenja nije pronađena."
            });
        }

        return Ok(MapToDto(phase));
    }


    // POST: api/CompetitionPhases
    [HttpPost]
    public async Task<ActionResult<CompetitionPhaseDto>>
        CreatePhase(CreateCompetitionPhaseDto dto)
    {
        if (dto.CompetitionId <= 0)
        {
            return BadRequest(new
            {
                message = "Takmičenje je obavezno."
            });
        }

        if (string.IsNullOrWhiteSpace(dto.Name))
        {
            return BadRequest(new
            {
                message = "Naziv faze je obavezan."
            });
        }

        var competition =
            await _context.Competitions
                .FirstOrDefaultAsync(
                    x => x.Id == dto.CompetitionId);

        if (competition == null)
        {
            return BadRequest(new
            {
                message = "Takmičenje ne postoji."
            });
        }

        if (dto.Order < 1)
        {
            return BadRequest(new
            {
                message = "Redosled faze mora biti najmanje 1."
            });
        }

        if (!Enum.IsDefined(
                typeof(PhaseType),
                dto.Type))
        {
            return BadRequest(new
            {
                message = "Nepoznat tip faze."
            });
        }

        var phase = new CompetitionPhase
        {
            CompetitionId = dto.CompetitionId,

            Name = dto.Name.Trim(),

            Order = dto.Order,

            Type = (PhaseType)dto.Type
        };

        _context.CompetitionPhases.Add(phase);

        await _context.SaveChangesAsync();

        await _context.Entry(phase)
            .Reference(x => x.Competition)
            .LoadAsync();

        return CreatedAtAction(
            nameof(GetPhase),
            new { id = phase.Id },
            MapToDto(phase));
    }


    // PUT: api/CompetitionPhases/5
    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdatePhase(
        int id,
        UpdateCompetitionPhaseDto dto)
    {
        var phase =
            await _context.CompetitionPhases
                .FirstOrDefaultAsync(x => x.Id == id);

        if (phase == null)
        {
            return NotFound(new
            {
                message = "Faza takmičenja nije pronađena."
            });
        }

        if (string.IsNullOrWhiteSpace(dto.Name))
        {
            return BadRequest(new
            {
                message = "Naziv faze je obavezan."
            });
        }

        if (dto.Order < 1)
        {
            return BadRequest(new
            {
                message = "Redosled faze mora biti najmanje 1."
            });
        }

        if (!Enum.IsDefined(
                typeof(PhaseType),
                dto.Type))
        {
            return BadRequest(new
            {
                message = "Nepoznat tip faze."
            });
        }

        phase.Name = dto.Name.Trim();

        phase.Order = dto.Order;

        phase.Type = (PhaseType)dto.Type;

        await _context.SaveChangesAsync();

        return NoContent();
    }


    // DELETE: api/CompetitionPhases/5
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeletePhase(int id)
    {
        var deleted = await _cascadeDeleteService
            .DeletePhaseAsync(id);

        if (!deleted)
        {
            return NotFound(new
            {
                message = "Faza takmičenja nije pronađena."
            });
        }

        return NoContent();
    }


    private static CompetitionPhaseDto MapToDto(
        CompetitionPhase phase)
    {
        return new CompetitionPhaseDto
        {
            Id = phase.Id,

            CompetitionId = phase.CompetitionId,

            CompetitionName =
                phase.Competition?.Name ?? string.Empty,

            Name = phase.Name,

            Order = phase.Order,

            Type = (int)phase.Type,

            TypeName = phase.Type.ToString(),

            GroupsCount =
                phase.Groups?.Count ?? 0,

            MatchesCount =
                phase.Matches?.Count ?? 0
        };
    }
}