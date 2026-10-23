using bek.Data;
using bek.Models;
using Microsoft.EntityFrameworkCore;
using bek.Hubs;
using Microsoft.AspNetCore.SignalR;

namespace bek.Services;

public class MatchService
{
    private readonly ApplicationDbContext _context;
    private readonly IHubContext<LiveMatchHub> _hubContext;

    public MatchService(ApplicationDbContext context, IHubContext<LiveMatchHub> hubContext)
    {
        _context = context;
        _hubContext = hubContext;
    }

    // ============================================================
    // START UTAKMICE
    // ============================================================

    public async Task<Match?> StartMatchAsync(int matchId)
    {
        var match = await _context.Matches
            .Include(x => x.Participants)
            .FirstOrDefaultAsync(x => x.Id == matchId);

        if (match == null)
            return null;

        if (match.Status == MatchStatus.Finished)
            throw new InvalidOperationException(
                "Završena utakmica ne može ponovo da se pokrene."
            );

        if (match.Status == MatchStatus.Cancelled)
            throw new InvalidOperationException(
                "Otkazana utakmica ne može da se pokrene."
            );

        if (match.Status == MatchStatus.Live)
            throw new InvalidOperationException(
                "Utakmica je već Live."
            );

        if (match.Participants.Count != 2)
            throw new InvalidOperationException(
                "Utakmica mora imati tačno dva učesnika."
            );

        match.Status = MatchStatus.Live;
        match.IsLive = true;
        match.StartedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        await BroadcastMatchStartedAsync(matchId);
        await BroadcastMatchUpdateAsync(matchId);

        return match;
    }


    // ============================================================
    // ZAVRŠAVANJE UTAKMICE
    // ============================================================

    public async Task<Match?> FinishMatchAsync(int matchId)
    {
        var match = await _context.Matches
            .FirstOrDefaultAsync(x => x.Id == matchId);

        if (match == null)
            return null;

        if (match.Status == MatchStatus.Finished)
            throw new InvalidOperationException(
                "Utakmica je već završena."
            );

        if (match.Status != MatchStatus.Live)
            throw new InvalidOperationException(
                "Samo utakmica koja je trenutno Live može biti završena."
            );

        match.Status = MatchStatus.Finished;
        match.IsLive = false;
        match.FinishedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        await BroadcastMatchFinishedAsync(
            matchId,
            match.HomeScore,
            match.AwayScore
        );
        await BroadcastMatchUpdateAsync(matchId);

        return match;
    }


    // ============================================================
    // DODAVANJE DOGAĐAJA
    // ============================================================

    public async Task<MatchEvent> AddEventAsync(
        int matchId,
        int? playerId,
        int? relatedPlayerId,
        MatchEventType type,
        int minute,
        string? description)
    {
        if (!Enum.IsDefined(typeof(MatchEventType), type))
        {
            throw new InvalidOperationException(
                "Nepoznata vrsta događaja."
            );
        }

        var match = await _context.Matches
            .Include(x => x.Participants)
            .FirstOrDefaultAsync(x => x.Id == matchId);

        if (match == null)
        {
            throw new InvalidOperationException(
                "Utakmica ne postoji."
            );
        }

        if (match.Status != MatchStatus.Live)
        {
            throw new InvalidOperationException(
                "Događaj se može dodati samo tokom Live utakmice."
            );
        }

        if (minute < 0)
        {
            throw new InvalidOperationException(
                "Minut ne može biti negativan."
            );
        }

        ValidateEventTypePlayers(
            type,
            playerId,
            relatedPlayerId
        );

        var player = await ValidatePlayerAsync(
            match,
            playerId
        );

        var relatedPlayer = await ValidatePlayerAsync(
            match,
            relatedPlayerId
        );

        // Kod izmene oba igrača moraju biti iz istog tima.
        if (type == MatchEventType.Substitution)
        {
            if (player == null || relatedPlayer == null)
            {
                throw new InvalidOperationException(
                    "Izmena mora imati igrača koji izlazi i igrača koji ulazi."
                );
            }

            if (player.TeamId != relatedPlayer.TeamId)
            {
                throw new InvalidOperationException(
                    "Igrači u izmeni moraju pripadati istom timu."
                );
            }

            await ApplySubstitutionAsync(
                matchId,
                player,
                relatedPlayer,
                minute
            );
        }

        var matchEvent = new MatchEvent
        {
            MatchId = matchId,
            PlayerId = playerId,
            RelatedPlayerId = relatedPlayerId,
            Type = type,
            Minute = minute,
            Description = description,
            CreatedAt = DateTime.UtcNow
        };

        _context.MatchEvents.Add(matchEvent);

        // --------------------------------------------------------
        // GOL
        // --------------------------------------------------------

        if (type == MatchEventType.Goal)
        {
            if (player == null)
            {
                throw new InvalidOperationException(
                    "Gol mora biti povezan sa igračem."
                );
            }

            IncreaseScore(match, player);
        }

        await _context.SaveChangesAsync();
        await BroadcastMatchUpdateAsync(matchId);

        return matchEvent;
    }


    // ============================================================
    // IZMENA DOGAĐAJA
    // ============================================================

    public async Task<MatchEvent?> UpdateEventAsync(
        int eventId,
        int? playerId,
        int? relatedPlayerId,
        MatchEventType type,
        int minute,
        string? description)
    {
        if (!Enum.IsDefined(typeof(MatchEventType), type))
        {
            throw new InvalidOperationException(
                "Nepoznata vrsta događaja."
            );
        }

        var matchEvent = await _context.MatchEvents
            .FirstOrDefaultAsync(x => x.Id == eventId);

        if (matchEvent == null)
            return null;

        var match = await _context.Matches
            .Include(x => x.Participants)
            .FirstOrDefaultAsync(x => x.Id == matchEvent.MatchId);

        if (match == null)
        {
            throw new InvalidOperationException(
                "Utakmica ne postoji."
            );
        }

        if (match.Status != MatchStatus.Live)
        {
            throw new InvalidOperationException(
                "Događaj se može menjati samo tokom Live utakmice."
            );
        }

        if (minute < 0)
        {
            throw new InvalidOperationException(
                "Minut ne može biti negativan."
            );
        }

        ValidateEventTypePlayers(
            type,
            playerId,
            relatedPlayerId
        );

        var oldPlayer = await GetPlayerAsync(
            matchEvent.PlayerId
        );

        var oldRelatedPlayer = await GetPlayerAsync(
            matchEvent.RelatedPlayerId
        );

        var newPlayer = await ValidatePlayerAsync(
            match,
            playerId
        );

        var newRelatedPlayer = await ValidatePlayerAsync(
            match,
            relatedPlayerId
        );

        // --------------------------------------------------------
        // PONIŠTAVANJE STAROG GOLA
        // --------------------------------------------------------

        if (matchEvent.Type == MatchEventType.Goal)
        {
            if (oldPlayer != null)
            {
                DecreaseScore(match, oldPlayer);
            }
        }

        // --------------------------------------------------------
        // PONIŠTAVANJE STARE IZMENE
        // --------------------------------------------------------

        if (matchEvent.Type == MatchEventType.Substitution)
        {
            if (oldPlayer != null &&
                oldRelatedPlayer != null)
            {
                await RevertSubstitutionAsync(
                    matchEvent.MatchId,
                    oldPlayer,
                    oldRelatedPlayer,
                    matchEvent.Minute
                );
            }
        }

        // --------------------------------------------------------
        // NOVI GOL
        // --------------------------------------------------------

        if (type == MatchEventType.Goal)
        {
            if (newPlayer == null)
            {
                throw new InvalidOperationException(
                    "Gol mora biti povezan sa igračem."
                );
            }

            IncreaseScore(match, newPlayer);
        }

        // --------------------------------------------------------
        // NOVA IZMENA
        // --------------------------------------------------------

        if (type == MatchEventType.Substitution)
        {
            if (newPlayer == null ||
                newRelatedPlayer == null)
            {
                throw new InvalidOperationException(
                    "Izmena mora imati oba igrača."
                );
            }

            if (newPlayer.TeamId != newRelatedPlayer.TeamId)
            {
                throw new InvalidOperationException(
                    "Igrači u izmeni moraju pripadati istom timu."
                );
            }

            await ApplySubstitutionAsync(
                matchEvent.MatchId,
                newPlayer,
                newRelatedPlayer,
                minute
            );
        }

        matchEvent.PlayerId = playerId;
        matchEvent.RelatedPlayerId = relatedPlayerId;
        matchEvent.Type = type;
        matchEvent.Minute = minute;
        matchEvent.Description = description;

        await _context.SaveChangesAsync();

        await BroadcastMatchUpdateAsync(matchEvent.MatchId);

        return matchEvent;
    }


    // ============================================================
    // BRISANJE DOGAĐAJA
    // ============================================================

    public async Task<bool> DeleteEventAsync(int eventId)
    {
        var matchEvent = await _context.MatchEvents
            .FirstOrDefaultAsync(x => x.Id == eventId);

        if (matchEvent == null)
            return false;

        var match = await _context.Matches
            .Include(x => x.Participants)
            .FirstOrDefaultAsync(x => x.Id == matchEvent.MatchId);

        if (match == null)
            return false;

        if (match.Status != MatchStatus.Live)
        {
            throw new InvalidOperationException(
                "Događaj se može obrisati samo tokom Live utakmice."
            );
        }

        // --------------------------------------------------------
        // PONIŠTI GOL
        // --------------------------------------------------------

        if (matchEvent.Type == MatchEventType.Goal)
        {
            var player = await GetPlayerAsync(
                matchEvent.PlayerId
            );

            if (player != null)
            {
                DecreaseScore(match, player);
            }
        }

        // --------------------------------------------------------
        // PONIŠTI IZMENU
        // --------------------------------------------------------

        if (matchEvent.Type == MatchEventType.Substitution)
        {
            var playerOut = await GetPlayerAsync(
                matchEvent.PlayerId
            );

            var playerIn = await GetPlayerAsync(
                matchEvent.RelatedPlayerId
            );

            if (playerOut != null &&
                playerIn != null)
            {
                await RevertSubstitutionAsync(
                    matchEvent.MatchId,
                    playerOut,
                    playerIn,
                    matchEvent.Minute
                );
            }
        }

        _context.MatchEvents.Remove(matchEvent);

        await _context.SaveChangesAsync();

        await BroadcastMatchUpdateAsync(matchEvent.MatchId);

        return true;
    }


    // ============================================================
    // VALIDACIJA IGRAČA
    // ============================================================

    private async Task<Player?> ValidatePlayerAsync(
        Match match,
        int? playerId)
    {
        if (!playerId.HasValue)
            return null;

        var player = await GetPlayerAsync(playerId);

        if (player == null)
        {
            throw new InvalidOperationException(
                "Igrač ne postoji."
            );
        }

        var belongsToMatch = match.Participants
            .Any(x =>
                x.TeamId.HasValue &&
                x.TeamId.Value == player.TeamId
            );

        if (!belongsToMatch)
        {
            throw new InvalidOperationException(
                "Igrač ne pripada timu koji igra ovu utakmicu."
            );
        }

        return player;
    }


    // ============================================================
    // VALIDACIJA DOGAĐAJA
    // ============================================================

    private static void ValidateEventTypePlayers(
        MatchEventType type,
        int? playerId,
        int? relatedPlayerId)
    {
        if (type == MatchEventType.Substitution)
        {
            if (!playerId.HasValue ||
                !relatedPlayerId.HasValue)
            {
                throw new InvalidOperationException(
                    "Kod izmene moraju biti navedeni igrač koji izlazi i igrač koji ulazi."
                );
            }

            if (playerId == relatedPlayerId)
            {
                throw new InvalidOperationException(
                    "Igrač koji izlazi i igrač koji ulazi ne mogu biti ista osoba."
                );
            }

            return;
        }

        if (relatedPlayerId.HasValue)
        {
            throw new InvalidOperationException(
                "RelatedPlayerId se koristi samo kod izmene."
            );
        }
    }


    // ============================================================
    // PRONAĐI IGRAČA
    // ============================================================

    private async Task<Player?> GetPlayerAsync(
        int? playerId)
    {
        if (!playerId.HasValue)
            return null;

        return await _context.Players
            .FirstOrDefaultAsync(x =>
                x.Id == playerId.Value);
    }


    // ============================================================
    // PRIMENI IZMENU
    // ============================================================

    private async Task ApplySubstitutionAsync(
        int matchId,
        Player playerOut,
        Player playerIn,
        int minute)
    {
        var playerOutLineup = await _context.MatchLineups
            .FirstOrDefaultAsync(x =>
                x.MatchId == matchId &&
                x.PlayerId == playerOut.Id);

        if (playerOutLineup == null)
        {
            throw new InvalidOperationException(
                "Igrač koji izlazi nije u sastavu."
            );
        }

        var playerInLineup = await _context.MatchLineups
            .FirstOrDefaultAsync(x =>
                x.MatchId == matchId &&
                x.PlayerId == playerIn.Id);

        if (playerInLineup == null)
        {
            throw new InvalidOperationException(
                "Igrač koji ulazi nije u sastavu."
            );
        }

        if (!playerOutLineup.IsStarter &&
            !playerOutLineup.EnteredMinute.HasValue)
        {
            throw new InvalidOperationException(
                "Igrač koji izlazi nije aktivan igrač."
            );
        }

        if (!playerInLineup.IsSubstitute)
        {
            throw new InvalidOperationException(
                "Igrač koji ulazi mora biti označen kao zamena."
            );
        }

        playerOutLineup.LeftMinute = minute;

        playerInLineup.EnteredMinute = minute;

        // Igrač koji ulazi postaje aktivan.
        playerInLineup.IsSubstitute = false;
    }


    // ============================================================
    // PONIŠTI IZMENU
    // ============================================================

    private async Task RevertSubstitutionAsync(
        int matchId,
        Player playerOut,
        Player playerIn,
        int minute)
    {
        var playerOutLineup = await _context.MatchLineups
            .FirstOrDefaultAsync(x =>
                x.MatchId == matchId &&
                x.PlayerId == playerOut.Id);

        var playerInLineup = await _context.MatchLineups
            .FirstOrDefaultAsync(x =>
                x.MatchId == matchId &&
                x.PlayerId == playerIn.Id);

        if (playerOutLineup == null ||
            playerInLineup == null)
            return;

        playerOutLineup.LeftMinute = null;

        playerInLineup.EnteredMinute = null;
        playerInLineup.IsSubstitute = true;
    }


    // ============================================================
    // POVEĆAJ REZULTAT
    // ============================================================

    private static void IncreaseScore(
        Match match,
        Player player)
    {
        var participant = match.Participants
            .FirstOrDefault(x =>
                x.TeamId.HasValue &&
                x.TeamId.Value == player.TeamId
            );

        if (participant == null)
        {
            throw new InvalidOperationException(
                "Tim igrača nije pronađen među učesnicima utakmice."
            );
        }

        if (participant.Side == ParticipantSide.Home)
            match.HomeScore++;
        else
            match.AwayScore++;
    }


    // ============================================================
    // SMANJI REZULTAT
    // ============================================================

    private static void DecreaseScore(
        Match match,
        Player player)
    {
        var participant = match.Participants
            .FirstOrDefault(x =>
                x.TeamId.HasValue &&
                x.TeamId.Value == player.TeamId
            );

        if (participant == null)
            return;

        if (participant.Side == ParticipantSide.Home)
        {
            if (match.HomeScore > 0)
                match.HomeScore--;
        }
        else
        {
            if (match.AwayScore > 0)
                match.AwayScore--;
        }
    }


    private async Task BroadcastMatchUpdateAsync(int matchId)
    {
        var match = await _context.Matches
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == matchId);

        if (match == null)
        {
            return;
        }

        await _hubContext.Clients
            .Group(LiveMatchHub.GetMatchGroupName(matchId))
            .SendAsync(
                "MatchUpdated",
                new
                {
                    MatchId = match.Id,

                    HomeScore = match.HomeScore,

                    AwayScore = match.AwayScore,

                    Status = match.Status.ToString(),

                    IsLive = match.Status == MatchStatus.Live,

                    UpdatedAt = DateTime.UtcNow
                }
            );
    }

    private async Task BroadcastMatchStartedAsync(int matchId)
    {
        await _hubContext.Clients
            .Group(LiveMatchHub.GetMatchGroupName(matchId))
            .SendAsync(
                "MatchStarted",
                new
                {
                    MatchId = matchId,
                    StartedAt = DateTime.UtcNow
                }
            );
    }

    private async Task BroadcastMatchFinishedAsync(
    int matchId,
    int homeScore,
    int awayScore)
    {
        await _hubContext.Clients
            .Group(LiveMatchHub.GetMatchGroupName(matchId))
            .SendAsync(
                "MatchFinished",
                new
                {
                    MatchId = matchId,
                    HomeScore = homeScore,
                    AwayScore = awayScore,
                    FinishedAt = DateTime.UtcNow
                }
            );
    }

}