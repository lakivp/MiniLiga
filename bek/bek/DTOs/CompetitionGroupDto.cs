namespace bek.DTOs;

public class CompetitionGroupDto
{
    public int Id { get; set; }

    public int PhaseId { get; set; }

    public string PhaseName { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;

    public int Order { get; set; }

    public int TeamsCount { get; set; }

    public int MatchesCount { get; set; }
}