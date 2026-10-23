namespace bek.DTOs;

public class PlayerDto
{
    public int Id { get; set; }

    public string FirstName { get; set; } = string.Empty;

    public string LastName { get; set; } = string.Empty;

    public string? DisplayName { get; set; }

    public int? JerseyNumber { get; set; }

    public string? Position { get; set; }

    public string? PhotoUrl { get; set; }

    public int TeamId { get; set; }

    public string TeamName { get; set; } = string.Empty;

    public bool IsActive { get; set; }
}