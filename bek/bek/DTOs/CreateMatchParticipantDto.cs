namespace bek.DTOs;

public class CreateMatchParticipantDto
{
    public ParticipantSideDto Side { get; set; }

    public int? TeamId { get; set; }

    public ParticipantSourceTypeDto SourceType { get; set; }

    public int? SourceMatchId { get; set; }

    public int? SourceGroupId { get; set; }

    public int? SourcePosition { get; set; }
}