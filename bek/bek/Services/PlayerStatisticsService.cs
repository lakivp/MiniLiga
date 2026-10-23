using bek.Data;
using bek.DTOs;
using bek.Models;
using Microsoft.EntityFrameworkCore;

namespace bek.Services;

public class PlayerStatisticsService
{
    private readonly ApplicationDbContext _context;

    public PlayerStatisticsService(ApplicationDbContext context)
    {
        _context = context;
    }

    // ============================================================
    // SVI IGRAČI
    // ============================================================

    public async Task<List<PlayerStatisticsDto>>
    GetAllPlayersStatisticsAsync()
    {
        var players = await _context.Players
            .Include(x => x.Team)
            .Where(x => x.IsActive)
            .ToListAsync();

        var finishedMatchIds = await _context.Matches
            .Where(x => x.Status == MatchStatus.Finished)
            .Select(x => x.Id)
            .ToListAsync();

        var events = await _context.MatchEvents
            .Where(x =>
                finishedMatchIds.Contains(x.MatchId))
            .ToListAsync();

        var lineups = await _context.MatchLineups
            .Where(x =>
                finishedMatchIds.Contains(x.MatchId))
            .ToListAsync();

        var result = new List<PlayerStatisticsDto>();

        foreach (var player in players)
        {
            var playerEvents = events
                .Where(x => x.PlayerId == player.Id)
                .ToList();

            var playerLineups = lineups
                .Where(x => x.PlayerId == player.Id)
                .ToList();

            result.Add(
                CreateStatistics(
                    player,
                    playerEvents,
                    playerLineups
                )
            );
        }

        return result
            .OrderByDescending(x => x.Goals)
            .ThenByDescending(x => x.Assists)
            .ThenByDescending(x => x.Appearances)
            .ThenBy(x => x.PlayerName)
            .ToList();
    }


    // ============================================================
    // JEDAN IGRAČ
    // ============================================================
    public async Task<PlayerStatisticsDto?> GetPlayerStatisticsAsync(
        int playerId)
    {
        var player = await _context.Players
            .Include(x => x.Team)
            .FirstOrDefaultAsync(x => x.Id == playerId);

        if (player == null)
            return null;

        var events = await _context.MatchEvents
            .Include(x => x.Match)
            .Where(x =>
                x.PlayerId == playerId &&
                x.Match.Status == MatchStatus.Finished)
            .ToListAsync();

        var lineups = await _context.MatchLineups
            .Include(x => x.Match)
            .Where(x =>
                x.PlayerId == playerId &&
                x.Match.Status == MatchStatus.Finished)
            .ToListAsync();

        return CreateStatistics(
            player,
            events,
            lineups
        );
    }


    // ============================================================
    // IGRAČI JEDNOG TIMA
    // ============================================================


    public async Task<List<PlayerStatisticsDto>> GetTeamStatisticsAsync(
        int teamId)
    {
        var teamExists = await _context.Teams
            .AnyAsync(x => x.Id == teamId);

        if (!teamExists)
            throw new InvalidOperationException(
                "Tim ne postoji."
            );

        var players = await _context.Players
            .Include(x => x.Team)
            .Where(x =>
                x.TeamId == teamId &&
                x.IsActive)
            .ToListAsync();

        var events = await _context.MatchEvents
            .Include(x => x.Match)
            .Where(x =>
                x.Match.Status == MatchStatus.Finished)
            .ToListAsync();

        var lineups = await _context.MatchLineups
            .Include(x => x.Match)
            .Where(x =>
                x.TeamId == teamId &&
                x.Match.Status == MatchStatus.Finished)
            .ToListAsync();

        var result = new List<PlayerStatisticsDto>();

        foreach (var player in players)
        {
            var playerEvents = events
                .Where(x => x.PlayerId == player.Id)
                .ToList();

            var playerLineups = lineups
                .Where(x => x.PlayerId == player.Id)
                .ToList();

            result.Add(
                CreateStatistics(
                    player,
                    playerEvents,
                    playerLineups
                )
            );
        }

        return result
            .OrderByDescending(x => x.Goals)
            .ThenByDescending(x => x.Assists)
            .ThenByDescending(x => x.Appearances)
            .ThenBy(x => x.PlayerName)
            .ToList();
    }


    // ============================================================
    // KREIRANJE STATISTIKE
    // ============================================================

    private static PlayerStatisticsDto CreateStatistics(
    Player player,
    List<MatchEvent> events,
    List<MatchLineup> lineups)
    {
        var starts = lineups.Count(x =>
            x.IsStarter);

        var substituteAppearances = lineups.Count(x =>
            x.EnteredMinute.HasValue);

        var appearances =
            starts + substituteAppearances;

        return new PlayerStatisticsDto
        {
            PlayerId = player.Id,

            PlayerName =
                player.DisplayName
                ?? $"{player.FirstName} {player.LastName}",

            JerseyNumber = player.JerseyNumber,

            Position = player.Position,

            TeamId = player.TeamId,

            TeamName = player.Team.Name,

            TeamLogoUrl = player.Team.LogoUrl,

            Appearances = appearances,

            Starts = starts,

            SubstituteAppearances =
                substituteAppearances,

            Goals = events.Count(x =>
                x.Type == MatchEventType.Goal),

            Assists = events.Count(x =>
                x.Type == MatchEventType.Assist),

            YellowCards = events.Count(x =>
                x.Type == MatchEventType.YellowCard),

            RedCards = events.Count(x =>
                x.Type == MatchEventType.RedCard)
        };
    }
}