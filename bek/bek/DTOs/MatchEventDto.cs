namespace bek.DTOs;

public class MatchEventDto
{
    public int Id { get; set; }

    public int MatchId { get; set; }

    public int? PlayerId { get; set; }

    public string? PlayerName { get; set; }

    public int? TeamId { get; set; }

    public string? TeamName { get; set; }

    public int? RelatedPlayerId { get; set; }

    public string? RelatedPlayerName { get; set; }

    public int? RelatedPlayerTeamId { get; set; }

    public MatchEventTypeDto Type { get; set; }

    public int Minute { get; set; }

    public string? Description { get; set; }

    public DateTime CreatedAt { get; set; }
}

public enum MatchEventTypeDto
{
    Goal = 0,
    YellowCard = 1,
    RedCard = 2,
    Assist = 3,
    Substitution = 4
}