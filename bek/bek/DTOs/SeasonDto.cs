namespace bek.DTOs;

public class SeasonDto
{
    public int Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public int Number { get; set; }

    public DateTime StartDate { get; set; }

    public DateTime? EndDate { get; set; }

    public bool IsActive { get; set; }

    public string? Description { get; set; }
}