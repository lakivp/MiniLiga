using bek.Data;
using bek.DTOs;
using bek.Models;
using bek.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace bek.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CompetitionGroupsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly CompetitionCascadeDeleteService _cascadeDeleteService;

    public CompetitionGroupsController(
        ApplicationDbContext context,
        CompetitionCascadeDeleteService cascadeDeleteService)
    {
        _context = context;
        _cascadeDeleteService = cascadeDeleteService;
    }


    // GET: api/CompetitionGroups
    [HttpGet]
    public async Task<ActionResult<IEnumerable<CompetitionGroupDto>>>
        GetGroups()
    {
        var groups = await _context.CompetitionGroups
            .Include(x => x.Phase)
            .Include(x => x.Teams)
            .Include(x => x.Matches)
            .OrderBy(x => x.PhaseId)
            .ThenBy(x => x.Order)
            .Select(x => new CompetitionGroupDto
            {
                Id = x.Id,

                PhaseId = x.PhaseId,

                PhaseName = x.Phase.Name,

                Name = x.Name,

                Order = x.Order,

                TeamsCount = x.Teams.Count,

                MatchesCount = x.Matches.Count
            })
            .ToListAsync();

        return Ok(groups);
    }


    // GET: api/CompetitionGroups/5
    [HttpGet("{id:int}")]
    public async Task<ActionResult<CompetitionGroupDto>>
        GetGroup(int id)
    {
        var group =
            await _context.CompetitionGroups
                .Include(x => x.Phase)
                .Include(x => x.Teams)
                .Include(x => x.Matches)
                .FirstOrDefaultAsync(x => x.Id == id);

        if (group == null)
        {
            return NotFound(new
            {
                message = "Grupa nije pronađena."
            });
        }

        return Ok(MapToDto(group));
    }


    // GET:
    // api/CompetitionGroups/phase/5
    [HttpGet("phase/{phaseId:int}")]
    public async Task<
        ActionResult<IEnumerable<CompetitionGroupDto>>>
        GetGroupsByPhase(int phaseId)
    {
        var phaseExists =
            await _context.CompetitionPhases
                .AnyAsync(x => x.Id == phaseId);

        if (!phaseExists)
        {
            return NotFound(new
            {
                message = "Faza ne postoji."
            });
        }

        var groups =
            await _context.CompetitionGroups
                .Where(x => x.PhaseId == phaseId)
                .Include(x => x.Phase)
                .Include(x => x.Teams)
                .Include(x => x.Matches)
                .OrderBy(x => x.Order)
                .Select(x => new CompetitionGroupDto
                {
                    Id = x.Id,

                    PhaseId = x.PhaseId,

                    PhaseName = x.Phase.Name,

                    Name = x.Name,

                    Order = x.Order,

                    TeamsCount = x.Teams.Count,

                    MatchesCount = x.Matches.Count
                })
                .ToListAsync();

        return Ok(groups);
    }


    // POST
    [HttpPost]
    public async Task<ActionResult<CompetitionGroupDto>> CreateGroup(
    CreateCompetitionGroupDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name))
        {
            return BadRequest(new
            {
                message = "Naziv grupe je obavezan."
            });
        }

        var phase = await _context.CompetitionPhases
            .FirstOrDefaultAsync(x => x.Id == dto.PhaseId);

        if (phase == null)
        {
            return BadRequest(new
            {
                message = "Faza ne postoji."
            });
        }

        if (!PhaseAllowsGroups(phase.Type))
        {
            return BadRequest(new
            {
                message =
                    "Ova faza ne podržava grupe. " +
                    "Knockout faze nemaju grupe."
            });
        }

        if (dto.Order < 0)
        {
            return BadRequest(new
            {
                message = "Redosled grupe ne može biti negativan."
            });
        }

        var group = new CompetitionGroup
        {
            PhaseId = dto.PhaseId,
            Name = dto.Name.Trim(),
            Order = dto.Order
        };

        _context.CompetitionGroups.Add(group);

        await _context.SaveChangesAsync();

        return CreatedAtAction(
            nameof(GetGroup),
            new { id = group.Id },
            new CompetitionGroupDto
            {
                Id = group.Id,
                PhaseId = group.PhaseId,
                PhaseName = phase.Name,
                Name = group.Name,
                Order = group.Order,
                TeamsCount = 0,
                MatchesCount = 0
            });
    }


    // PUT
    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateGroup(
    int id,
    UpdateCompetitionGroupDto dto)
    {
        var group = await _context.CompetitionGroups
            .FirstOrDefaultAsync(x => x.Id == id);

        if (group == null)
        {
            return NotFound(new
            {
                message = "Grupa nije pronađena."
            });
        }

        if (string.IsNullOrWhiteSpace(dto.Name))
        {
            return BadRequest(new
            {
                message = "Naziv grupe je obavezan."
            });
        }

        var phase = await _context.CompetitionPhases
            .FirstOrDefaultAsync(x => x.Id == group.PhaseId);

        if (phase == null)
        {
            return BadRequest(new
            {
                message = "Faza grupe ne postoji."
            });
        }

        if (!PhaseAllowsGroups(phase.Type))
        {
            return BadRequest(new
            {
                message =
                    "Ova faza ne podržava grupe."
            });
        }

        if (dto.Order < 0)
        {
            return BadRequest(new
            {
                message = "Redosled grupe ne može biti negativan."
            });
        }

        group.Name = dto.Name.Trim();
        group.Order = dto.Order;

        await _context.SaveChangesAsync();

        return NoContent();
    }


    // DELETE
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteGroup(int id)
    {
        var deleted = await _cascadeDeleteService
            .DeleteGroupAsync(id);

        if (!deleted)
        {
            return NotFound(new
            {
                message = "Grupa nije pronađena."
            });
        }

        return NoContent();
    }


    private static CompetitionGroupDto MapToDto(
        CompetitionGroup group)
    {
        return new CompetitionGroupDto
        {
            Id = group.Id,

            PhaseId = group.PhaseId,

            PhaseName =
                group.Phase?.Name ?? string.Empty,

            Name = group.Name,

            Order = group.Order,

            TeamsCount =
                group.Teams?.Count ?? 0,

            MatchesCount =
                group.Matches?.Count ?? 0
        };
    }

    private static bool PhaseAllowsGroups(PhaseType type)
    {
        return type == PhaseType.League ||
               type == PhaseType.Groups ||
               type == PhaseType.Playoff;
    }
}