using bek.Models;
using Microsoft.EntityFrameworkCore;

namespace bek.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(
        DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<Season> Seasons => Set<Season>();

    public DbSet<Competition> Competitions => Set<Competition>();

    public DbSet<CompetitionPhase> CompetitionPhases => Set<CompetitionPhase>();

    public DbSet<CompetitionGroup> CompetitionGroups => Set<CompetitionGroup>();

    public DbSet<GroupTeam> GroupTeams => Set<GroupTeam>();

    public DbSet<Team> Teams => Set<Team>();

    public DbSet<Player> Players => Set<Player>();

    public DbSet<Match> Matches => Set<Match>();

    public DbSet<MatchParticipant> MatchParticipants => Set<MatchParticipant>();

    public DbSet<MatchEvent> MatchEvents => Set<MatchEvent>();

    public DbSet<CompetitionRules> CompetitionRules => Set<CompetitionRules>();

    public DbSet<MatchLineup> MatchLineups => Set<MatchLineup>();

    public DbSet<News> News => Set<News>();
    public DbSet<Admin> Admins => Set<Admin>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // SEASON
        modelBuilder.Entity<Season>()
            .HasIndex(x => x.Number)
            .IsUnique();

        // TEAM
        modelBuilder.Entity<Team>()
            .Property(x => x.Name)
            .HasMaxLength(150)
            .IsRequired();

        // PLAYER
        modelBuilder.Entity<Player>()
            .Property(x => x.FirstName)
            .HasMaxLength(100)
            .IsRequired();

        modelBuilder.Entity<Player>()
            .Property(x => x.LastName)
            .HasMaxLength(100)
            .IsRequired();

        // SEASON -> COMPETITIONS
        modelBuilder.Entity<Competition>()
            .HasOne(x => x.Season)
            .WithMany(x => x.Competitions)
            .HasForeignKey(x => x.SeasonId)
            .OnDelete(DeleteBehavior.Cascade);

        // COMPETITION -> PHASES
        modelBuilder.Entity<CompetitionPhase>()
            .HasOne(x => x.Competition)
            .WithMany(x => x.Phases)
            .HasForeignKey(x => x.CompetitionId)
            .OnDelete(DeleteBehavior.Cascade);

        // PHASE -> GROUPS
        modelBuilder.Entity<CompetitionGroup>()
            .HasOne(x => x.Phase)
            .WithMany(x => x.Groups)
            .HasForeignKey(x => x.PhaseId)
            .OnDelete(DeleteBehavior.Cascade);

        // GROUP -> TEAMS
        modelBuilder.Entity<GroupTeam>()
            .HasOne(x => x.Group)
            .WithMany(x => x.Teams)
            .HasForeignKey(x => x.GroupId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<GroupTeam>()
            .HasOne(x => x.Team)
            .WithMany(x => x.GroupTeams)
            .HasForeignKey(x => x.TeamId)
            .OnDelete(DeleteBehavior.Restrict);


        // PHASE -> MATCHES
        modelBuilder.Entity<Match>()
            .HasOne(x => x.Phase)
            .WithMany(x => x.Matches)
            .HasForeignKey(x => x.PhaseId)
            .OnDelete(DeleteBehavior.Cascade);

        // GROUP -> MATCHES
        modelBuilder.Entity<Match>()
            .HasOne(x => x.Group)
            .WithMany(x => x.Matches)
            .HasForeignKey(x => x.GroupId)
            .OnDelete(DeleteBehavior.SetNull);

        // MATCH -> PARTICIPANTS
        modelBuilder.Entity<MatchParticipant>()
            .HasOne(x => x.Match)
            .WithMany(x => x.Participants)
            .HasForeignKey(x => x.MatchId)
            .OnDelete(DeleteBehavior.Cascade);

        // PARTICIPANT -> TEAM
        modelBuilder.Entity<MatchParticipant>()
            .HasOne(x => x.Team)
            .WithMany()
            .HasForeignKey(x => x.TeamId)
            .OnDelete(DeleteBehavior.SetNull);

        // PARTICIPANT -> SOURCE MATCH
        modelBuilder.Entity<MatchParticipant>()
            .HasOne(x => x.SourceMatch)
            .WithMany()
            .HasForeignKey(x => x.SourceMatchId)
            .OnDelete(DeleteBehavior.Restrict);

        // PARTICIPANT -> SOURCE GROUP
        modelBuilder.Entity<MatchParticipant>()
            .HasOne(x => x.SourceGroup)
            .WithMany()
            .HasForeignKey(x => x.SourceGroupId)
            .OnDelete(DeleteBehavior.Restrict);

        // MATCH -> EVENTS
        modelBuilder.Entity<MatchEvent>()
            .HasOne(x => x.Match)
            .WithMany(x => x.Events)
            .HasForeignKey(x => x.MatchId)
            .OnDelete(DeleteBehavior.Cascade);

        // EVENT -> PLAYER
        modelBuilder.Entity<MatchEvent>()
            .HasOne(x => x.Player)
            .WithMany()
            .HasForeignKey(x => x.PlayerId)
            .OnDelete(DeleteBehavior.SetNull);
        modelBuilder.Entity<MatchEvent>()
            .HasOne(x => x.RelatedPlayer)
            .WithMany()
            .HasForeignKey(x => x.RelatedPlayerId)
            .OnDelete(DeleteBehavior.SetNull);

        // COMPETITION -> RULES
        modelBuilder.Entity<CompetitionRules>()
            .HasOne(x => x.Competition)
            .WithOne(x => x.Rules)
            .HasForeignKey<CompetitionRules>(x => x.CompetitionId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<MatchLineup>()
            .HasOne(x => x.Match)
            .WithMany()
            .HasForeignKey(x => x.MatchId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<MatchLineup>()
            .HasOne(x => x.Player)
            .WithMany()
            .HasForeignKey(x => x.PlayerId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<MatchLineup>()
            .HasOne(x => x.Team)
            .WithMany()
            .HasForeignKey(x => x.TeamId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<MatchLineup>()
            .HasIndex(x => new
            {
                x.MatchId,
                x.PlayerId
            })
            .IsUnique();
    }
}