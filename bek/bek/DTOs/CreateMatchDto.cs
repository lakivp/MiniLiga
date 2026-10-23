namespace bek.DTOs;

public class CreateMatchDto
{
    public int PhaseId { get; set; }

    public int? GroupId { get; set; }

    public DateTime MatchDate { get; set; }

    public int? Round { get; set; }

    public string? Location { get; set; }

    public CreateMatchParticipantDto Home { get; set; } = new();

    public CreateMatchParticipantDto Away { get; set; } = new();
}