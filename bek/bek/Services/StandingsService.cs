using bek.Data;
using bek.DTOs;
using bek.Models;
using Microsoft.EntityFrameworkCore;

namespace bek.Services;

public class StandingsService
{
    private readonly ApplicationDbContext _context;

    public StandingsService(ApplicationDbContext context)
    {
        _context = context;
    }

    // =========================================================
    // TABELA JEDNE GRUPE
    // =========================================================

    public async Task<List<GroupStandingsDto>> GetGroupStandingsAsync(
        int groupId)
    {
        var group = await _context.CompetitionGroups
            .AsNoTracking()
            .Include(x => x.Teams)
                .ThenInclude(x => x.Team)
            .FirstOrDefaultAsync(x => x.Id == groupId);

        if (group == null)
        {
            throw new KeyNotFoundException(
                "Grupa nije pronađena."
            );
        }

        // -----------------------------------------------------
        // Uzimamo samo ZAVRŠENE utakmice ove konkretne grupe.
        // -----------------------------------------------------

        var matches = await _context.Matches
            .AsNoTracking()
            .Where(x =>
                x.GroupId == groupId &&
                x.Status == MatchStatus.Finished)
            .Include(x => x.Participants)
                .ThenInclude(x => x.Team)
            .ToListAsync();

        // -----------------------------------------------------
        // Kreiramo početnu tabelu za SVE timove grupe.
        // -----------------------------------------------------

        var standings = group.Teams
            .Select(x => new GroupStandingsDto
            {
                TeamId = x.TeamId,
                TeamName = x.Team.Name,
                ShortName = x.Team.ShortName,
                LogoUrl = x.Team.LogoUrl,

                Played = 0,
                Wins = 0,
                Draws = 0,
                Losses = 0,
                GoalsFor = 0,
                GoalsAgainst = 0,
                GoalDifference = 0,
                Points = 0
            })
            .ToDictionary(
                x => x.TeamId,
                x => x
            );

        // -----------------------------------------------------
        // Obrađujemo utakmice
        // -----------------------------------------------------

        foreach (var match in matches)
        {
            var homeParticipant = match.Participants
                .FirstOrDefault(x =>
                    x.Side == ParticipantSide.Home &&
                    x.TeamId.HasValue);

            var awayParticipant = match.Participants
                .FirstOrDefault(x =>
                    x.Side == ParticipantSide.Away &&
                    x.TeamId.HasValue);

            // Ako utakmica nema oba konkretna tima,
            // preskačemo je.
            if (
                homeParticipant?.TeamId == null ||
                awayParticipant?.TeamId == null
            )
            {
                continue;
            }

            var homeTeamId =
                homeParticipant.TeamId.Value;

            var awayTeamId =
                awayParticipant.TeamId.Value;

            // Sigurnost: obrađujemo samo timove
            // koji stvarno pripadaju ovoj grupi.
            if (
                !standings.ContainsKey(homeTeamId) ||
                !standings.ContainsKey(awayTeamId)
            )
            {
                continue;
            }

            var home = standings[homeTeamId];
            var away = standings[awayTeamId];

            var homeGoals = match.HomeScore;
            var awayGoals = match.AwayScore;

            // -------------------------------------------------
            // Odigrane utakmice
            // -------------------------------------------------

            home.Played++;
            away.Played++;

            // -------------------------------------------------
            // Golovi
            // -------------------------------------------------

            home.GoalsFor += homeGoals;
            home.GoalsAgainst += awayGoals;

            away.GoalsFor += awayGoals;
            away.GoalsAgainst += homeGoals;

            // -------------------------------------------------
            // Rezultat
            // -------------------------------------------------

            if (homeGoals > awayGoals)
            {
                home.Wins++;
                home.Points += 3;

                away.Losses++;
            }
            else if (homeGoals < awayGoals)
            {
                away.Wins++;
                away.Points += 3;

                home.Losses++;
            }
            else
            {
                home.Draws++;
                away.Draws++;

                home.Points++;
                away.Points++;
            }
        }

        // -----------------------------------------------------
        // Gol razlika
        // -----------------------------------------------------

        foreach (var team in standings.Values)
        {
            team.GoalDifference =
                team.GoalsFor -
                team.GoalsAgainst;
        }

        // -----------------------------------------------------
        // Sortiranje tabele
        //
        // 1. Bodovi
        // 2. Gol razlika
        // 3. Dati golovi
        // 4. Naziv tima
        // -----------------------------------------------------

        var result = standings.Values
            .OrderByDescending(x => x.Points)
            .ThenByDescending(x => x.GoalDifference)
            .ThenByDescending(x => x.GoalsFor)
            .ThenBy(x => x.TeamName)
            .ToList();

        // -----------------------------------------------------
        // Pozicija
        // -----------------------------------------------------

        for (var i = 0; i < result.Count; i++)
        {
            result[i].Position = i + 1;
        }

        return result;
    }

    // =========================================================
    // SVE TABELE JEDNE FAZE
    // =========================================================

    public async Task<
        Dictionary<int, List<GroupStandingsDto>>
    > GetPhaseStandingsAsync(int phaseId)
    {
        var groups = await _context.CompetitionGroups
            .AsNoTracking()
            .Where(x => x.PhaseId == phaseId)
            .OrderBy(x => x.Order)
            .ThenBy(x => x.Name)
            .Select(x => x.Id)
            .ToListAsync();

        var result =
            new Dictionary<int, List<GroupStandingsDto>>();

        foreach (var groupId in groups)
        {
            result[groupId] =
                await GetGroupStandingsAsync(groupId);
        }

        return result;
    }
}