using bek.Data;
using bek.DTOs;
using bek.Models;
using bek.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace bek.Controllers;

[ApiController]
[Route("api/GroupMatches")]
public class GroupMatchesController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public GroupMatchesController(
        ApplicationDbContext context)
    {
        _context = context;
    }

    // =========================================================
    // GET: api/GroupMatches/group/5
    // =========================================================

    [HttpGet("group/{groupId:int}")]
    public async Task<ActionResult<List<GroupMatchDto>>> GetGroupMatches(
        int groupId)
    {
        var groupExists = await _context.CompetitionGroups
            .AnyAsync(x => x.Id == groupId);

        if (!groupExists)
        {
            return NotFound(new
            {
                message = "Grupa nije pronađena."
            });
        }

        var matches = await _context.Matches
            .AsNoTracking()
            .Where(x => x.GroupId == groupId)
            .Include(x => x.Participants)
                .ThenInclude(x => x.Team)
            .OrderBy(x => x.MatchDate)
            .ThenBy(x => x.Round)
            .ThenBy(x => x.Id)
            .ToListAsync();

        var result = matches
            .Select(match =>
            {
                var homeParticipant = match.Participants
                    .FirstOrDefault(x =>
                        x.Side == ParticipantSide.Home);

                var awayParticipant = match.Participants
                    .FirstOrDefault(x =>
                        x.Side == ParticipantSide.Away);

                return new GroupMatchDto
                {
                    Id = match.Id,

                    GroupId = match.GroupId!.Value,

                    PhaseId = match.PhaseId,

                    MatchDate = match.MatchDate,

                    Round = match.Round,

                    HomeScore = match.HomeScore,

                    AwayScore = match.AwayScore,

                    Status = (MatchStatusDto)match.Status,

                    IsLive = match.IsLive,

                    Location = match.Location,

                    HomeTeam =
                        homeParticipant?.Team == null
                            ? null
                            : new GroupMatchTeamDto
                            {
                                Id = homeParticipant.Team.Id,
                                Name = homeParticipant.Team.Name,
                                ShortName = homeParticipant.Team.ShortName,
                                LogoUrl = homeParticipant.Team.LogoUrl
                            },

                    AwayTeam =
                        awayParticipant?.Team == null
                            ? null
                            : new GroupMatchTeamDto
                            {
                                Id = awayParticipant.Team.Id,
                                Name = awayParticipant.Team.Name,
                                ShortName = awayParticipant.Team.ShortName,
                                LogoUrl = awayParticipant.Team.LogoUrl
                            }
                };
            })
            .ToList();

        foreach (var match in result)
        {
            if (match.HomeTeam != null)
            {
                match.HomeTeam.LogoUrl = ImageStorageService.ToPublicUrl(
                    Request,
                    match.HomeTeam.LogoUrl);
            }

            if (match.AwayTeam != null)
            {
                match.AwayTeam.LogoUrl = ImageStorageService.ToPublicUrl(
                    Request,
                    match.AwayTeam.LogoUrl);
            }
        }

        return Ok(result);
    }
}