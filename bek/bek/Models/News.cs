namespace bek.Models;

public class News
{
    public int Id { get; set; }

    public string Title { get; set; } = string.Empty;

    public string? ImageUrl { get; set; }

    public string Content { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }
}