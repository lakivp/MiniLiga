using bek.Data;
using bek.DTOs;
using bek.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace bek.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CompetitionRulesController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public CompetitionRulesController(ApplicationDbContext context)
    {
        _context = context;
    }

    // =========================================================
    // GET: api/CompetitionRules
    // =========================================================

    [HttpGet]
    public async Task<ActionResult<IEnumerable<CompetitionRulesDto>>>
        GetRules()
    {
        var rules = await _context.CompetitionRules
            .OrderBy(x => x.CompetitionId)
            .ToListAsync();

        return Ok(rules.Select(MapToDto));
    }

    // =========================================================
    // GET: api/CompetitionRules/5
    // =========================================================

    [HttpGet("{id}")]
    public async Task<ActionResult<CompetitionRulesDto>> GetRules(int id)
    {
        var rules = await _context.CompetitionRules
            .FirstOrDefaultAsync(x => x.Id == id);

        if (rules == null)
        {
            return NotFound(new
            {
                message = "Pravila takmičenja nisu pronađena."
            });
        }

        return Ok(MapToDto(rules));
    }

    // =========================================================
    // GET: api/CompetitionRules/competition/1
    // =========================================================

    [HttpGet("competition/{competitionId}")]
    public async Task<ActionResult<CompetitionRulesDto>>
        GetRulesByCompetition(int competitionId)
    {
        var rules = await _context.CompetitionRules
            .FirstOrDefaultAsync(x =>
                x.CompetitionId == competitionId);

        if (rules == null)
        {
            return NotFound(new
            {
                message = "Pravila za ovo takmičenje nisu pronađena."
            });
        }

        return Ok(MapToDto(rules));
    }

    // =========================================================
    // POST: api/CompetitionRules
    // =========================================================

    [HttpPost]
    public async Task<ActionResult<CompetitionRulesDto>>
        CreateRules(CreateCompetitionRulesDto dto)
    {
        // -----------------------------------------------------
        // Provera takmičenja
        // -----------------------------------------------------

        var competitionExists = await _context.Competitions
            .AnyAsync(x => x.Id == dto.CompetitionId);

        if (!competitionExists)
        {
            return BadRequest(new
            {
                message = "Takmičenje ne postoji."
            });
        }

        // -----------------------------------------------------
        // Jedna pravila po takmičenju
        // -----------------------------------------------------

        var existingRules = await _context.CompetitionRules
            .AnyAsync(x =>
                x.CompetitionId == dto.CompetitionId);

        if (existingRules)
        {
            return Conflict(new
            {
                message =
                    "Za ovo takmičenje već postoje definisana pravila."
            });
        }

        // -----------------------------------------------------
        // Validacija bodova
        // -----------------------------------------------------

        if (dto.WinPoints < 0 ||
            dto.DrawPoints < 0 ||
            dto.LossPoints < 0)
        {
            return BadRequest(new
            {
                message = "Bodovi ne mogu biti negativni."
            });
        }

        if (dto.TeamsAdvancingPerGroup.HasValue &&
            dto.TeamsAdvancingPerGroup.Value <= 0)
        {
            return BadRequest(new
            {
                message =
                    "Broj timova koji prolazi iz grupe mora biti veći od 0."
            });
        }

        var rules = new CompetitionRules
        {
            CompetitionId = dto.CompetitionId,

            WinPoints = dto.WinPoints,

            DrawPoints = dto.DrawPoints,

            LossPoints = dto.LossPoints,

            UseGoalDifference = dto.UseGoalDifference,

            UseGoalsScored = dto.UseGoalsScored,

            UseHeadToHead = dto.UseHeadToHead,

            TeamsAdvancingPerGroup =
                dto.TeamsAdvancingPerGroup
        };

        _context.CompetitionRules.Add(rules);

        await _context.SaveChangesAsync();

        return CreatedAtAction(
            nameof(GetRules),
            new { id = rules.Id },
            MapToDto(rules)
        );
    }

    // =========================================================
    // PUT: api/CompetitionRules/5
    // =========================================================

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateRules(
        int id,
        UpdateCompetitionRulesDto dto)
    {
        var rules = await _context.CompetitionRules
            .FirstOrDefaultAsync(x => x.Id == id);

        if (rules == null)
        {
            return NotFound(new
            {
                message = "Pravila nisu pronađena."
            });
        }

        if (dto.WinPoints < 0 ||
            dto.DrawPoints < 0 ||
            dto.LossPoints < 0)
        {
            return BadRequest(new
            {
                message = "Bodovi ne mogu biti negativni."
            });
        }

        if (dto.TeamsAdvancingPerGroup.HasValue &&
            dto.TeamsAdvancingPerGroup.Value <= 0)
        {
            return BadRequest(new
            {
                message =
                    "Broj timova koji prolazi iz grupe mora biti veći od 0."
            });
        }

        rules.WinPoints = dto.WinPoints;
        rules.DrawPoints = dto.DrawPoints;
        rules.LossPoints = dto.LossPoints;

        rules.UseGoalDifference = dto.UseGoalDifference;
        rules.UseGoalsScored = dto.UseGoalsScored;
        rules.UseHeadToHead = dto.UseHeadToHead;

        rules.TeamsAdvancingPerGroup =
            dto.TeamsAdvancingPerGroup;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    // =========================================================
    // DELETE: api/CompetitionRules/5
    // =========================================================

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteRules(int id)
    {
        var rules = await _context.CompetitionRules
            .FirstOrDefaultAsync(x => x.Id == id);

        if (rules == null)
        {
            return NotFound(new
            {
                message = "Pravila nisu pronađena."
            });
        }

        _context.CompetitionRules.Remove(rules);

        await _context.SaveChangesAsync();

        return NoContent();
    }

    // =========================================================
    // MAPIRANJE
    // =========================================================

    private static CompetitionRulesDto MapToDto(
        CompetitionRules rules)
    {
        return new CompetitionRulesDto
        {
            Id = rules.Id,

            CompetitionId = rules.CompetitionId,

            WinPoints = rules.WinPoints,

            DrawPoints = rules.DrawPoints,

            LossPoints = rules.LossPoints,

            UseGoalDifference =
                rules.UseGoalDifference,

            UseGoalsScored =
                rules.UseGoalsScored,

            UseHeadToHead =
                rules.UseHeadToHead,

            TeamsAdvancingPerGroup =
                rules.TeamsAdvancingPerGroup
        };
    }
}