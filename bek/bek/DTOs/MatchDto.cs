namespace bek.DTOs;

public class MatchDto
{
    public int Id { get; set; }

    public int PhaseId { get; set; }

    public string PhaseName { get; set; } = string.Empty;

    public int? GroupId { get; set; }

    public string? GroupName { get; set; }

    public DateTime MatchDate { get; set; }

    public int? Round { get; set; }

    public int HomeScore { get; set; }

    public int AwayScore { get; set; }

    public MatchStatusDto Status { get; set; }

    public string? Location { get; set; }

    public bool IsLive { get; set; }

    public DateTime? StartedAt { get; set; }

    public DateTime? FinishedAt { get; set; }

    public List<MatchParticipantDto> Participants { get; set; }
        = new();
}

public enum MatchStatusDto
{
    Scheduled = 0,
    Live = 1,
    Finished = 2,
    Postponed = 3,
    Cancelled = 4
}