namespace bek.DTOs;

public class CreateCompetitionGroupDto
{
    public int PhaseId { get; set; }

    public string Name { get; set; } = string.Empty;

    public int Order { get; set; }
}