namespace bek.DTOs;

public class PlayerStatisticsDto
{
    public int PlayerId { get; set; }

    public string PlayerName { get; set; } = string.Empty;

    public int? JerseyNumber { get; set; }

    public string? Position { get; set; }

    public int TeamId { get; set; }

    public string TeamName { get; set; } = string.Empty;

    public string? TeamLogoUrl { get; set; }

    public int Appearances { get; set; }

    public int Starts { get; set; }

    public int SubstituteAppearances { get; set; }

    public int Goals { get; set; }

    public int Assists { get; set; }

    public int YellowCards { get; set; }

    public int RedCards { get; set; }
}