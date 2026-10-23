using bek.Data;
using bek.DTOs;
using bek.Models;
using Microsoft.EntityFrameworkCore;

namespace bek.Services;

public class PublicResultsService
{
    private readonly ApplicationDbContext _context;

    public PublicResultsService(
        ApplicationDbContext context)
    {
        _context = context;
    }


    // =========================================================
    // AKTIVNA TAKMIČENJA
    // =========================================================

    public async Task<List<PublicResultsCompetitionDto>>
        GetActiveCompetitionsAsync()
    {
        return await _context.Competitions
            .AsNoTracking()
            .Where(x => x.IsActive)
            .OrderBy(x => x.Id)
            .Select(x => new PublicResultsCompetitionDto
            {
                Id = x.Id,
                Name = x.Name,
                IsActive = x.IsActive
            })
            .ToListAsync();
    }


    // =========================================================
    // REZULTATI TAKMIČENJA
    // =========================================================

    public async Task<PublicResultsResponseDto?>
        GetResultsAsync(int competitionId)
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
        // FAZE TAKMIČENJA
        // -----------------------------------------------------

        var phases = await _context.CompetitionPhases
            .AsNoTracking()
            .Where(x =>
                x.CompetitionId == competitionId)
            .Include(x => x.Groups)
            .OrderBy(x => x.Order)
            .ThenBy(x => x.Id)
            .ToListAsync();


        // SVE UTAKMICE TAKMIČENJA
        
        var matches = await _context.Matches
            .AsNoTracking()

            .Where(x =>
                x.Phase.CompetitionId == competitionId &&
                x.Status != MatchStatus.Cancelled)

            .Include(x => x.Phase)

            .Include(x => x.Group)

            .Include(x => x.Participants)
                .ThenInclude(x => x.Team)

            .Include(x => x.Participants)
                .ThenInclude(x => x.SourceGroup)

            .OrderByDescending(x => x.MatchDate)
            .ThenByDescending(x => x.Id)

            .ToListAsync();

        var response = new PublicResultsResponseDto
        {
            CompetitionId = competition.Id,

            CompetitionName =
                competition.Name
        };


        // =====================================================
        // FAZE
        // =====================================================

        foreach (var phase in phases)
        {
            var phaseMatches = matches
                .Where(x =>
                    x.PhaseId == phase.Id)
                .ToList();


            // Ako faza nema završene utakmice,
            // nema potrebe da je prikazujemo.
            if (phaseMatches.Count == 0)
            {
                continue;
            }


            var phaseDto =
                new PublicResultsPhaseDto
                {
                    Id = phase.Id,

                    Name = phase.Name,

                    Type = (int)phase.Type,

                    Order = phase.Order
                };


            // =================================================
            // KOLA
            //
            // Kola se koriste za:
            // League
            // Playoff
            //
            // Za Knockout ih ne prikazujemo.
            // =================================================

            if (
                phase.Type == PhaseType.League ||
                phase.Type == PhaseType.Playoff
            )
            {
                phaseDto.Rounds = phaseMatches

                    .Where(x =>
                        x.Round.HasValue &&
                        x.Round.Value > 0)

                    .Select(x =>
                        x.Round!.Value)

                    .Distinct()

                    .OrderBy(x => x)

                    .ToList();
            }


            // =================================================
            // KNOCKOUT
            //
            // Knockout nema grupe.
            // =================================================

            if (phase.Type == PhaseType.Knockout)
            {
                phaseDto.Groups.Add(
                    new PublicResultsGroupDto
                    {
                        Id = null,

                        Name = "Utakmice",

                        Matches = phaseMatches
                            .Select(MapMatch)
                            .ToList()
                    }
                );
            }

            // =================================================
            // SVE OSTALE FAZE
            // =================================================

            else
            {
                var groups = phase.Groups
                    .OrderBy(x => x.Order)
                    .ThenBy(x => x.Id)
                    .ToList();


                // -------------------------------------------------
                // GRUPE
                // -------------------------------------------------

                foreach (var group in groups)
                {
                    var groupMatches = phaseMatches
                        .Where(x =>
                            x.GroupId == group.Id)
                        .ToList();


                    if (groupMatches.Count == 0)
                    {
                        continue;
                    }


                    phaseDto.Groups.Add(
                        new PublicResultsGroupDto
                        {
                            Id = group.Id,

                            Name = group.Name,

                            Matches = groupMatches
                                .Select(MapMatch)
                                .ToList()
                        }
                    );
                }


                // -------------------------------------------------
                // UTAKMICE BEZ GRUPE
                //
                // Korisno za Custom faze ili faze
                // gde utakmica nema GroupId.
                // -------------------------------------------------

                var groupedMatchIds =
                    phaseDto.Groups
                        .SelectMany(x => x.Matches)
                        .Select(x => x.Id)
                        .ToHashSet();


                var matchesWithoutGroup =
                    phaseMatches
                        .Where(x =>
                            !groupedMatchIds.Contains(x.Id))
                        .ToList();


                if (matchesWithoutGroup.Count > 0)
                {
                    phaseDto.Groups.Add(
                        new PublicResultsGroupDto
                        {
                            Id = null,

                            Name = "Utakmice",

                            Matches =
                                matchesWithoutGroup
                                    .Select(MapMatch)
                                    .ToList()
                        }
                    );
                }
            }


            if (phaseDto.Groups.Count > 0)
            {
                response.Phases.Add(phaseDto);
            }
        }


        return response;
    }


    // =========================================================
    // MATCH -> DTO
    // =========================================================

    private static PublicResultMatchDto MapMatch(
        Match match)
    {
        var home = match.Participants
            .FirstOrDefault(x =>
                x.Side == ParticipantSide.Home);


        var away = match.Participants
            .FirstOrDefault(x =>
                x.Side == ParticipantSide.Away);


        return new PublicResultMatchDto
        {
            Id = match.Id,

            MatchDate = match.MatchDate,

            Round = match.Round,

            HomeScore = match.HomeScore,

            AwayScore = match.AwayScore,

            Status = match.Status.ToString(),

            Location = match.Location,

            HomeTeam = MapParticipant(home),

            AwayTeam = MapParticipant(away)
        };
    }


    // =========================================================
    // PARTICIPANT -> TEAM DTO
    // =========================================================

    private static PublicResultTeamDto MapParticipant(
        MatchParticipant? participant)
    {
        if (participant == null)
        {
            return new PublicResultTeamDto
            {
                Name = "Nepoznato",

                IsResolved = false
            };
        }


        // -----------------------------------------------------
        // KONKRETAN TIM
        // -----------------------------------------------------

        if (participant.Team != null)
        {
            return new PublicResultTeamDto
            {
                TeamId = participant.Team.Id,

                Name = participant.Team.Name,

                ShortName =
                    participant.Team.ShortName,

                LogoUrl =
                    participant.Team.LogoUrl,

                IsResolved = true
            };
        }


        // -----------------------------------------------------
        // GROUP POSITION
        // -----------------------------------------------------

        if (
            participant.SourceType ==
                ParticipantSourceType.GroupPosition &&

            participant.SourceGroup != null &&

            participant.SourcePosition.HasValue
        )
        {
            return new PublicResultTeamDto
            {
                Name =
                    $"{participant.SourcePosition}. mesto – " +
                    $"{participant.SourceGroup.Name}",

                IsResolved = false
            };
        }


        // -----------------------------------------------------
        // MATCH WINNER
        // -----------------------------------------------------

        if (
            participant.SourceType ==
                ParticipantSourceType.MatchWinner &&

            participant.SourceMatchId.HasValue
        )
        {
            return new PublicResultTeamDto
            {
                Name =
                    $"Pobednik utakmice #{participant.SourceMatchId}",

                IsResolved = false
            };
        }


        // -----------------------------------------------------
        // MATCH LOSER
        // -----------------------------------------------------

        if (
            participant.SourceType ==
                ParticipantSourceType.MatchLoser &&

            participant.SourceMatchId.HasValue
        )
        {
            return new PublicResultTeamDto
            {
                Name =
                    $"Poraženi iz utakmice #{participant.SourceMatchId}",

                IsResolved = false
            };
        }


        // -----------------------------------------------------
        // TBD
        // -----------------------------------------------------

        return new PublicResultTeamDto
        {
            Name = "TBD",

            IsResolved = false
        };
    }
}