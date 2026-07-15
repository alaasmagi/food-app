using System.Globalization;
using Asp.Versioning;
using Base.Contracts.DTO;
using Base.DTO;
using Contracts.Application;
using DTO.Web;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Web.Configuration;
using IMapper = Base.Contracts.DTO.IMapper<DTO.Web.AppUserDto, Domain.AppUser>;

namespace Web.API.Controllers;

[ApiController]
[ApiVersion(1.0)]
[EnableRateLimiting(RateLimitPolicies.Api)]
[Route("api/v{version:apiVersion}/account")]
[Produces("application/json")]
public class AccountController(
    IAppUserService appUserService,
    ICurrentActorAccessor currentActorAccessor,
    IMapper mapper) : ControllerBase
{
    // Cookie-only: the frontend can only prove identity here via the same-site auth cookie, so a
    // bearer token must not satisfy this endpoint. The credentialed CORS policy lets the frontend's
    // XHR send that cookie cross-origin.
    [HttpGet("token")]
    [Authorize(AuthenticationSchemes = CookieAuthenticationDefaults.AuthenticationScheme)]
    [EnableCors(CorsPolicies.Frontend)]
    public async Task<ActionResult<TokenResponseDto>> Token()
    {
        // Read the OIDC-saved access token for the current cookie session. Duende access-token
        // management refreshes and re-stores this token, so the saved value is the current one.
        var accessToken = await HttpContext.GetTokenAsync("access_token");
        if (string.IsNullOrEmpty(accessToken))
        {
            return Unauthorized();
        }

        var expiresAtRaw = await HttpContext.GetTokenAsync("expires_at");
        var expiresAtUtc = DateTimeOffset.TryParse(
            expiresAtRaw,
            CultureInfo.InvariantCulture,
            DateTimeStyles.RoundtripKind,
            out var parsed)
            ? parsed.ToUniversalTime()
            : DateTimeOffset.UtcNow;

        return Ok(new TokenResponseDto
        {
            AccessToken = accessToken,
            ExpiresAtUtc = expiresAtUtc
        });
    }

    // Self-scoped: returns the current bearer identity's AppUser, never a client-supplied id.
    [HttpGet("me")]
    [ApiBearerAuthorize]
    public async Task<ActionResult<AppUserDto>> Me()
    {
        if (!TryGetActorId(out var actorId, out var unauthorized))
        {
            return unauthorized;
        }

        var result = await appUserService.GetByIdAsync(actorId);
        if (!result.Successful)
        {
            return ToProblem(result.Error);
        }

        return Ok(mapper.Map(result.Value));
    }

    // Self-scoped: the target AppUser is the current bearer identity, never a client-supplied id.
    [HttpPatch("notification-preferences")]
    [ApiBearerAuthorize]
    public async Task<ActionResult<AppUserDto>> UpdateNotificationPreferences(NotificationPreferencesDto input)
    {
        if (!TryGetActorId(out var actorId, out var unauthorized))
        {
            return unauthorized;
        }

        var result = await appUserService.UpdateNotificationPreferencesAsync(
            actorId,
            input.SendNotifications,
            input.NotificationEnvironmentId);
        if (!result.Successful)
        {
            return ToProblem(result.Error);
        }

        return Ok(mapper.Map(result.Value));
    }

    private bool TryGetActorId(out Guid actorId, out ActionResult unauthorizedResult)
    {
        var resolved = currentActorAccessor.TryGetActorId();
        if (resolved == null)
        {
            actorId = default;
            unauthorizedResult = Unauthorized();
            return false;
        }

        actorId = resolved.Value;
        unauthorizedResult = null!;
        return true;
    }

    private ObjectResult ToProblem(IError? error)
    {
        var statusCode = error?.Code switch
        {
            ErrorDefaults.Codes.NotFound => StatusCodes.Status404NotFound,
            ErrorDefaults.Codes.Forbidden => StatusCodes.Status403Forbidden,
            ErrorDefaults.Codes.ConcurrencyConflict => StatusCodes.Status409Conflict,
            ErrorDefaults.Codes.ConcurrencyTokenRequired => StatusCodes.Status428PreconditionRequired,
            ErrorDefaults.Codes.InvalidPaging => StatusCodes.Status400BadRequest,
            ErrorDefaults.Codes.MapFailed => StatusCodes.Status400BadRequest,
            _ => StatusCodes.Status500InternalServerError
        };

        return Problem(
            statusCode: statusCode,
            title: error?.Code ?? "REQUEST_FAILED",
            detail: error?.Message ?? "The request failed.");
    }
}
