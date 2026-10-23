namespace bek.DTOs;

public class NewsResponseDto
{
    public int Id { get; set; }

    public string Title { get; set; } = string.Empty;

    public string? ImageUrl { get; set; }

    public string Content { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }
}