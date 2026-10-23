namespace bek.DTOs
{
    public class CreateGroupTeamDto
    {
        public int GroupId { get; set; }

        public int TeamId { get; set; }

        public int? Seed { get; set; }
    }
}
