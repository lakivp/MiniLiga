namespace bek.Models;

public class MatchParticipant
{
    public int Id { get; set; }

    public int MatchId { get; set; }

    public Match Match { get; set; } = null!;

    public ParticipantSide Side { get; set; }

    public int? TeamId { get; set; }

    public Team? Team { get; set; }

    public ParticipantSourceType SourceType { get; set; }

    public int? SourceMatchId { get; set; }

    public Match? SourceMatch { get; set; }

    public int? SourceGroupId { get; set; }

    public CompetitionGroup? SourceGroup { get; set; }

    public int? SourcePosition { get; set; }
}

public enum ParticipantSide
{
    Home = 0,
    Away = 1
}

public enum ParticipantSourceType
{
    FixedTeam = 0,
    GroupPosition = 1,
    MatchWinner = 2,
    MatchLoser = 3
}