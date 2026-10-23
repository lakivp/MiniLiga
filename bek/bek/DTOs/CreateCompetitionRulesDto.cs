namespace bek.DTOs;

public class CreateCompetitionRulesDto
{
    public int CompetitionId { get; set; }

    public int WinPoints { get; set; } = 3;

    public int DrawPoints { get; set; } = 1;

    public int LossPoints { get; set; } = 0;

    public bool UseGoalDifference { get; set; } = true;

    public bool UseGoalsScored { get; set; } = true;

    public bool UseHeadToHead { get; set; } = false;

    public int? TeamsAdvancingPerGroup { get; set; }
}