namespace bek.DTOs;

public class MatchLineupDto
{
    public int Id { get; set; }

    public int MatchId { get; set; }

    public int PlayerId { get; set; }

    public string PlayerName { get; set; } = string.Empty;

    public int? JerseyNumber { get; set; }

    public string? PlayerPhotoUrl { get; set; }

    public int TeamId { get; set; }

    public string TeamName { get; set; } = string.Empty;

    public string? TeamLogoUrl { get; set; }

    public bool IsStarter { get; set; }

    public bool IsSubstitute { get; set; }

    public string? Position { get; set; }

    public int Order { get; set; }

    public int? EnteredMinute { get; set; }

    public int? LeftMinute { get; set; }

    public string? Notes { get; set; }
}