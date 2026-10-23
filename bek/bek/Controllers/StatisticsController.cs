using bek.Services;
using Microsoft.AspNetCore.Mvc;

namespace bek.Controllers;

[ApiController]
[Route("api/[controller]")]
public class StatisticsController : ControllerBase
{
    private readonly PlayerStatisticsService _statisticsService;

    public StatisticsController(
        PlayerStatisticsService statisticsService)
    {
        _statisticsService = statisticsService;
    }


    // ============================================================
    // STATISTIKA SVIH IGRAČA
    // ============================================================

    [HttpGet("players")]
    public async Task<IActionResult> GetPlayersStatistics()
    {
        var statistics =
            await _statisticsService
                .GetAllPlayersStatisticsAsync();

        return Ok(statistics);
    }


    // ============================================================
    // STATISTIKA JEDNOG IGRAČA
    // ============================================================

    [HttpGet("players/{playerId}")]
    public async Task<IActionResult> GetPlayerStatistics(
        int playerId)
    {
        var statistics =
            await _statisticsService
                .GetPlayerStatisticsAsync(playerId);

        if (statistics == null)
        {
            return NotFound(new
            {
                message = "Igrač ne postoji."
            });
        }

        return Ok(statistics);
    }


    // ============================================================
    // STATISTIKA IGRAČA JEDNOG TIMA
    // ============================================================

    [HttpGet("team/{teamId}")]
    public async Task<IActionResult> GetTeamStatistics(
        int teamId)
    {
        try
        {
            var statistics =
                await _statisticsService
                    .GetTeamStatisticsAsync(teamId);

            return Ok(statistics);
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new
            {
                message = ex.Message
            });
        }
    }
}