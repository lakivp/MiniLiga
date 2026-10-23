using bek.Data;
using bek.DTOs;
using bek.Models;
using bek.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace bek.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MatchEventsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly MatchService _matchService;

    public MatchEventsController(
        ApplicationDbContext context,
        MatchService matchService)
    {
        _context = context;
        _matchService = matchService;
    }


    // ============================================================
    // GET SVI DOGAĐAJI
    // ============================================================

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var events = await _context.MatchEvents
            .Include(x => x.Player)
                .ThenInclude(x => x!.Team)
            .Include(x => x.RelatedPlayer)
                .ThenInclude(x => x!.Team)
            .OrderByDescending(x => x.MatchId)
            .ThenBy(x => x.Minute)
            .ToListAsync();

        return Ok(events.Select(MapToDto));
    }


    // ============================================================
    // GET DOGAĐAJ
    // ============================================================

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var matchEvent = await _context.MatchEvents
         .Include(x => x.Player)
             .ThenInclude(x => x!.Team)
         .Include(x => x.RelatedPlayer)
             .ThenInclude(x => x!.Team)
         .FirstOrDefaultAsync(x => x.Id == id);

        if (matchEvent == null)
        {
            return NotFound(new
            {
                message = "Događaj ne postoji."
            });
        }

        return Ok(MapToDto(matchEvent));
    }


    // ============================================================
    // GET DOGAĐAJI UTAKMICE
    // ============================================================

    [HttpGet("match/{matchId}")]
    public async Task<IActionResult> GetByMatch(int matchId)
    {
        var matchExists = await _context.Matches
            .AnyAsync(x => x.Id == matchId);

        if (!matchExists)
        {
            return NotFound(new
            {
                message = "Utakmica ne postoji."
            });
        }

        var events = await _context.MatchEvents
            .Include(x => x.Player)
                .ThenInclude(x => x!.Team)
            .Include(x => x.RelatedPlayer)
                .ThenInclude(x => x!.Team)
            .Where(x => x.MatchId == matchId)
            .OrderBy(x => x.Minute)
            .ThenBy(x => x.CreatedAt)
            .ToListAsync();

        return Ok(events.Select(MapToDto));
    }


    // ============================================================
    // POST - DODAJ DOGAĐAJ
    // ============================================================

    [HttpPost]
    public async Task<IActionResult> Create(
        CreateMatchEventDto dto)
    {
        try
        {
            var matchEvent = await _matchService.AddEventAsync(
                 dto.MatchId,
                 dto.PlayerId,
                 dto.RelatedPlayerId,
                 (MatchEventType)dto.Type,
                 dto.Minute,
                 dto.Description
             );

            var createdEvent = await _context.MatchEvents
                .Include(x => x.Player)
                    .ThenInclude(x => x!.Team)
                .FirstAsync(x => x.Id == matchEvent.Id);

            return CreatedAtAction(
                nameof(GetById),
                new { id = matchEvent.Id },
                MapToDto(createdEvent)
            );
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new
            {
                message = ex.Message
            });
        }
    }


    // ============================================================
    // PUT - IZMENI DOGAĐAJ
    // ============================================================

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(
        int id,
        UpdateMatchEventDto dto)
    {
        try
        {
            var matchEvent = await _matchService.UpdateEventAsync(
                id,
                dto.PlayerId,
                dto.RelatedPlayerId,
                (MatchEventType)dto.Type,
                dto.Minute,
                dto.Description
            );

            if (matchEvent == null)
            {
                return NotFound(new
                {
                    message = "Događaj ne postoji."
                });
            }

            var updatedEvent = await _context.MatchEvents
                .Include(x => x.Player)
                    .ThenInclude(x => x!.Team)
                .FirstAsync(x => x.Id == id);

            return Ok(MapToDto(updatedEvent));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new
            {
                message = ex.Message
            });
        }
    }


    // ============================================================
    // DELETE - OBRIŠI DOGAĐAJ
    // ============================================================

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        try
        {
            var deleted =
                await _matchService.DeleteEventAsync(id);

            if (!deleted)
            {
                return NotFound(new
                {
                    message = "Događaj ne postoji."
                });
            }

            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new
            {
                message = ex.Message
            });
        }
    }


    // ============================================================
    // MAPIRANJE
    // ============================================================

    private static MatchEventDto MapToDto(
    MatchEvent matchEvent)
    {
        return new MatchEventDto
        {
            Id = matchEvent.Id,

            MatchId = matchEvent.MatchId,

            PlayerId = matchEvent.PlayerId,

            PlayerName = matchEvent.Player != null
                ? (
                    matchEvent.Player.DisplayName
                    ?? $"{matchEvent.Player.FirstName} {matchEvent.Player.LastName}"
                  )
                : null,

            TeamId = matchEvent.Player?.TeamId,

            TeamName = matchEvent.Player?.Team?.Name,

            RelatedPlayerId = matchEvent.RelatedPlayerId,

            RelatedPlayerName = matchEvent.RelatedPlayer != null
                ? (
                    matchEvent.RelatedPlayer.DisplayName
                    ?? $"{matchEvent.RelatedPlayer.FirstName} {matchEvent.RelatedPlayer.LastName}"
                  )
                : null,

            RelatedPlayerTeamId =
                matchEvent.RelatedPlayer?.TeamId,

            Type = (MatchEventTypeDto)matchEvent.Type,

            Minute = matchEvent.Minute,

            Description = matchEvent.Description,

            CreatedAt = matchEvent.CreatedAt
        };
    }
}