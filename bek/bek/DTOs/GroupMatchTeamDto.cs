namespace bek.DTOs
{
    public class GroupMatchTeamDto
    {
        public int Id { get; set; }

        public string Name { get; set; } = string.Empty;

        public string? ShortName { get; set; }

        public string? LogoUrl { get; set; }
    }
}
