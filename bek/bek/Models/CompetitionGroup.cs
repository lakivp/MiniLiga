namespace bek.Models; 

public class CompetitionGroup
{
    public int Id { get; set; }

    public int PhaseId { get; set; }

    public CompetitionPhase Phase { get; set; } = null!;

    public string Name { get; set; } = string.Empty;

    public int Order { get; set; }

    public ICollection<GroupTeam> Teams { get; set; }
        = new List<GroupTeam>();

    public ICollection<Match> Matches { get; set; }
        = new List<Match>();
}