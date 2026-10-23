namespace bek.DTOs;

public class CreateCompetitionDto
{
    public int SeasonId { get; set; }

    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; }

    public bool IsActive { get; set; } = true;
}