using bek.Data;
using bek.DTOs;
using bek.Models;
using Microsoft.EntityFrameworkCore;

namespace bek.Services;

public class MatchLineupService
{
    private readonly ApplicationDbContext _context;

    public MatchLineupService(ApplicationDbContext context)
    {
        _context = context;
    }

    // ============================================================
    // SASTAV UTAKMICE
    // ============================================================

    public async Task<List<MatchLineupDto>> GetMatchLineupAsync(
        int matchId)
    {
        var matchExists = await _context.Matches
            .AnyAsync(x => x.Id == matchId);

        if (!matchExists)
        {
            throw new InvalidOperationException(
                "Utakmica ne postoji."
            );
        }

        var lineup = await _context.MatchLineups
            .Include(x => x.Player)
            .Include(x => x.Team)
            .Where(x => x.MatchId == matchId)
            .OrderBy(x => x.TeamId)
            .ThenBy(x => x.IsSubstitute)
            .ThenBy(x => x.Order)
            .ToListAsync();

        return lineup
            .Select(MapToDto)
            .ToList();
    }

    public async Task<List<MatchLineupDto>> PopulateCurrentRosterAsync(
        int matchId)
    {
        var match = await _context.Matches
            .Include(x => x.Participants)
            .FirstOrDefaultAsync(x => x.Id == matchId);

        if (match == null)
        {
            throw new InvalidOperationException(
                "Utakmica ne postoji.");
        }

        if (match.Status is MatchStatus.Finished or MatchStatus.Cancelled)
        {
            return await GetMatchLineupAsync(matchId);
        }

        var teamIds = match.Participants
            .Where(x => x.TeamId.HasValue)
            .Select(x => x.TeamId!.Value)
            .Distinct()
            .ToArray();

        var existingLineups = await _context.MatchLineups
            .Where(x => x.MatchId == matchId)
            .ToListAsync();

        var existingPlayerIds = existingLineups
            .Select(x => x.PlayerId)
            .ToHashSet();

        var players = await _context.Players
            .Where(x => teamIds.Contains(x.TeamId) && x.IsActive)
            .OrderBy(x => x.TeamId)
            .ThenBy(x => x.JerseyNumber ?? int.MaxValue)
            .ThenBy(x => x.Id)
            .ToListAsync();

        var addedPlayers = false;

        foreach (var teamId in teamIds)
        {
            var nextOrder = existingLineups
                .Where(x => x.TeamId == teamId)
                .Select(x => x.Order)
                .DefaultIfEmpty(0)
                .Max() + 1;
            var starterCount = existingLineups
                .Count(x => x.TeamId == teamId && x.IsStarter);

            foreach (var player in players.Where(x => x.TeamId == teamId))
            {
                if (!existingPlayerIds.Add(player.Id))
                {
                    continue;
                }

                var isStarter = starterCount < 5;
                if (isStarter)
                {
                    starterCount++;
                }

                _context.MatchLineups.Add(new MatchLineup
                {
                    MatchId = matchId,
                    PlayerId = player.Id,
                    TeamId = teamId,
                    IsStarter = isStarter,
                    IsSubstitute = !isStarter,
                    Position = player.Position,
                    Order = nextOrder++
                });

                addedPlayers = true;
            }
        }

        if (addedPlayers)
        {
            await _context.SaveChangesAsync();
        }

        return await GetMatchLineupAsync(matchId);
    }


    // ============================================================
    // JEDAN IGRAČ U SASTAVU
    // ============================================================

    public async Task<MatchLineupDto?> GetByIdAsync(
        int id)
    {
        var lineup = await _context.MatchLineups
            .Include(x => x.Player)
            .Include(x => x.Team)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (lineup == null)
            return null;

        return MapToDto(lineup);
    }


    // ============================================================
    // DODAVANJE IGRAČA U SASTAV
    // ============================================================

    public async Task<MatchLineupDto> AddPlayerAsync(
        int matchId,
        CreateMatchLineupDto dto)
    {
        var match = await _context.Matches
            .Include(x => x.Participants)
            .FirstOrDefaultAsync(x => x.Id == matchId);

        if (match == null)
        {
            throw new InvalidOperationException(
                "Utakmica ne postoji."
            );
        }

        var player = await _context.Players
            .Include(x => x.Team)
            .FirstOrDefaultAsync(x => x.Id == dto.PlayerId);

        if (player == null)
        {
            throw new InvalidOperationException(
                "Igrač ne postoji."
            );
        }

        var team = await _context.Teams
            .FirstOrDefaultAsync(x => x.Id == dto.TeamId);

        if (team == null)
        {
            throw new InvalidOperationException(
                "Tim ne postoji."
            );
        }

        // Igrač mora pripadati timu
        if (player.TeamId != dto.TeamId)
        {
            throw new InvalidOperationException(
                "Igrač ne pripada izabranom timu."
            );
        }

        // Tim mora biti učesnik utakmice
        var teamParticipates = match.Participants
            .Any(x =>
                x.TeamId.HasValue &&
                x.TeamId.Value == dto.TeamId);

        if (!teamParticipates)
        {
            throw new InvalidOperationException(
                "Izabrani tim ne učestvuje u ovoj utakmici."
            );
        }

        // Igrač ne sme već biti u sastavu
        var alreadyExists = await _context.MatchLineups
            .AnyAsync(x =>
                x.MatchId == matchId &&
                x.PlayerId == dto.PlayerId);

        if (alreadyExists)
        {
            throw new InvalidOperationException(
                "Igrač je već dodat u sastav ove utakmice."
            );
        }

        // Mora biti starter ili substitute.
        if (!dto.IsStarter && !dto.IsSubstitute)
        {
            throw new InvalidOperationException(
                "Igrač mora biti označen kao starter ili zamena."
            );
        }

        // Ne može istovremeno biti starter i substitute.
        if (dto.IsStarter && dto.IsSubstitute)
        {
            throw new InvalidOperationException(
                "Igrač ne može istovremeno biti starter i zamena."
            );
        }

        if (dto.Order < 0)
        {
            throw new InvalidOperationException(
                "Order ne može biti negativan."
            );
        }

        if (dto.EnteredMinute.HasValue &&
            dto.EnteredMinute.Value < 0)
        {
            throw new InvalidOperationException(
                "EnteredMinute ne može biti negativan."
            );
        }

        if (dto.LeftMinute.HasValue &&
            dto.LeftMinute.Value < 0)
        {
            throw new InvalidOperationException(
                "LeftMinute ne može biti negativan."
            );
        }

        var lineup = new MatchLineup
        {
            MatchId = matchId,
            PlayerId = dto.PlayerId,
            TeamId = dto.TeamId,
            IsStarter = dto.IsStarter,
            IsSubstitute = dto.IsSubstitute,
            Position = dto.Position,
            Order = dto.Order,
            EnteredMinute = dto.EnteredMinute,
            LeftMinute = dto.LeftMinute,
            Notes = dto.Notes
        };

        _context.MatchLineups.Add(lineup);

        await _context.SaveChangesAsync();

        await _context.Entry(lineup)
            .Reference(x => x.Player)
            .LoadAsync();

        await _context.Entry(lineup)
            .Reference(x => x.Team)
            .LoadAsync();

        return MapToDto(lineup);
    }


    // ============================================================
    // IZMENA IGRAČA U SASTAVU
    // ============================================================

    public async Task<MatchLineupDto?> UpdatePlayerAsync(
        int id,
        UpdateMatchLineupDto dto)
    {
        var lineup = await _context.MatchLineups
            .Include(x => x.Player)
            .Include(x => x.Team)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (lineup == null)
            return null;

        if (!dto.IsStarter && !dto.IsSubstitute)
        {
            throw new InvalidOperationException(
                "Igrač mora biti starter ili zamena."
            );
        }

        if (dto.IsStarter && dto.IsSubstitute)
        {
            throw new InvalidOperationException(
                "Igrač ne može istovremeno biti starter i zamena."
            );
        }

        if (dto.Order < 0)
        {
            throw new InvalidOperationException(
                "Order ne može biti negativan."
            );
        }

        if (dto.EnteredMinute.HasValue &&
            dto.EnteredMinute.Value < 0)
        {
            throw new InvalidOperationException(
                "EnteredMinute ne može biti negativan."
            );
        }

        if (dto.LeftMinute.HasValue &&
            dto.LeftMinute.Value < 0)
        {
            throw new InvalidOperationException(
                "LeftMinute ne može biti negativan."
            );
        }

        lineup.IsStarter = dto.IsStarter;
        lineup.IsSubstitute = dto.IsSubstitute;
        lineup.Position = dto.Position;
        lineup.Order = dto.Order;
        lineup.EnteredMinute = dto.EnteredMinute;
        lineup.LeftMinute = dto.LeftMinute;
        lineup.Notes = dto.Notes;

        await _context.SaveChangesAsync();

        return MapToDto(lineup);
    }


    // ============================================================
    // BRISANJE IZ SASTAVA
    // ============================================================

    public async Task<bool> RemovePlayerAsync(int id)
    {
        var lineup = await _context.MatchLineups
            .FirstOrDefaultAsync(x => x.Id == id);

        if (lineup == null)
            return false;

        _context.MatchLineups.Remove(lineup);

        await _context.SaveChangesAsync();

        return true;
    }


    // ============================================================
    // MAPIRANJE
    // ============================================================

    private static MatchLineupDto MapToDto(
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
}