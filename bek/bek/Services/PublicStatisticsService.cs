using bek.Data;
using bek.DTOs;
using bek.Models;
using Microsoft.EntityFrameworkCore;

namespace bek.Services;

public class PublicStatisticsService
{
    private readonly ApplicationDbContext _context;

    public PublicStatisticsService(
        ApplicationDbContext context)
    {
        _context = context;
    }

    // =========================================================
    // AKTIVNA TAKMIČENJA
    // =========================================================

    public async Task<List<PublicCompetitionOptionDto>>
        GetActiveCompetitionsAsync()
    {
        return await _context.Competitions
            .AsNoTracking()
            .Where(x => x.IsActive)
            .OrderBy(x => x.Id)
            .Select(x => new PublicCompetitionOptionDto
            {
                Id = x.Id,
                Name = x.Name,
                IsActive = x.IsActive
            })
            .ToListAsync();
    }


    // =========================================================
    // STATISTIKA TAKMIČENJA
    // =========================================================

    public async Task<PublicStatisticsResponseDto?>
        GetStatisticsAsync(int competitionId)
    {
        // -----------------------------------------------------
        // PRONAĐI TAKMIČENJE
        // -----------------------------------------------------

        var competition = await _context.Competitions
            .AsNoTracking()
            .FirstOrDefaultAsync(x =>
                x.Id == competitionId &&
                x.IsActive);

        if (competition == null)
        {
            return null;
        }


        // -----------------------------------------------------
        // UČITAJ GOLOVE
        //
        // MatchEvent:
        // Goal = 0
        //
        // Putanja:
        //
        // MatchEvent
        //   -> Match
        //      -> Phase
        //         -> Competition
        //
        // -----------------------------------------------------

        var goals = await _context.MatchEvents
            .AsNoTracking()
            .Where(x =>
                x.Type == MatchEventType.Goal &&
                x.PlayerId.HasValue &&
                (
                    x.Match.Status == MatchStatus.Finished ||
                    x.Match.Status == MatchStatus.Live
                ) &&
                x.Match.Phase.CompetitionId == competitionId
            )
            .GroupBy(x => x.PlayerId!.Value)
            .Select(x => new
            {
                PlayerId = x.Key,
                Goals = x.Count()
            })
            .ToListAsync();


        // -----------------------------------------------------
        // UČITAJ ASISTENCIJE
        //
        // MatchEvent:
        // Assist = 3
        // -----------------------------------------------------

        var assists = await _context.MatchEvents
            .AsNoTracking()
            .Where(x =>
                x.Type == MatchEventType.Assist &&
                x.PlayerId.HasValue &&
                (
                    x.Match.Status == MatchStatus.Finished ||
                    x.Match.Status == MatchStatus.Live
                ) &&
                x.Match.Phase.CompetitionId == competitionId
            )
            .GroupBy(x => x.PlayerId!.Value)
            .Select(x => new
            {
                PlayerId = x.Key,
                Assists = x.Count()
            })
            .ToListAsync();


        // -----------------------------------------------------
        // KOMBINUJ ID-EVE IGRAČA
        // -----------------------------------------------------

        var playerIds = goals
            .Select(x => x.PlayerId)
            .Union(
                assists.Select(x => x.PlayerId)
            )
            .ToList();


        if (playerIds.Count == 0)
        {
            return new PublicStatisticsResponseDto
            {
                CompetitionId = competition.Id,
                CompetitionName = competition.Name,
                TopScorers = [],
                TopAssists = []
            };
        }


        // -----------------------------------------------------
        // IGRAČI
        // -----------------------------------------------------

        var players = await _context.Players
            .AsNoTracking()
            .Include(x => x.Team)
            .Where(x =>
                x.IsActive &&
                playerIds.Contains(x.Id)
            )
            .ToListAsync();


        // -----------------------------------------------------
        // MAPIRANJE
        // -----------------------------------------------------

        var goalMap = goals.ToDictionary(
            x => x.PlayerId,
            x => x.Goals
        );

        var assistMap = assists.ToDictionary(
            x => x.PlayerId,
            x => x.Assists
        );


        var statistics = players
            .Select(player => new PublicPlayerStatisticDto
            {
                PlayerId = player.Id,

                PlayerName =
                    $"{player.FirstName} {player.LastName}".Trim(),

                JerseyNumber = player.JerseyNumber,

                PhotoUrl = player.PhotoUrl,

                TeamId = player.TeamId,

                TeamName = player.Team?.Name ?? string.Empty,

                TeamLogoUrl = player.Team?.LogoUrl,

                Goals =
                    goalMap.TryGetValue(
                        player.Id,
                        out var goalsCount)
                        ? goalsCount
                        : 0,

                Assists =
                    assistMap.TryGetValue(
                        player.Id,
                        out var assistsCount)
                        ? assistsCount
                        : 0
            })
            .ToList();


        // -----------------------------------------------------
        // STRELCI
        //
        // SAMO IGRAČI SA 1+ GOLOM
        // -----------------------------------------------------

        var topScorers = statistics
            .Where(x => x.Goals > 0)
            .OrderByDescending(x => x.Goals)
            .ThenBy(x => x.PlayerName)
            .Take(50)
            .ToList();


        // -----------------------------------------------------
        // ASISTENCIJE
        //
        // SAMO IGRAČI SA 1+ ASISTENCIJOM
        // -----------------------------------------------------

        var topAssists = statistics
            .Where(x => x.Assists > 0)
            .OrderByDescending(x => x.Assists)
            .ThenBy(x => x.PlayerName)
            .Take(50)
            .ToList();


        // -----------------------------------------------------
        // RESPONSE
        // -----------------------------------------------------

        return new PublicStatisticsResponseDto
        {
            CompetitionId = competition.Id,

            CompetitionName = competition.Name,

            TopScorers = topScorers,

            TopAssists = topAssists
        };
    }
}