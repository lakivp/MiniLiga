namespace bek.DTOs;

public class TeamDto
{
    public int Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public string? ShortName { get; set; }

    public string? LogoUrl { get; set; }

    public string? PrimaryColor { get; set; }

    public string? SecondaryColor { get; set; }

    public string? Description { get; set; }

    public bool IsActive { get; set; }

    public DateTime CreatedAt { get; set; }

    public int PlayerCount { get; set; }
}