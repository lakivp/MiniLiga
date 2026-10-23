using bek.DTOs;
using bek.Services;
using Microsoft.AspNetCore.Mvc;

namespace bek.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MatchDetailsController : ControllerBase
{
    private readonly MatchDetailsService _matchDetailsService;

    public MatchDetailsController(
        MatchDetailsService matchDetailsService)
    {
        _matchDetailsService = matchDetailsService;
    }

    [HttpGet("{matchId}")]
    public async Task<ActionResult<MatchDetailsDto>> GetMatchDetails(
        int matchId)
    {
        var result =
            await _matchDetailsService.GetMatchDetailsAsync(matchId);

        if (result == null)
        {
            return NotFound(new
            {
                message = "Utakmica nije pronađena."
            });
        }

        if (result.HomeTeam != null)
        {
            result.HomeTeam.LogoUrl = ImageStorageService.ToPublicUrl(
                Request,
                result.HomeTeam.LogoUrl);
        }

        if (result.AwayTeam != null)
        {
            result.AwayTeam.LogoUrl = ImageStorageService.ToPublicUrl(
                Request,
                result.AwayTeam.LogoUrl);
        }

        foreach (var lineup in result.HomeLineup.Concat(result.AwayLineup))
        {
            lineup.TeamLogoUrl = ImageStorageService.ToPublicUrl(
                Request,
                lineup.TeamLogoUrl);
            lineup.PlayerPhotoUrl = ImageStorageService.ToPublicUrl(
                Request,
                lineup.PlayerPhotoUrl);
        }

        return Ok(result);
    }
}