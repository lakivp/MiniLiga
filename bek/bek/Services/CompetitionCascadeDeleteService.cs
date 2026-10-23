using bek.Data;
using bek.Models;
using Microsoft.EntityFrameworkCore;

namespace bek.Services;

public class CompetitionCascadeDeleteService
{
    private readonly ApplicationDbContext _context;

    public CompetitionCascadeDeleteService(
        ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<bool> DeleteCompetitionAsync(int competitionId)
    {
        await using var transaction =
            await _context.Database.BeginTransactionAsync();

        var competition = await _context.Competitions
            .FirstOrDefaultAsync(x => x.Id == competitionId);

        if (competition == null)
        {
            return false;
        }

        var phases = await _context.CompetitionPhases
            .Where(x => x.CompetitionId == competitionId)
            .ToListAsync();

        var phaseIds = phases
            .Select(x => x.Id)
            .ToList();

        var groups = phaseIds.Count == 0
            ? new List<CompetitionGroup>()
            : await _context.CompetitionGroups
                .Where(x => phaseIds.Contains(x.PhaseId))
                .ToListAsync();

        var groupIds = groups
            .Select(x => x.Id)
            .ToList();

        var matches = await _context.Matches
            .Where(x => phaseIds.Contains(x.PhaseId) ||
                        (x.GroupId.HasValue &&
                         groupIds.Contains(x.GroupId.Value)))
            .ToListAsync();

        var matchIds = matches
            .Select(x => x.Id)
            .ToList();

        await RemoveMatchDataAndDetachSourcesAsync(
            matchIds,
            groupIds);

        var groupTeams = groupIds.Count == 0
            ? new List<GroupTeam>()
            : await _context.GroupTeams
                .Where(x => groupIds.Contains(x.GroupId))
                .ToListAsync();

        var rules = await _context.CompetitionRules
            .FirstOrDefaultAsync(x => x.CompetitionId == competitionId);

        _context.Matches.RemoveRange(matches);
        _context.GroupTeams.RemoveRange(groupTeams);
        _context.CompetitionGroups.RemoveRange(groups);
        _context.CompetitionPhases.RemoveRange(phases);

        if (rules != null)
        {
            _context.CompetitionRules.Remove(rules);
        }

        _context.Competitions.Remove(competition);

        await _context.SaveChangesAsync();
        await transaction.CommitAsync();

        return true;
    }

    public async Task<bool> DeleteGroupAsync(int groupId)
    {
        await using var transaction =
            await _context.Database.BeginTransactionAsync();

        var group = await _context.CompetitionGroups
            .FirstOrDefaultAsync(x => x.Id == groupId);

        if (group == null)
        {
            return false;
        }

        var groupIds = new List<int> { groupId };

        var matches = await _context.Matches
            .Where(x => x.GroupId == groupId)
            .ToListAsync();

        var matchIds = matches
            .Select(x => x.Id)
            .ToList();

        await RemoveMatchDataAndDetachSourcesAsync(
            matchIds,
            groupIds);

        var groupTeams = await _context.GroupTeams
            .Where(x => x.GroupId == groupId)
            .ToListAsync();

        _context.Matches.RemoveRange(matches);
        _context.GroupTeams.RemoveRange(groupTeams);
        _context.CompetitionGroups.Remove(group);

        await _context.SaveChangesAsync();
        await transaction.CommitAsync();

        return true;
    }

    public async Task<bool> DeletePhaseAsync(int phaseId)
    {
        await using var transaction =
            await _context.Database.BeginTransactionAsync();

        var phase = await _context.CompetitionPhases
            .FirstOrDefaultAsync(x => x.Id == phaseId);

        if (phase == null)
        {
            return false;
        }

        var groups = await _context.CompetitionGroups
            .Where(x => x.PhaseId == phaseId)
            .ToListAsync();

        var groupIds = groups
            .Select(x => x.Id)
            .ToList();

        var matches = await _context.Matches
            .Where(x => x.PhaseId == phaseId ||
                        (x.GroupId.HasValue &&
                         groupIds.Contains(x.GroupId.Value)))
            .ToListAsync();

        var matchIds = matches
            .Select(x => x.Id)
            .ToList();

        await RemoveMatchDataAndDetachSourcesAsync(
            matchIds,
            groupIds);

        var groupTeams = groupIds.Count == 0
            ? new List<GroupTeam>()
            : await _context.GroupTeams
                .Where(x => groupIds.Contains(x.GroupId))
                .ToListAsync();

        _context.Matches.RemoveRange(matches);
        _context.GroupTeams.RemoveRange(groupTeams);
        _context.CompetitionGroups.RemoveRange(groups);
        _context.CompetitionPhases.Remove(phase);

        await _context.SaveChangesAsync();
        await transaction.CommitAsync();

        return true;
    }

    private async Task RemoveMatchDataAndDetachSourcesAsync(
        List<int> matchIds,
        List<int> groupIds)
    {
        var matchIdSet = matchIds.ToHashSet();

        var participants = await _context.MatchParticipants
            .Where(x => matchIds.Contains(x.MatchId) ||
                        (x.SourceMatchId.HasValue &&
                         matchIds.Contains(x.SourceMatchId.Value)) ||
                        (x.SourceGroupId.HasValue &&
                         groupIds.Contains(x.SourceGroupId.Value)))
            .ToListAsync();

        foreach (var participant in participants)
        {
            if (matchIdSet.Contains(participant.MatchId) ||
                !participant.TeamId.HasValue)
            {
                _context.MatchParticipants.Remove(participant);
                continue;
            }

            participant.SourceType =
                ParticipantSourceType.FixedTeam;
            participant.SourceMatchId = null;
            participant.SourceGroupId = null;
            participant.SourcePosition = null;
        }

        if (matchIds.Count > 0)
        {
            var events = await _context.MatchEvents
                .Where(x => matchIds.Contains(x.MatchId))
                .ToListAsync();

            var lineups = await _context.MatchLineups
                .Where(x => matchIds.Contains(x.MatchId))
                .ToListAsync();

            _context.MatchEvents.RemoveRange(events);
            _context.MatchLineups.RemoveRange(lineups);
        }

        await _context.SaveChangesAsync();
    }
}