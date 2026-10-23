namespace bek.DTOs;

public class CompetitionPhaseDto
{
    public int Id { get; set; }

    public int CompetitionId { get; set; }

    public string CompetitionName { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;

    public int Order { get; set; }

    public int Type { get; set; }

    public string TypeName { get; set; } = string.Empty;

    public int GroupsCount { get; set; }

    public int MatchesCount { get; set; }
}