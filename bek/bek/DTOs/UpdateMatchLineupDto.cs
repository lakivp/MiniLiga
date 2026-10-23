namespace bek.DTOs;

public class UpdateMatchLineupDto
{
    public bool IsStarter { get; set; }

    public bool IsSubstitute { get; set; }

    public string? Position { get; set; }

    public int Order { get; set; }

    public int? EnteredMinute { get; set; }

    public int? LeftMinute { get; set; }

    public string? Notes { get; set; }
}