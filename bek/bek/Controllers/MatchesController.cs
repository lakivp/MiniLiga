using bek.Data;
using bek.DTOs;
using bek.Models;
using bek.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;

namespace bek.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class MatchesController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public MatchesController(ApplicationDbContext context)
    {
        _context = context;
    }

    // =========================================================
    // GET: api/Matches
    // =========================================================
    [HttpGet]
    public async Task<ActionResult<IEnumerable<MatchDto>>> GetMatches()
    {
        var matches = await _context.Matches
            .Include(x => x.Phase)
            .Include(x => x.Group)
            .Include(x => x.Participants)
                .ThenInclude(x => x.Team)
            .Include(x => x.Participants)
                .ThenInclude(x => x.SourceGroup)
            .OrderBy(x => x.MatchDate)
            .ToListAsync();

        return Ok(matches.Select(MapToDto));
    }

    // =========================================================
    // GET: api/Matches/5
    // =========================================================
    [HttpGet("{id}")]
    public async Task<ActionResult<MatchDto>> GetMatch(int id)
    {
        var match = await _context.Matches
            .Include(x => x.Phase)
            .Include(x => x.Group)
            .Include(x => x.Participants)
                .ThenInclude(x => x.Team)
            .Include(x => x.Participants)
                .ThenInclude(x => x.SourceGroup)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (match == null)
        {
            return NotFound(new
            {
                message = "Utakmica nije pronađena."
            });
        }

        return Ok(MapToDto(match));
    }

    // =========================================================
    // GET: api/Matches/phase/1
    // =========================================================
    [HttpGet("phase/{phaseId}")]
    public async Task<ActionResult<IEnumerable<MatchDto>>> GetMatchesByPhase(
        int phaseId)
    {
        var matches = await _context.Matches
            .Include(x => x.Phase)
            .Include(x => x.Group)
            .Include(x => x.Participants)
                .ThenInclude(x => x.Team)
            .Include(x => x.Participants)
                .ThenInclude(x => x.SourceGroup)
            .Where(x => x.PhaseId == phaseId)
            .OrderBy(x => x.MatchDate)
            .ToListAsync();

        return Ok(matches.Select(MapToDto));
    }

    // =========================================================
    // GET: api/Matches/group/1
    // =========================================================
    [HttpGet("group/{groupId}")]
    public async Task<ActionResult<IEnumerable<MatchDto>>> GetMatchesByGroup(
        int groupId)
    {
        var matches = await _context.Matches
            .Include(x => x.Phase)
            .Include(x => x.Group)
            .Include(x => x.Participants)
                .ThenInclude(x => x.Team)
            .Include(x => x.Participants)
                .ThenInclude(x => x.SourceGroup)
            .Where(x => x.GroupId == groupId)
            .OrderBy(x => x.MatchDate)
            .ToListAsync();

        return Ok(matches.Select(MapToDto));
    }

    // =========================================================
    // POST: api/Matches
    // =========================================================
    [HttpPost]
    public async Task<ActionResult<MatchDto>> CreateMatch(
        CreateMatchDto dto)
    {
        // -----------------------------------------------------
        // Provera faze
        // -----------------------------------------------------

        var phase = await _context.CompetitionPhases
            .FirstOrDefaultAsync(x => x.Id == dto.PhaseId);

        if (phase == null)
        {
            return BadRequest(new
            {
                message = "Faza takmičenja ne postoji."
            });
        }

        // -----------------------------------------------------
        // Provera grupe i tipa faze
        // -----------------------------------------------------

        CompetitionGroup? group = null;

        if (dto.GroupId.HasValue)
        {
            group = await _context.CompetitionGroups
                .FirstOrDefaultAsync(x => x.Id == dto.GroupId.Value);

            if (group == null)
            {
                return BadRequest(new
                {
                    message = "Grupa ne postoji."
                });
            }

            // Grupa mora pripadati izabranoj fazi
            if (group.PhaseId != dto.PhaseId)
            {
                return BadRequest(new
                {
                    message = "Grupa ne pripada izabranoj fazi."
                });
            }

            // Knockout faza ne može imati grupu
            if (phase.Type == PhaseType.Knockout)
            {
                return BadRequest(new
                {
                    message =
                        "Knockout faza ne može imati grupu."
                });
            }
        }
        else
        {
            // Liga / Playoff / Groups faze zahtevaju grupu
            if (phase.Type == PhaseType.League ||
                phase.Type == PhaseType.Playoff ||
                phase.Type == PhaseType.Groups)
            {
                return BadRequest(new
                {
                    message =
                        "Za ovu fazu utakmica mora pripadati grupi."
                });
            }
        }

        // -----------------------------------------------------
        // Provera Home i Away participant-a
        // -----------------------------------------------------

        var homeValidation = await ValidateParticipant(
            dto.Home,
            "Home");

        if (homeValidation != null)
        {
            return BadRequest(homeValidation);
        }

        var awayValidation = await ValidateParticipant(
            dto.Away,
            "Away");

        if (awayValidation != null)
        {
            return BadRequest(awayValidation);
        }

        // -----------------------------------------------------
        // Home i Away moraju biti različite strane
        // -----------------------------------------------------

        if (dto.Home.Side == dto.Away.Side)
        {
            return BadRequest(new
            {
                message =
                    "Jedan učesnik mora biti Home, a drugi Away."
            });
        }

        // -----------------------------------------------------
        // Home i Away tim moraju biti različiti
        // -----------------------------------------------------

        if (dto.Home.TeamId.HasValue &&
            dto.Away.TeamId.HasValue &&
            dto.Home.TeamId.Value == dto.Away.TeamId.Value)
        {
            return BadRequest(new
            {
                message =
                    "Home i Away tim ne mogu biti isti."
            });
        }

        // -----------------------------------------------------
        // Ako je FixedTeam, proveravamo da tim postoji
        // -----------------------------------------------------

        if (dto.Home.SourceType ==
            ParticipantSourceTypeDto.FixedTeam)
        {
            var exists = await _context.Teams
                .AnyAsync(x => x.Id == dto.Home.TeamId);

            if (!exists)
            {
                return BadRequest(new
                {
                    message = "Home tim ne postoji."
                });
            }
        }

        if (dto.Away.SourceType ==
            ParticipantSourceTypeDto.FixedTeam)
        {
            var exists = await _context.Teams
                .AnyAsync(x => x.Id == dto.Away.TeamId);

            if (!exists)
            {
                return BadRequest(new
                {
                    message = "Away tim ne postoji."
                });
            }
        }

        // -----------------------------------------------------
        // Provera da Home/Away timovi pripadaju grupi
        // -----------------------------------------------------

        if (group != null)
        {
            // Utakmica u grupi mora imati konkretne timove
            if (dto.Home.SourceType !=
                ParticipantSourceTypeDto.FixedTeam)
            {
                return BadRequest(new
                {
                    message =
                        "Utakmica u grupi mora imati konkretan Home tim."
                });
            }

            if (dto.Away.SourceType !=
                ParticipantSourceTypeDto.FixedTeam)
            {
                return BadRequest(new
                {
                    message =
                        "Utakmica u grupi mora imati konkretan Away tim."
                });
            }

            // Provera Home tima
            var homeTeamInGroup =
                await _context.GroupTeams.AnyAsync(x =>
                    x.GroupId == group.Id &&
                    x.TeamId == dto.Home.TeamId!.Value);

            if (!homeTeamInGroup)
            {
                return BadRequest(new
                {
                    message =
                        "Home tim ne pripada izabranoj grupi."
                });
            }

            // Provera Away tima
            var awayTeamInGroup =
                await _context.GroupTeams.AnyAsync(x =>
                    x.GroupId == group.Id &&
                    x.TeamId == dto.Away.TeamId!.Value);

            if (!awayTeamInGroup)
            {
                return BadRequest(new
                {
                    message =
                        "Away tim ne pripada izabranoj grupi."
                });
            }
        }

        // -----------------------------------------------------
        // Knockout utakmice koriste konkretne timove
        // -----------------------------------------------------

        if (phase.Type == PhaseType.Knockout)
        {
            // Knockout ne sme imati grupu
            if (dto.GroupId.HasValue)
            {
                return BadRequest(new
                {
                    message =
                        "Knockout utakmica ne može pripadati grupi."
                });
            }

            // Home mora biti konkretan tim
            if (dto.Home.SourceType !=
                ParticipantSourceTypeDto.FixedTeam)
            {
                return BadRequest(new
                {
                    message =
                        "Knockout utakmica mora imati konkretan Home tim."
                });
            }

            // Away mora biti konkretan tim
            if (dto.Away.SourceType !=
                ParticipantSourceTypeDto.FixedTeam)
            {
                return BadRequest(new
                {
                    message =
                        "Knockout utakmica mora imati konkretan Away tim."
                });
            }
        }

        // -----------------------------------------------------
        // Kreiranje utakmice
        // -----------------------------------------------------

        var match = new Match
        {
            PhaseId = dto.PhaseId,

            GroupId = dto.GroupId,

            MatchDate = dto.MatchDate,

            Round = dto.Round,

            Location = dto.Location,

            HomeScore = 0,

            AwayScore = 0,

            Status = MatchStatus.Scheduled,

            IsLive = false
        };

        _context.Matches.Add(match);

        // -----------------------------------------------------
        // Kreiranje Home participant-a
        // -----------------------------------------------------

        var homeParticipant = new MatchParticipant
        {
            Match = match,

            Side = ParticipantSide.Home,

            TeamId = dto.Home.TeamId,

            SourceType =
                ConvertSourceType(dto.Home.SourceType),

            SourceMatchId =
                dto.Home.SourceMatchId,

            SourceGroupId =
                dto.Home.SourceGroupId,

            SourcePosition =
                dto.Home.SourcePosition
        };

        // -----------------------------------------------------
        // Kreiranje Away participant-a
        // -----------------------------------------------------

        var awayParticipant = new MatchParticipant
        {
            Match = match,

            Side = ParticipantSide.Away,

            TeamId = dto.Away.TeamId,

            SourceType =
                ConvertSourceType(dto.Away.SourceType),

            SourceMatchId =
                dto.Away.SourceMatchId,

            SourceGroupId =
                dto.Away.SourceGroupId,

            SourcePosition =
                dto.Away.SourcePosition
        };

        _context.MatchParticipants.Add(homeParticipant);

        _context.MatchParticipants.Add(awayParticipant);

        await _context.SaveChangesAsync();

        // -----------------------------------------------------
        // Ponovo učitavamo podatke za DTO
        // -----------------------------------------------------

        var createdMatch = await _context.Matches
            .Include(x => x.Phase)
            .Include(x => x.Group)
            .Include(x => x.Participants)
                .ThenInclude(x => x.Team)
            .Include(x => x.Participants)
                .ThenInclude(x => x.SourceGroup)
            .FirstAsync(x => x.Id == match.Id);

        return CreatedAtAction(
            nameof(GetMatch),
            new
            {
                id = match.Id
            },
            MapToDto(createdMatch)
        );
    }

    // =========================================================
    // PUT: api/Matches/5
    // =========================================================
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateMatch(
        int id,
        UpdateMatchDto dto)
    {
        var match = await _context.Matches
            .FirstOrDefaultAsync(x => x.Id == id);

        if (match == null)
        {
            return NotFound(new
            {
                message = "Utakmica nije pronađena."
            });
        }

        match.MatchDate = dto.MatchDate;

        match.Round = dto.Round;

        match.Location = dto.Location;

        match.Status = ConvertStatus(dto.Status);

        match.HomeScore = dto.HomeScore;

        match.AwayScore = dto.AwayScore;

        match.IsLive = dto.IsLive;

        match.StartedAt = dto.StartedAt;

        match.FinishedAt = dto.FinishedAt;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    // =========================================================
    // DELETE: api/Matches/5
    // =========================================================
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteMatch(int id)
    {
        var match = await _context.Matches
            .FirstOrDefaultAsync(x => x.Id == id);

        if (match == null)
        {
            return NotFound(new
            {
                message = "Utakmica nije pronađena."
            });
        }

        _context.Matches.Remove(match);

        await _context.SaveChangesAsync();

        return NoContent();
    }

    // =========================================================
    // VALIDACIJA PARTICIPANTA
    // =========================================================

    private async Task<object?> ValidateParticipant(
        CreateMatchParticipantDto participant,
        string sideName)
    {
        // -----------------------------------------------------
        // Provera strane
        // -----------------------------------------------------

        if (participant.Side != ParticipantSideDto.Home &&
            participant.Side != ParticipantSideDto.Away)
        {
            return new
            {
                message =
                    $"{sideName}: neispravna strana utakmice."
            };
        }

        // -----------------------------------------------------
        // Provera SourceType-a
        // -----------------------------------------------------

        switch (participant.SourceType)
        {
            // -------------------------------------------------
            // FixedTeam
            // -------------------------------------------------

            case ParticipantSourceTypeDto.FixedTeam:

                if (!participant.TeamId.HasValue)
                {
                    return new
                    {
                        message =
                            $"{sideName}: TeamId je obavezan za FixedTeam."
                    };
                }

                break;

            // -------------------------------------------------
            // GroupPosition
            // -------------------------------------------------

            case ParticipantSourceTypeDto.GroupPosition:

                if (!participant.SourceGroupId.HasValue)
                {
                    return new
                    {
                        message =
                            $"{sideName}: SourceGroupId je obavezan."
                    };
                }

                if (!participant.SourcePosition.HasValue)
                {
                    return new
                    {
                        message =
                            $"{sideName}: SourcePosition je obavezan."
                    };
                }

                if (participant.SourcePosition <= 0)
                {
                    return new
                    {
                        message =
                            $"{sideName}: SourcePosition mora biti veći od 0."
                    };
                }

                var groupExists =
                    await _context.CompetitionGroups
                        .AnyAsync(x =>
                            x.Id ==
                            participant.SourceGroupId.Value);

                if (!groupExists)
                {
                    return new
                    {
                        message =
                            $"{sideName}: izabrana grupa ne postoji."
                    };
                }

                break;

            // -------------------------------------------------
            // MatchWinner / MatchLoser
            // -------------------------------------------------

            case ParticipantSourceTypeDto.MatchWinner:
            case ParticipantSourceTypeDto.MatchLoser:

                if (!participant.SourceMatchId.HasValue)
                {
                    return new
                    {
                        message =
                            $"{sideName}: SourceMatchId je obavezan."
                    };
                }

                var matchExists =
                    await _context.Matches
                        .AnyAsync(x =>
                            x.Id ==
                            participant.SourceMatchId.Value);

                if (!matchExists)
                {
                    return new
                    {
                        message =
                            $"{sideName}: izvorna utakmica ne postoji."
                    };
                }

                break;

            // -------------------------------------------------
            // Nepoznat SourceType
            // -------------------------------------------------

            default:

                return new
                {
                    message =
                        $"{sideName}: nepoznat SourceType."
                };
        }

        return null;
    }

    // =========================================================
    // MAPIRANJE MATCH -> DTO
    // =========================================================

    private MatchDto MapToDto(Match match)
    {
        return new MatchDto
        {
            Id = match.Id,

            PhaseId = match.PhaseId,

            PhaseName =
                match.Phase?.Name ?? string.Empty,

            GroupId = match.GroupId,

            GroupName =
                match.Group?.Name,

            MatchDate = match.MatchDate,

            Round = match.Round,

            HomeScore = match.HomeScore,

            AwayScore = match.AwayScore,

            Status =
                ConvertStatus(match.Status),

            Location = match.Location,

            IsLive = match.IsLive,

            StartedAt = match.StartedAt,

            FinishedAt = match.FinishedAt,

            Participants = match.Participants
            .OrderBy(x => x.Side)
            .Select(x => new MatchParticipantDto
            {
                Id = x.Id,

                MatchId = x.MatchId,

                Side = ConvertSide(x.Side),

                TeamId = x.TeamId,

                TeamName = x.Team?.Name,

                TeamLogoUrl =
                    ImageStorageService.ToPublicUrl(
                        Request,
                        x.Team?.LogoUrl
                    ),

                SourceType =
                    ConvertSourceType(x.SourceType),

                SourceMatchId =
                    x.SourceMatchId,

                SourceGroupId =
                    x.SourceGroupId,

                SourceGroupName =
                    x.SourceGroup?.Name,

                SourcePosition =
                    x.SourcePosition
            })
            .ToList()
        };
    }

    // =========================================================
    // ENUM CONVERZIJE
    // =========================================================

    private static MatchStatus ConvertStatus(
        MatchStatusDto status)
    {
        return status switch
        {
            MatchStatusDto.Scheduled =>
                MatchStatus.Scheduled,

            MatchStatusDto.Live =>
                MatchStatus.Live,

            MatchStatusDto.Finished =>
                MatchStatus.Finished,

            MatchStatusDto.Postponed =>
                MatchStatus.Postponed,

            MatchStatusDto.Cancelled =>
                MatchStatus.Cancelled,

            _ => MatchStatus.Scheduled
        };
    }

    private static MatchStatusDto ConvertStatus(
        MatchStatus status)
    {
        return status switch
        {
            MatchStatus.Scheduled =>
                MatchStatusDto.Scheduled,

            MatchStatus.Live =>
                MatchStatusDto.Live,

            MatchStatus.Finished =>
                MatchStatusDto.Finished,

            MatchStatus.Postponed =>
                MatchStatusDto.Postponed,

            MatchStatus.Cancelled =>
                MatchStatusDto.Cancelled,

            _ => MatchStatusDto.Scheduled
        };
    }

    private static ParticipantSideDto ConvertSide(
        ParticipantSide side)
    {
        return side switch
        {
            ParticipantSide.Home =>
                ParticipantSideDto.Home,

            ParticipantSide.Away =>
                ParticipantSideDto.Away,

            _ => ParticipantSideDto.Home
        };
    }

    private static ParticipantSourceType ConvertSourceType(
        ParticipantSourceTypeDto sourceType)
    {
        return sourceType switch
        {
            ParticipantSourceTypeDto.FixedTeam =>
                ParticipantSourceType.FixedTeam,

            ParticipantSourceTypeDto.GroupPosition =>
                ParticipantSourceType.GroupPosition,

            ParticipantSourceTypeDto.MatchWinner =>
                ParticipantSourceType.MatchWinner,

            ParticipantSourceTypeDto.MatchLoser =>
                ParticipantSourceType.MatchLoser,

            _ => ParticipantSourceType.FixedTeam
        };
    }

    private static ParticipantSourceTypeDto ConvertSourceType(
        ParticipantSourceType sourceType)
    {
        return sourceType switch
        {
            ParticipantSourceType.FixedTeam =>
                ParticipantSourceTypeDto.FixedTeam,

            ParticipantSourceType.GroupPosition =>
                ParticipantSourceTypeDto.GroupPosition,

            ParticipantSourceType.MatchWinner =>
                ParticipantSourceTypeDto.MatchWinner,

            ParticipantSourceType.MatchLoser =>
                ParticipantSourceTypeDto.MatchLoser,

            _ => ParticipantSourceTypeDto.FixedTeam
        };
    }
}