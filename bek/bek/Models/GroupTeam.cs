namespace bek.Models;

public class GroupTeam
{
    public int Id { get; set; }

    public int GroupId { get; set; }

    public CompetitionGroup Group { get; set; } = null!;

    public int TeamId { get; set; }

    public Team Team { get; set; } = null!;

    public int? Seed { get; set; }
}