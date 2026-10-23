using bek.Data;
using bek.DTOs;
using bek.Models;
using Microsoft.EntityFrameworkCore;

namespace bek.Services;

public class MatchDetailsService
{
    private readonly ApplicationDbContext _context;
    private readonly MatchLineupService _lineupService;

    public MatchDetailsService(
        ApplicationDbContext context,
        MatchLineupService lineupService)
    {
        _context = context;
        _lineupService = lineupService;
    }

    public async Task<MatchDetailsDto?> GetMatchDetailsAsync(int matchId)
    {
        var matchExists = await _context.Matches
            .AnyAsync(x => x.Id == matchId);

        if (!matchExists)
            return null;

        // Automatski generiši sastav za timove koji su već poznati.
        // Metoda je idempotentna: neće ponovo dodavati postojeće igrače.
        await _lineupService.PopulateCurrentRosterAsync(matchId);

        var match = await _context.Matches
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
            return null;

        var lineups = await _context.MatchLineups
            .Include(x => x.Player)
            .Include(x => x.Team)
            .Where(x => x.MatchId == matchId)
            .OrderBy(x => x.TeamId)
            .ThenBy(x => x.IsStarter ? 0 : 1)
            .ThenBy(x => x.Order)
            .ToListAsync();

        var homeParticipant = match.Participants
            .FirstOrDefault(x => x.Side == ParticipantSide.Home);

        var awayParticipant = match.Participants
            .FirstOrDefault(x => x.Side == ParticipantSide.Away);

        var homeTeam = homeParticipant?.Team;
        var awayTeam = awayParticipant?.Team;

        return new MatchDetailsDto
        {
            Id = match.Id,
            MatchDate = match.MatchDate,
            HomeScore = match.HomeScore,
            AwayScore = match.AwayScore,
            Status = (MatchStatusDto)match.Status,
            IsLive = match.IsLive,
            StartedAt = match.StartedAt,
            FinishedAt = match.FinishedAt,
            Location = match.Location,

            HomeTeam = homeTeam == null ? null : new MatchTeamDto
            {
                Id = homeTeam.Id,
                Name = homeTeam.Name,
                ShortName = homeTeam.ShortName,
                LogoUrl = homeTeam.LogoUrl,
                PrimaryColor = homeTeam.PrimaryColor,
                SecondaryColor = homeTeam.SecondaryColor
            },

            AwayTeam = awayTeam == null ? null : new MatchTeamDto
            {
                Id = awayTeam.Id,
                Name = awayTeam.Name,
                ShortName = awayTeam.ShortName,
                LogoUrl = awayTeam.LogoUrl,
                PrimaryColor = awayTeam.PrimaryColor,
                SecondaryColor = awayTeam.SecondaryColor
            },

            HomeLineup = homeTeam == null
                ? new List<MatchLineupDto>()
                : lineups
                    .Where(x => x.TeamId == homeTeam.Id)
                    .Select(MapLineupToDto)
                    .ToList(),

            AwayLineup = awayTeam == null
                ? new List<MatchLineupDto>()
                : lineups
                    .Where(x => x.TeamId == awayTeam.Id)
                    .Select(MapLineupToDto)
                    .ToList(),

            Events = match.Events
                .OrderBy(x => x.Minute)
                .ThenBy(x => x.CreatedAt)
                .Select(MapEventToDto)
                .ToList()
        };
    }

    private static MatchLineupDto MapLineupToDto(
        MatchLineup lineup)
    {
        return new MatchLineupDto
        {
            Id = lineup.Id,

            MatchId = lineup.MatchId,

            PlayerId = lineup.PlayerId,

            PlayerName =
                $"{lineup.Player.FirstName} {lineup.Player.LastName}".Trim(),

            JerseyNumber = lineup.Player.JerseyNumber,

            PlayerPhotoUrl = lineup.Player.PhotoUrl,

            TeamId = lineup.TeamId,

            TeamName = lineup.Team.Name,

            TeamLogoUrl = lineup.Team.LogoUrl,

            IsStarter = lineup.IsStarter,

            IsSubstitute = lineup.IsSubstitute,

            Position = lineup.Position,

            Order = lineup.Order,

            EnteredMinute = lineup.EnteredMinute,

            LeftMinute = lineup.LeftMinute,

            Notes = lineup.Notes
        };
    }

    private static MatchEventDto MapEventToDto(
        MatchEvent matchEvent)
    {
        return new MatchEventDto
        {
            Id = matchEvent.Id,

            MatchId = matchEvent.MatchId,

            PlayerId = matchEvent.PlayerId,

            PlayerName = matchEvent.Player == null
                ? null
                : $"{matchEvent.Player.FirstName} {matchEvent.Player.LastName}".Trim(),

            TeamId = matchEvent.Player?.TeamId,

            TeamName = matchEvent.Player?.Team?.Name,

            RelatedPlayerId = matchEvent.RelatedPlayerId,

            RelatedPlayerName = matchEvent.RelatedPlayer == null
                ? null
                : $"{matchEvent.RelatedPlayer.FirstName} {matchEvent.RelatedPlayer.LastName}".Trim(),

            RelatedPlayerTeamId = matchEvent.RelatedPlayer?.TeamId,

            Type = (MatchEventTypeDto)matchEvent.Type,

            Minute = matchEvent.Minute,

            Description = matchEvent.Description,

            CreatedAt = matchEvent.CreatedAt
        };
    }
}