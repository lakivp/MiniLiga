using bek.DTOs;
using bek.Services;
using Microsoft.AspNetCore.Mvc;

namespace bek.Controllers;

[ApiController]
[Route("api/[controller]")]
public class StandingsController : ControllerBase
{
    private readonly StandingsService _standingsService;

    public StandingsController(
        StandingsService standingsService)
    {
        _standingsService = standingsService;
    }

    // =========================================================
    // TABELA JEDNE GRUPE
    // =========================================================

    [HttpGet("group/{groupId}")]
    public async Task<
        ActionResult<List<GroupStandingsDto>>
    > GetGroupStandings(int groupId)
    {
        try
        {
            var result =
                await _standingsService
                    .GetGroupStandingsAsync(groupId);

            foreach (var team in result)
            {
                team.LogoUrl = ImageStorageService.ToPublicUrl(
                    Request,
                    team.LogoUrl);
            }

            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new
            {
                message = ex.Message
            });
        }
    }

    // =========================================================
    // TABELE SVIH GRUPA JEDNE FAZE
    // =========================================================

    [HttpGet("phase/{phaseId}")]
    public async Task<
        ActionResult<
            Dictionary<int, List<GroupStandingsDto>>
        >
    > GetPhaseStandings(int phaseId)
    {
        var result =
            await _standingsService
                .GetPhaseStandingsAsync(phaseId);

        return Ok(result);
    }
}