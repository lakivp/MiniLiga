namespace bek.DTOs;

public class PublicCompetitionOptionDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public bool IsActive { get; set; }
}

public class PublicPlayerStatisticDto
{
    public int PlayerId { get; set; }

    public string PlayerName { get; set; } = string.Empty;

    public int? JerseyNumber { get; set; }

    public string? PhotoUrl { get; set; }

    public int TeamId { get; set; }

    public string TeamName { get; set; } = string.Empty;

    public string? TeamLogoUrl { get; set; }

    public int Goals { get; set; }

    public int Assists { get; set; }
}

public class PublicStatisticsResponseDto
{
    public int CompetitionId { get; set; }

    public string CompetitionName { get; set; } = string.Empty;

    public List<PublicPlayerStatisticDto> TopScorers { get; set; } = [];

    public List<PublicPlayerStatisticDto> TopAssists { get; set; } = [];
}