using bek.DTOs;
using bek.Services;
using Microsoft.AspNetCore.Mvc;

namespace bek.Controllers;

[ApiController]
[Route("api/PublicStatistics")]
public class PublicStatisticsController : ControllerBase
{
    private readonly PublicStatisticsService _statisticsService;

    public PublicStatisticsController(
        PublicStatisticsService statisticsService)
    {
        _statisticsService = statisticsService;
    }


    // =========================================================
    // GET: api/PublicStatistics/competitions
    // =========================================================

    [HttpGet("competitions")]
    public async Task<ActionResult<
        List<PublicCompetitionOptionDto>>>
        GetActiveCompetitions()
    {
        var competitions =
            await _statisticsService
                .GetActiveCompetitionsAsync();

        return Ok(competitions);
    }


    // =========================================================
    // GET: api/PublicStatistics?competitionId=1
    // =========================================================

    [HttpGet]
    public async Task<ActionResult<
        PublicStatisticsResponseDto>>
        GetStatistics(
            [FromQuery] int competitionId)
    {
        if (competitionId <= 0)
        {
            return BadRequest(new
            {
                message =
                    "CompetitionId mora biti veći od 0."
            });
        }


        var statistics =
            await _statisticsService
                .GetStatisticsAsync(competitionId);


        if (statistics == null)
        {
            return NotFound(new
            {
                message =
                    "Takmičenje nije pronađeno ili nije aktivno."
            });
        }


        return Ok(statistics);
    }
}