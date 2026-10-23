namespace bek.DTOs;

public class UpdateCompetitionRulesDto
{
    public int WinPoints { get; set; }

    public int DrawPoints { get; set; }

    public int LossPoints { get; set; }

    public bool UseGoalDifference { get; set; }

    public bool UseGoalsScored { get; set; }

    public bool UseHeadToHead { get; set; }

    public int? TeamsAdvancingPerGroup { get; set; }
}