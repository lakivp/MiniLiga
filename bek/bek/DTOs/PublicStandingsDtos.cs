namespace bek.DTOs;

public class PublicStandingsCompetitionDto
{
    public int Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public bool IsActive { get; set; }
}


public class PublicStandingTeamDto
{
    public int Position { get; set; }

    public int TeamId { get; set; }

    public string TeamName { get; set; } = string.Empty;

    public string? ShortName { get; set; }

    public string? LogoUrl { get; set; }

    public int Played { get; set; }

    public int Wins { get; set; }

    public int Draws { get; set; }

    public int Losses { get; set; }

    public int GoalsFor { get; set; }

    public int GoalsAgainst { get; set; }

    public int GoalDifference { get; set; }

    public int Points { get; set; }
}


public class PublicStandingsTableDto
{
    public int? GroupId { get; set; }

    public string GroupName { get; set; } = string.Empty;

    public List<PublicStandingTeamDto> Teams { get; set; } = [];
}


public class PublicStandingsPhaseDto
{
    public int Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public int Type { get; set; }

    public int Order { get; set; }

    public List<PublicStandingsTableDto> Tables { get; set; } = [];
}


public class PublicStandingsResponseDto
{
    public int CompetitionId { get; set; }

    public string CompetitionName { get; set; } = string.Empty;

    public List<PublicStandingsPhaseDto> Phases { get; set; } = [];
}