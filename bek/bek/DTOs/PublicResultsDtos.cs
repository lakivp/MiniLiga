namespace bek.DTOs;

public class PublicResultsCompetitionDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public bool IsActive { get; set; }
}


// =========================================================
// TEAM
// =========================================================

public class PublicResultTeamDto
{
    public int? TeamId { get; set; }

    public string Name { get; set; } = string.Empty;

    public string? ShortName { get; set; }

    public string? LogoUrl { get; set; }

    public bool IsResolved { get; set; }
}


// =========================================================
// MATCH
// =========================================================

public class PublicResultMatchDto
{
    public int Id { get; set; }

    public DateTime MatchDate { get; set; }

    public int? Round { get; set; }

    public int HomeScore { get; set; }

    public int AwayScore { get; set; }

    public string Status { get; set; } = string.Empty;

    public string? Location { get; set; }

    public PublicResultTeamDto HomeTeam { get; set; } = new();

    public PublicResultTeamDto AwayTeam { get; set; } = new();
}


// =========================================================
// GROUP
// =========================================================

public class PublicResultsGroupDto
{
    public int? Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public List<PublicResultMatchDto> Matches { get; set; } = [];
}


// =========================================================
// PHASE
// =========================================================

public class PublicResultsPhaseDto
{
    public int Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public int Type { get; set; }

    public int Order { get; set; }

    // Sva kola koja postoje u ovoj fazi.
    public List<int> Rounds { get; set; } = [];

    public List<PublicResultsGroupDto> Groups { get; set; } = [];
}


// =========================================================
// RESPONSE
// =========================================================

public class PublicResultsResponseDto
{
    public int CompetitionId { get; set; }

    public string CompetitionName { get; set; } = string.Empty;

    public List<PublicResultsPhaseDto> Phases { get; set; } = [];
}