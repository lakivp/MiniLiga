using bek.DTOs;
using bek.Services;
using Microsoft.AspNetCore.Mvc;

namespace bek.Controllers;

[ApiController]
[Route("api/PublicStandings")]
public class PublicStandingsController : ControllerBase
{
    private readonly PublicStandingsService _standingsService;

    public PublicStandingsController(
        PublicStandingsService standingsService)
    {
        _standingsService = standingsService;
    }


    // =========================================================
    // AKTIVNA TAKMIČENJA
    // =========================================================

    [HttpGet("competitions")]
    public async Task<ActionResult<
        List<PublicStandingsCompetitionDto>>>
        GetActiveCompetitions()
    {
        var competitions =
            await _standingsService
                .GetActiveCompetitionsAsync();

        return Ok(competitions);
    }


    // =========================================================
    // TABELA
    // =========================================================

    [HttpGet]
    public async Task<ActionResult<
        PublicStandingsResponseDto>>
        GetStandings(
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


        var standings =
            await _standingsService
                .GetStandingsAsync(
                    competitionId
                );


        if (standings == null)
        {
            return NotFound(new
            {
                message =
                    "Takmičenje nije pronađeno ili nije aktivno."
            });
        }


        return Ok(standings);
    }
}