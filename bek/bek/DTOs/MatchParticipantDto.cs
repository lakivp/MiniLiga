namespace bek.DTOs;

public class MatchParticipantDto
{
    public int Id { get; set; }

    public int MatchId { get; set; }

    public ParticipantSideDto Side { get; set; }

    public int? TeamId { get; set; }

    public string? TeamName { get; set; }
    public string? TeamLogoUrl { get; set; }

    public ParticipantSourceTypeDto SourceType { get; set; }

    public int? SourceMatchId { get; set; }

    public int? SourceGroupId { get; set; }

    public string? SourceGroupName { get; set; }

    public int? SourcePosition { get; set; }
}

public enum ParticipantSideDto
{
    Home = 0,
    Away = 1
}

public enum ParticipantSourceTypeDto
{
    FixedTeam = 0,
    GroupPosition = 1,
    MatchWinner = 2,
    MatchLoser = 3
}