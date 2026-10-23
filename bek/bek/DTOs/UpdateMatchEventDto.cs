namespace bek.DTOs;

public class UpdateMatchEventDto
{
    public int? PlayerId { get; set; }

    public int? RelatedPlayerId { get; set; }

    public MatchEventTypeDto Type { get; set; }

    public int Minute { get; set; }

    public string? Description { get; set; }
}