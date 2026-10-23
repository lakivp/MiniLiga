using bek.Data;
using bek.DTOs;
using bek.Models;
using Microsoft.EntityFrameworkCore;

namespace bek.Services;

public class PublicStandingsService
{
    private readonly ApplicationDbContext _context;

    public PublicStandingsService(
        ApplicationDbContext context)
    {
        _context = context;
    }


    // =========================================================
    // AKTIVNA TAKMIČENJA
    // =========================================================

    public async Task<List<PublicStandingsCompetitionDto>>
        GetActiveCompetitionsAsync()
    {
        return await _context.Competitions
            .AsNoTracking()
            .Where(x => x.IsActive)
            .OrderBy(x => x.Id)
            .Select(x => new PublicStandingsCompetitionDto
            {
                Id = x.Id,
                Name = x.Name,
                IsActive = x.IsActive
            })
            .ToListAsync();
    }


    // =========================================================
    // TABELA ZA TAKMIČENJE
    // =========================================================

    public async Task<PublicStandingsResponseDto?>
        GetStandingsAsync(int competitionId)
    {
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
        // SAMO LEAGUE I PLAYOFF
        //
        // League = 0
        // Playoff = 2
        // Knockout = 3 -> IGNORIŠE SE
        // -----------------------------------------------------

        var phases = await _context.CompetitionPhases
            .AsNoTracking()
            .Where(x =>
                x.CompetitionId == competitionId &&
                (
                    x.Type == PhaseType.League ||
                    x.Type == PhaseType.Playoff
                )
            )
            .Include(x => x.Groups)
                .ThenInclude(x => x.Teams)
                    .ThenInclude(x => x.Team)
            .OrderBy(x => x.Order)
            .ThenBy(x => x.Id)
            .ToListAsync();


        var response = new PublicStandingsResponseDto
        {
            CompetitionId = competition.Id,

            CompetitionName = competition.Name,

            Phases = []
        };


        foreach (var phase in phases)
        {
            var phaseDto = new PublicStandingsPhaseDto
            {
                Id = phase.Id,

                Name = phase.Name,

                Type = (int)phase.Type,

                Order = phase.Order,

                Tables = []
            };


            // =================================================
            // AKO FAZA IMA GRUPE
            //
            // SVAKA GRUPA = SVOJA TABELA
            // =================================================

            if (phase.Groups.Any())
            {
                foreach (var group in phase.Groups
                    .OrderBy(x => x.Order)
                    .ThenBy(x => x.Id))
                {
                    var table =
                        await CalculateGroupStandingsAsync(
                            phase.Id,
                            group.Id,
                            group.Name,
                            group.Teams
                                .Where(x => x.Team != null)
                                .Select(x => x.Team)
                                .ToList()
                        );

                    phaseDto.Tables.Add(table);
                }
            }

            // =================================================
            // AKO FAZA NEMA GRUPE
            //
            // NAPRAVI JEDNU TABELU ZA CELU FAZU
            // =================================================

            else
            {
                var table =
                    await CalculatePhaseStandingsAsync(
                        phase.Id,
                        phase.Name
                    );

                if (table.Teams.Count > 0)
                {
                    phaseDto.Tables.Add(table);
                }
            }


            // =================================================
            // FAZU PRIKAZUJEMO SAMO AKO IMA TABELU
            // =================================================

            if (phaseDto.Tables.Count > 0)
            {
                response.Phases.Add(phaseDto);
            }
        }


        return response;
    }


    // =========================================================
    // TABELA GRUPE
    // =========================================================

    private async Task<PublicStandingsTableDto>
        CalculateGroupStandingsAsync(
            int phaseId,
            int groupId,
            string groupName,
            List<Team> teams)
    {
        var teamIds = teams
            .Select(x => x.Id)
            .Distinct()
            .ToList();


        var standings =
            CreateInitialStandings(teams);


        if (teamIds.Count == 0)
        {
            return new PublicStandingsTableDto
            {
                GroupId = groupId,

                GroupName = groupName,

                Teams = []
            };
        }


        // -----------------------------------------------------
        // SAMO ZAVRŠENE UTAKMICE TE GRUPE
        // -----------------------------------------------------

        var matches = await _context.Matches
            .AsNoTracking()
            .Include(x => x.Participants)
            .Where(x =>
                x.PhaseId == phaseId &&
                x.GroupId == groupId &&
                x.Status == MatchStatus.Finished
            )
            .OrderBy(x => x.MatchDate)
            .ToListAsync();


        foreach (var match in matches)
        {
            var home =
                match.Participants
                    .FirstOrDefault(x =>
                        x.Side == ParticipantSide.Home &&
                        x.TeamId.HasValue);

            var away =
                match.Participants
                    .FirstOrDefault(x =>
                        x.Side == ParticipantSide.Away &&
                        x.TeamId.HasValue);


            // Ako utakmica nema konkretne timove,
            // ne utiče na tabelu.
            if (
                home?.TeamId == null ||
                away?.TeamId == null
            )
            {
                continue;
            }


            if (
                !standings.ContainsKey(home.TeamId.Value) ||
                !standings.ContainsKey(away.TeamId.Value)
            )
            {
                continue;
            }


            var homeStanding =
                standings[home.TeamId.Value];

            var awayStanding =
                standings[away.TeamId.Value];


            var homeGoals =
                match.HomeScore;

            var awayGoals =
                match.AwayScore;


            // -------------------------------------------------
            // ODIGRANA
            // -------------------------------------------------

            homeStanding.Played++;

            awayStanding.Played++;


            // -------------------------------------------------
            // GOLOVI
            // -------------------------------------------------

            homeStanding.GoalsFor += homeGoals;

            homeStanding.GoalsAgainst += awayGoals;

            awayStanding.GoalsFor += awayGoals;

            awayStanding.GoalsAgainst += homeGoals;


            // -------------------------------------------------
            // REZULTAT
            // -------------------------------------------------

            if (homeGoals > awayGoals)
            {
                homeStanding.Wins++;

                awayStanding.Losses++;

                homeStanding.Points += 3;
            }
            else if (homeGoals < awayGoals)
            {
                awayStanding.Wins++;

                homeStanding.Losses++;

                awayStanding.Points += 3;
            }
            else
            {
                homeStanding.Draws++;

                awayStanding.Draws++;

                homeStanding.Points++;

                awayStanding.Points++;
            }
        }


        return BuildSortedTable(
            groupId,
            groupName,
            standings
        );
    }


    // =========================================================
    // TABELA FAZE BEZ GRUPE
    // =========================================================

    private async Task<PublicStandingsTableDto>
        CalculatePhaseStandingsAsync(
            int phaseId,
            string phaseName)
    {
        var matches = await _context.Matches
            .AsNoTracking()
            .Include(x => x.Participants)
                .ThenInclude(x => x.Team)
            .Where(x =>
                x.PhaseId == phaseId &&
                x.Status == MatchStatus.Finished
            )
            .OrderBy(x => x.MatchDate)
            .ToListAsync();


        var teams = matches
            .SelectMany(x => x.Participants)
            .Where(x =>
                x.TeamId.HasValue &&
                x.Team != null
            )
            .Select(x => x.Team!)
            .GroupBy(x => x.Id)
            .Select(x => x.First())
            .ToList();


        var standings =
            CreateInitialStandings(teams);


        foreach (var match in matches)
        {
            var home =
                match.Participants
                    .FirstOrDefault(x =>
                        x.Side == ParticipantSide.Home &&
                        x.TeamId.HasValue);

            var away =
                match.Participants
                    .FirstOrDefault(x =>
                        x.Side == ParticipantSide.Away &&
                        x.TeamId.HasValue);


            if (
                home?.TeamId == null ||
                away?.TeamId == null
            )
            {
                continue;
            }


            if (
                !standings.ContainsKey(home.TeamId.Value) ||
                !standings.ContainsKey(away.TeamId.Value)
            )
            {
                continue;
            }


            var homeStanding =
                standings[home.TeamId.Value];

            var awayStanding =
                standings[away.TeamId.Value];


            var homeGoals =
                match.HomeScore;

            var awayGoals =
                match.AwayScore;


            homeStanding.Played++;

            awayStanding.Played++;


            homeStanding.GoalsFor += homeGoals;

            homeStanding.GoalsAgainst += awayGoals;

            awayStanding.GoalsFor += awayGoals;

            awayStanding.GoalsAgainst += homeGoals;


            if (homeGoals > awayGoals)
            {
                homeStanding.Wins++;

                awayStanding.Losses++;

                homeStanding.Points += 3;
            }
            else if (homeGoals < awayGoals)
            {
                awayStanding.Wins++;

                homeStanding.Losses++;

                awayStanding.Points += 3;
            }
            else
            {
                homeStanding.Draws++;

                awayStanding.Draws++;

                homeStanding.Points++;

                awayStanding.Points++;
            }
        }


        return BuildSortedTable(
            null,
            phaseName,
            standings
        );
    }


    // =========================================================
    // POČETNA STATISTIKA TIMOVA
    // =========================================================

    private Dictionary<int, PublicStandingTeamDto>
        CreateInitialStandings(
            List<Team> teams)
    {
        return teams
            .GroupBy(x => x.Id)
            .Select(x => x.First())
            .ToDictionary(
                x => x.Id,
                x => new PublicStandingTeamDto
                {
                    Position = 0,

                    TeamId = x.Id,

                    TeamName = x.Name,

                    ShortName = x.ShortName,

                    LogoUrl = x.LogoUrl,

                    Played = 0,

                    Wins = 0,

                    Draws = 0,

                    Losses = 0,

                    GoalsFor = 0,

                    GoalsAgainst = 0,

                    GoalDifference = 0,

                    Points = 0
                }
            );
    }


    // =========================================================
    // SORTIRANJE TABELE
    // =========================================================

    private PublicStandingsTableDto
        BuildSortedTable(
            int? groupId,
            string groupName,
            Dictionary<int, PublicStandingTeamDto>
                standings)
    {
        var sorted = standings
            .Values
            .Select(x =>
            {
                x.GoalDifference =
                    x.GoalsFor -
                    x.GoalsAgainst;

                return x;
            })
            .OrderByDescending(x => x.Points)
            .ThenByDescending(x => x.GoalDifference)
            .ThenByDescending(x => x.GoalsFor)
            .ThenByDescending(x => x.Wins)
            .ThenBy(x => x.TeamName)
            .ToList();


        for (var i = 0; i < sorted.Count; i++)
        {
            sorted[i].Position = i + 1;
        }


        return new PublicStandingsTableDto
        {
            GroupId = groupId,

            GroupName = groupName,

            Teams = sorted
        };
    }
}