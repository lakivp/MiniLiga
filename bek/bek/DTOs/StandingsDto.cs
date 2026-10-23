namespace bek.DTOs;

public class StandingsDto
{
    public int Position { get; set; }

    public int TeamId { get; set; }

    public string TeamName { get; set; } = string.Empty;

    public string? ShortName { get; set; }

    public string? LogoUrl { get; set; }

    public int Played { get; set; }

    public int Wins { get; set; }

    public int Draws { get; set; }

    public int Losses { get; set; }

    public int GoalsFor { get; set; }

    public int GoalsAgainst { get; set; }

    public int GoalDifference { get; set; }

    public int Points { get; set; }
}