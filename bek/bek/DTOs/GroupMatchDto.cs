namespace bek.DTOs
{
    public class GroupMatchDto
    {
        public int Id { get; set; }

        public int GroupId { get; set; }
        public int PhaseId { get; set; }

        public DateTime MatchDate { get; set; }

        public int? Round { get; set; }

        public int HomeScore { get; set; }
        public int AwayScore { get; set; }

        public MatchStatusDto Status { get; set; }

        public bool IsLive { get; set; }

        public string? Location { get; set; }

        public GroupMatchTeamDto? HomeTeam { get; set; }
        public GroupMatchTeamDto? AwayTeam { get; set; }
    }
}
