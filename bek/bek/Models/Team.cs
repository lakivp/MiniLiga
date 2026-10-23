namespace bek.Models;

public class Team
{
    public int Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public string? ShortName { get; set; }

    public string? LogoUrl { get; set; }

    public string? PrimaryColor { get; set; }

    public string? SecondaryColor { get; set; }

    public string? Description { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Player> Players { get; set; }
        = new List<Player>();

    public ICollection<GroupTeam> GroupTeams { get; set; }
        = new List<GroupTeam>();
}