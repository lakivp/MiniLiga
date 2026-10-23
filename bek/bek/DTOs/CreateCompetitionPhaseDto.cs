namespace bek.DTOs;

public class CreateCompetitionPhaseDto
{
    public int CompetitionId { get; set; }

    public string Name { get; set; } = string.Empty;

    public int Order { get; set; }

    public int Type { get; set; }
}