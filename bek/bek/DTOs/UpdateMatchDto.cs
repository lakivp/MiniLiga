namespace bek.DTOs;

public class UpdateMatchDto
{
    public DateTime MatchDate { get; set; }

    public int? Round { get; set; }

    public string? Location { get; set; }

    public MatchStatusDto Status { get; set; }

    public int HomeScore { get; set; }

    public int AwayScore { get; set; }

    public bool IsLive { get; set; }

    public DateTime? StartedAt { get; set; }

    public DateTime? FinishedAt { get; set; }
}