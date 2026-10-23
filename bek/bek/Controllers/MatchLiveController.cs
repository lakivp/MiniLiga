using bek.Data;
using bek.Models;
using bek.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;

namespace bek.Controllers;

[ApiController]
[Route("api/matches")]
[Authorize(Roles = "Admin")]
public class MatchLiveController : ControllerBase
{
    private readonly MatchService _matchService;
    private readonly ApplicationDbContext _context;

    public MatchLiveController(
        MatchService matchService,
        ApplicationDbContext context)
    {
        _matchService = matchService;
        _context = context;
    }

    // =========================================================
    // POST: api/matches/1/start
    // =========================================================

    [HttpPost("{matchId}/start")]
    public async Task<IActionResult> StartMatch(int matchId)
    {
        try
        {
            var match = await _matchService.StartMatchAsync(matchId);

            if (match == null)
            {
                return NotFound(new
                {
                    message = "Utakmica nije pronađena."
                });
            }

            return Ok(new
            {
                message = "Utakmica je započeta.",
                matchId = match.Id,
                status = match.Status.ToString(),
                isLive = match.IsLive,
                startedAt = match.StartedAt
            });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new
            {
                message = ex.Message
            });
        }
    }

    // =========================================================
    // POST: api/matches/1/finish
    // =========================================================

    [HttpPost("{matchId}/finish")]
    public async Task<IActionResult> FinishMatch(int matchId)
    {
        try
        {
            var match = await _matchService.FinishMatchAsync(matchId);

            if (match == null)
            {
                return NotFound(new
                {
                    message = "Utakmica nije pronađena."
                });
            }

            return Ok(new
            {
                message = "Utakmica je završena.",
                matchId = match.Id,
                homeScore = match.HomeScore,
                awayScore = match.AwayScore,
                status = match.Status.ToString(),
                isLive = match.IsLive,
                finishedAt = match.FinishedAt
            });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new
            {
                message = ex.Message
            });
        }
    }

    // =========================================================
    // GET: api/matches/1/live
    // =========================================================
    [AllowAnonymous]
    [HttpGet("{matchId}/live")]
    public async Task<IActionResult> GetLiveMatch(int matchId)
    {
        var match = await _context.Matches
            .Include(x => x.Phase)
            .Include(x => x.Group)
            .Include(x => x.Participants)
                .ThenInclude(x => x.Team)
            .Include(x => x.Events)
                .ThenInclude(x => x.Player)
                    .ThenInclude(x => x!.Team)
            .Include(x => x.Events)
                .ThenInclude(x => x.RelatedPlayer)
                    .ThenInclude(x => x!.Team)
            .FirstOrDefaultAsync(x => x.Id == matchId);

        if (match == null)
        {
            return NotFound(new
            {
                message = "Utakmica nije pronađena."
            });
        }

        return Ok(new
        {
            match.Id,

            phase = new
            {
                match.PhaseId,
                name = match.Phase.Name
            },

            group = match.Group == null
                ? null
                : new
                {
                    match.GroupId,
                    name = match.Group.Name
                },

            match.MatchDate,

            match.Round,

            homeScore = match.HomeScore,

            awayScore = match.AwayScore,

            status = match.Status.ToString(),

            match.IsLive,

            match.StartedAt,

            match.FinishedAt,

            participants = match.Participants
                .OrderBy(x => x.Side)
                .Select(x => new
                {
                    side = x.Side.ToString(),

                    x.TeamId,

                    teamName = x.Team?.Name,

                    logoUrl = x.Team?.LogoUrl
                }),

            events = match.Events
                .OrderBy(x => x.Minute)
                .ThenBy(x => x.CreatedAt)
                .Select(x => new
                {
                    x.Id,

                    x.Minute,

                    type = x.Type.ToString(),

                    x.PlayerId,

                    playerName = x.Player == null
                        ? null
                        : (
                            !string.IsNullOrWhiteSpace(
                                x.Player.DisplayName)
                                ? x.Player.DisplayName
                                : $"{x.Player.FirstName} {x.Player.LastName}"
                        ),

                    teamId = x.Player?.TeamId,

                    teamName = x.Player?.Team?.Name,

                    x.Description,

                    relatedPlayerId = x.RelatedPlayerId,

                    relatedPlayerName = x.RelatedPlayer == null
                        ? null
                        : (
                            !string.IsNullOrWhiteSpace(
                                x.RelatedPlayer.DisplayName)
                                ? x.RelatedPlayer.DisplayName
                                : $"{x.RelatedPlayer.FirstName} {x.RelatedPlayer.LastName}"
                        ),

                                        relatedPlayerTeamId = x.RelatedPlayer?.TeamId,

                    x.CreatedAt
                })
        });
    }

    // =========================================================
    // POST: api/matches/1/events
    // =========================================================

    [HttpPost("{matchId}/events")]
    public async Task<IActionResult> AddEvent(
        int matchId,
        [FromBody] AddLiveEventRequest request)
    {
        try
        {
            var matchEvent = await _matchService.AddEventAsync(
                matchId,
                request.PlayerId,
                request.RelatedPlayerId,
                request.Type,
                request.Minute,
                request.Description
            );

            return Ok(new
            {
                message = "Događaj je uspešno dodat.",
                eventId = matchEvent.Id,
                matchId = matchEvent.MatchId,
                playerId = matchEvent.PlayerId,
                relatedPlayerId = matchEvent.RelatedPlayerId,
                type = matchEvent.Type.ToString(),
                minute = matchEvent.Minute
            });
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
    // DELETE LIVE DOGAĐAJ
    // ============================================================

    [HttpDelete("{matchId}/events/{eventId}")]
    public async Task<IActionResult> DeleteEvent(
        int matchId,
        int eventId)
    {
        try
        {
            var matchEvent = await _context.MatchEvents
                .FirstOrDefaultAsync(x =>
                    x.Id == eventId &&
                    x.MatchId == matchId);

            if (matchEvent == null)
            {
                return NotFound(new
                {
                    message = "Događaj ne postoji ili ne pripada ovoj utakmici."
                });
            }

            var deleted =
                await _matchService.DeleteEventAsync(eventId);

            if (!deleted)
            {
                return NotFound(new
                {
                    message = "Događaj nije moguće obrisati."
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
    public class AddLiveEventRequest
    {
        public int? PlayerId { get; set; }

        public int? RelatedPlayerId { get; set; }

        public MatchEventType Type { get; set; }

        public int Minute { get; set; }

        public string? Description { get; set; }
    }

}

