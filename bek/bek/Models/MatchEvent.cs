namespace bek.Models;

public class MatchEvent
{
    public int Id { get; set; }

    public int MatchId { get; set; }

    public Match Match { get; set; } = null!;

    // Glavni igrač događaja.
    //
    // Kod:
    // Goal       -> strelac
    // Assist     -> asistent
    // YellowCard -> igrač koji je dobio karton
    // RedCard    -> igrač koji je dobio karton
    // Substitution -> igrač koji IZLAZI
    public int? PlayerId { get; set; }

    public Player? Player { get; set; }

    // Povezani igrač.
    //
    // Trenutno ga koristimo prvenstveno kod izmene:
    //
    // PlayerId       = igrač koji izlazi
    // RelatedPlayerId = igrač koji ulazi
    //
    // Kod ostalih događaja ostaje null.
    public int? RelatedPlayerId { get; set; }

    public Player? RelatedPlayer { get; set; }

    public MatchEventType Type { get; set; }

    public int Minute { get; set; }

    public string? Description { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public enum MatchEventType
{
    Goal = 0,
    YellowCard = 1,
    RedCard = 2,
    Assist = 3,
    Substitution = 4
}