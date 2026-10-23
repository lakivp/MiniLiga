using Microsoft.AspNetCore.SignalR;

namespace bek.Hubs;

public class LiveMatchHub : Hub
{
    // =========================================================
    // PRIDRUŽIVANJE UTAKMICI
    // =========================================================

    public async Task JoinMatch(int matchId)
    {
        if (matchId <= 0)
        {
            throw new HubException("Neispravan ID utakmice.");
        }

        var groupName = GetMatchGroupName(matchId);

        await Groups.AddToGroupAsync(
            Context.ConnectionId,
            groupName
        );

        await Clients.Caller.SendAsync(
            "JoinedMatch",
            new
            {
                MatchId = matchId
            }
        );
    }

    // =========================================================
    // NAPUŠTANJE UTAKMICE
    // =========================================================

    public async Task LeaveMatch(int matchId)
    {
        if (matchId <= 0)
        {
            throw new HubException("Neispravan ID utakmice.");
        }

        var groupName = GetMatchGroupName(matchId);

        await Groups.RemoveFromGroupAsync(
            Context.ConnectionId,
            groupName
        );

        await Clients.Caller.SendAsync(
            "LeftMatch",
            new
            {
                MatchId = matchId
            }
        );
    }

    // =========================================================
    // DISCONNECT
    // =========================================================

    public override async Task OnDisconnectedAsync(
        Exception? exception)
    {
        await base.OnDisconnectedAsync(exception);
    }

    // =========================================================
    // NAZIV SIGNALR GRUPE
    // =========================================================

    public static string GetMatchGroupName(int matchId)
    {
        return $"match-{matchId}";
    }
}