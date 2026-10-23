namespace bek.DTOs;

public class GroupTeamDto
{
    public int Id { get; set; }

    public int GroupId { get; set; }

    public string GroupName { get; set; } = string.Empty;

    public int TeamId { get; set; }

    public string TeamName { get; set; } = string.Empty;

    public string? ShortName { get; set; }

    public string? LogoUrl { get; set; }

    public int? Seed { get; set; }
}