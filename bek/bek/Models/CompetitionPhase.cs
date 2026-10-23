namespace bek.Models;

public class CompetitionPhase
{
    public int Id { get; set; }

    public int CompetitionId { get; set; }

    public Competition Competition { get; set; } = null!;

    public string Name { get; set; } = string.Empty;

    public int Order { get; set; }

    public PhaseType Type { get; set; }

    public ICollection<CompetitionGroup> Groups { get; set; }
        = new List<CompetitionGroup>();

    public ICollection<Match> Matches { get; set; }
        = new List<Match>();
}

public enum PhaseType
{
    League = 0,
    Groups = 1,
    Playoff = 2,
    Knockout = 3,
    Custom = 4
}