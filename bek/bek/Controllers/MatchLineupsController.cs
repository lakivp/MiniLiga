using bek.DTOs;
using bek.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;

namespace bek.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class MatchLineupsController : ControllerBase
{
    private readonly MatchLineupService _lineupService;

    public MatchLineupsController(
        MatchLineupService lineupService)
    {
        _lineupService = lineupService;
    }


    // ============================================================
    // GET SASTAV UTAKMICE
    // ============================================================

    [HttpGet("match/{matchId}")]
    public async Task<IActionResult> GetMatchLineup(
        int matchId)
    {
        try
        {
            var lineup =
                await _lineupService
                    .GetMatchLineupAsync(matchId);

            SetPublicImageUrls(lineup);

            return Ok(lineup);
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new
            {
                message = ex.Message
            });
        }
    }

    [HttpPost("match/{matchId}/populate-current-roster")]
    public async Task<IActionResult> PopulateCurrentRoster(
        int matchId)
    {
        try
        {
            var lineup = await _lineupService
                .PopulateCurrentRosterAsync(matchId);

            SetPublicImageUrls(lineup);

            return Ok(lineup);
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new
            {
                message = ex.Message
            });
        }
    }


    // ============================================================
    // GET JEDAN LINEUP ZAPIS
    // ============================================================

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var lineup =
            await _lineupService.GetByIdAsync(id);

        if (lineup == null)
        {
            return NotFound(new
            {
                message = "Igrač nije pronađen u sastavu."
            });
        }

        SetPublicImageUrls(lineup);

        return Ok(lineup);
    }


    // ============================================================
    // POST DODAJ IGRAČA
    // ============================================================

    [HttpPost("match/{matchId}")]
    public async Task<IActionResult> AddPlayer(
        int matchId,
        CreateMatchLineupDto dto)
    {
        try
        {
            var lineup =
                await _lineupService.AddPlayerAsync(
                    matchId,
                    dto
                );

            SetPublicImageUrls(lineup);

            return CreatedAtAction(
                nameof(GetById),
                new
                {
                    id = lineup.Id
                },
                lineup
            );
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new
            {
                message = ex.Message
            });
        }
    }


    // ============================================================
    // PUT IZMENI IGRAČA
    // ============================================================

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdatePlayer(
        int id,
        UpdateMatchLineupDto dto)
    {
        try
        {
            var lineup =
                await _lineupService.UpdatePlayerAsync(
                    id,
                    dto
                );

            if (lineup == null)
            {
                return NotFound(new
                {
                    message = "Igrač nije pronađen u sastavu."
                });
            }

            SetPublicImageUrls(lineup);

            return Ok(lineup);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new
            {
                message = ex.Message
            });
        }
    }


    // ============================================================
    // DELETE UKLONI IGRAČA
    // ============================================================

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeletePlayer(int id)
    {
        var deleted =
            await _lineupService.RemovePlayerAsync(id);

        if (!deleted)
        {
            return NotFound(new
            {
                message = "Igrač nije pronađen u sastavu."
            });
        }

        return NoContent();
    }

    private void SetPublicImageUrls(MatchLineupDto lineup)
    {
        lineup.PlayerPhotoUrl = ImageStorageService.ToPublicUrl(
            Request,
            lineup.PlayerPhotoUrl);
        lineup.TeamLogoUrl = ImageStorageService.ToPublicUrl(
            Request,
            lineup.TeamLogoUrl);
    }

    private void SetPublicImageUrls(IEnumerable<MatchLineupDto> lineup)
    {
        foreach (var player in lineup)
        {
            SetPublicImageUrls(player);
        }
    }
}