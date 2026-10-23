namespace bek.Models
{
    public class Competition
    {
        public int Id { get; set; }

        public int SeasonId { get; set; }

        public Season Season { get; set; } = null!;

        public string Name { get; set; } = string.Empty;

        public string? Description { get; set; }

        public bool IsActive { get; set; }

        public ICollection<CompetitionPhase> Phases { get; set; }
            = new List<CompetitionPhase>();

        public CompetitionRules? Rules { get; set; }
    }
}
