using bek.Data;
using bek.DTOs;
using bek.Models;
using bek.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace bek.Controllers;

[ApiController]
[Route("api/[controller]")]
public class GroupTeamsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public GroupTeamsController(ApplicationDbContext context)
    {
        _context = context;
    }

    // GET: /api/GroupTeams/group/1
    [HttpGet("group/{groupId}")]
    public async Task<ActionResult<IEnumerable<GroupTeamDto>>> GetByGroup(
        int groupId)
    {
        var groupExists = await _context.CompetitionGroups
            .AnyAsync(x => x.Id == groupId);

        if (!groupExists)
        {
            return NotFound(new
            {
                message = "Grupa nije pronađena."
            });
        }

        var teams = await _context.GroupTeams
            .Where(x => x.GroupId == groupId)
            .Include(x => x.Team)
            .OrderBy(x => x.Seed)
            .ThenBy(x => x.Team.Name)
            .Select(x => new GroupTeamDto
            {
                Id = x.Id,
                GroupId = x.GroupId,
                TeamId = x.TeamId,
                TeamName = x.Team.Name,
                ShortName = x.Team.ShortName,
                LogoUrl = x.Team.LogoUrl,
                Seed = x.Seed
            })
            .ToListAsync();

        foreach (var team in teams)
        {
            team.LogoUrl = ImageStorageService.ToPublicUrl(
                Request,
                team.LogoUrl);
        }

        return Ok(teams);
    }

    // GET: /api/GroupTeams/5
    [HttpGet("{id}")]
    public async Task<ActionResult<GroupTeamDto>> GetById(int id)
    {
        var groupTeam = await _context.GroupTeams
            .Include(x => x.Team)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (groupTeam == null)
        {
            return NotFound(new
            {
                message = "Tim nije pronađen u grupi."
            });
        }

        return Ok(new GroupTeamDto
        {
            Id = groupTeam.Id,
            GroupId = groupTeam.GroupId,
            TeamId = groupTeam.TeamId,
            TeamName = groupTeam.Team.Name,
            ShortName = groupTeam.Team.ShortName,
            LogoUrl = ImageStorageService.ToPublicUrl(
                Request,
                groupTeam.Team.LogoUrl),
            Seed = groupTeam.Seed
        });
    }

    // POST: /api/GroupTeams
    [HttpPost]
    public async Task<ActionResult<GroupTeamDto>> Create(
        CreateGroupTeamDto dto)
    {
        var group = await _context.CompetitionGroups
            .FirstOrDefaultAsync(x => x.Id == dto.GroupId);

        if (group == null)
        {
            return NotFound(new
            {
                message = "Grupa nije pronađena."
            });
        }

        var team = await _context.Teams
            .FirstOrDefaultAsync(x => x.Id == dto.TeamId);

        if (team == null)
        {
            return NotFound(new
            {
                message = "Tim nije pronađen."
            });
        }

        if (!team.IsActive)
        {
            return BadRequest(new
            {
                message = "Nije moguće dodati neaktivan tim."
            });
        }

        var alreadyExists = await _context.GroupTeams
            .AnyAsync(x =>
                x.GroupId == dto.GroupId &&
                x.TeamId == dto.TeamId);

        if (alreadyExists)
        {
            return BadRequest(new
            {
                message = "Ovaj tim je već dodat u grupu."
            });
        }

        if (dto.Seed.HasValue && dto.Seed.Value <= 0)
        {
            return BadRequest(new
            {
                message = "Seed mora biti veći od nule."
            });
        }

        var groupTeam = new GroupTeam
        {
            GroupId = dto.GroupId,
            TeamId = dto.TeamId,
            Seed = dto.Seed
        };

        _context.GroupTeams.Add(groupTeam);

        await _context.SaveChangesAsync();

        return CreatedAtAction(
            nameof(GetById),
            new { id = groupTeam.Id },
            new GroupTeamDto
            {
                Id = groupTeam.Id,
                GroupId = groupTeam.GroupId,
                TeamId = groupTeam.TeamId,
                TeamName = team.Name,
                ShortName = team.ShortName,
                LogoUrl = ImageStorageService.ToPublicUrl(
                    Request,
                    team.LogoUrl),
                Seed = groupTeam.Seed
            });
    }

    // PUT: /api/GroupTeams/5
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(
        int id,
        UpdateGroupTeamDto dto)
    {
        var groupTeam = await _context.GroupTeams
            .FirstOrDefaultAsync(x => x.Id == id);

        if (groupTeam == null)
        {
            return NotFound(new
            {
                message = "Tim nije pronađen u grupi."
            });
        }

        if (dto.Seed.HasValue && dto.Seed.Value <= 0)
        {
            return BadRequest(new
            {
                message = "Seed mora biti veći od nule."
            });
        }

        groupTeam.Seed = dto.Seed;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    // DELETE: /api/GroupTeams/5
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var groupTeam = await _context.GroupTeams
            .FirstOrDefaultAsync(x => x.Id == id);

        if (groupTeam == null)
        {
            return NotFound(new
            {
                message = "Tim nije pronađen u grupi."
            });
        }

        var hasMatches = await _context.Matches
            .AnyAsync(x => x.GroupId == groupTeam.GroupId);

        if (hasMatches)
        {
            return BadRequest(new
            {
                message =
                    "Nije moguće ukloniti tim jer grupa već ima utakmice."
            });
        }

        _context.GroupTeams.Remove(groupTeam);

        await _context.SaveChangesAsync();

        return NoContent();
    }
}