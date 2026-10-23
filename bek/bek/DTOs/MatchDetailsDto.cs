namespace bek.DTOs;

public class MatchDetailsDto
{
    public int Id { get; set; }

    public DateTime MatchDate { get; set; }

    public int HomeScore { get; set; }

    public int AwayScore { get; set; }

    public MatchStatusDto Status { get; set; }

    public bool IsLive { get; set; }

    public DateTime? StartedAt { get; set; }

    public DateTime? FinishedAt { get; set; }

    public string? Location { get; set; }

    public MatchTeamDto? HomeTeam { get; set; }

    public MatchTeamDto? AwayTeam { get; set; }

    public List<MatchLineupDto> HomeLineup { get; set; } = new();

    public List<MatchLineupDto> AwayLineup { get; set; } = new();

    public List<MatchEventDto> Events { get; set; } = new();
}

public class MatchTeamDto
{
    public int Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public string? ShortName { get; set; }

    public string? LogoUrl { get; set; }

    public string? PrimaryColor { get; set; }

    public string? SecondaryColor { get; set; }
}
