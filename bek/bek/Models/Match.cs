namespace bek.Models;

public class Match
{
    public int Id { get; set; }

    public int PhaseId { get; set; }

    public CompetitionPhase Phase { get; set; } = null!;

    public int? GroupId { get; set; }

    public CompetitionGroup? Group { get; set; }

    public DateTime MatchDate { get; set; }

    public int? Round { get; set; }

    public int HomeScore { get; set; }

    public int AwayScore { get; set; }

    public MatchStatus Status { get; set; } = MatchStatus.Scheduled;

    public string? Location { get; set; }

    public bool IsLive { get; set; }

    public DateTime? StartedAt { get; set; }

    public DateTime? FinishedAt { get; set; }

    public ICollection<MatchParticipant> Participants { get; set; }
        = new List<MatchParticipant>();

    public ICollection<MatchEvent> Events { get; set; }
        = new List<MatchEvent>();
}

public enum MatchStatus
{
    Scheduled = 0,
    Live = 1,
    Finished = 2,
    Postponed = 3,
    Cancelled = 4
}