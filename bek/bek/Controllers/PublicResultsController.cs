using bek.DTOs;
using bek.Services;
using Microsoft.AspNetCore.Mvc;

namespace bek.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PublicResultsController : ControllerBase
{
    private readonly PublicResultsService _service;

    public PublicResultsController(
        PublicResultsService service)
    {
        _service = service;
    }


    // =========================================================
    // GET: api/PublicResults/competitions
    // =========================================================

    [HttpGet("competitions")]
    public async Task<
        ActionResult<List<PublicResultsCompetitionDto>>
    > GetCompetitions()
    {
        var competitions =
            await _service.GetActiveCompetitionsAsync();

        return Ok(competitions);
    }


    // =========================================================
    // GET:
    // api/PublicResults?competitionId=1
    // =========================================================

    [HttpGet]
    public async Task<
        ActionResult<PublicResultsResponseDto>
    > GetResults([FromQuery] int competitionId)
    {
        if (competitionId <= 0)
        {
            return BadRequest(new
            {
                message = "CompetitionId nije validan."
            });
        }


        var result =
            await _service.GetResultsAsync(
                competitionId
            );


        if (result == null)
        {
            return NotFound(new
            {
                message =
                    "Takmičenje nije pronađeno."
            });
        }


        return Ok(result);
    }
}