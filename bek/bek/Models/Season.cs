namespace bek.Models;

public class Season
{
    public int Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public int Number { get; set; }

    public DateTime StartDate { get; set; }

    public DateTime? EndDate { get; set; }

    public bool IsActive { get; set; }

    public string? Description { get; set; }

    public ICollection<Competition> Competitions { get; set; }
        = new List<Competition>();
}