namespace bek.DTOs;

public class CreateMatchEventDto
{
    public int MatchId { get; set; }

    public int? PlayerId { get; set; }

    public int? RelatedPlayerId { get; set; }

    public MatchEventTypeDto Type { get; set; }

    public int Minute { get; set; }

    public string? Description { get; set; }
}