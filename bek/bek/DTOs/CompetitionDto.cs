namespace bek.DTOs;

public class CompetitionDto
{
    public int Id { get; set; }

    public int SeasonId { get; set; }

    public string SeasonName { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; }

    public bool IsActive { get; set; }
}