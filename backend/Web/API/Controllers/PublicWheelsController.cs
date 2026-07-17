using Asp.Versioning;
using Base.DTO;
using Contracts.Application;
using DTO.Web;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Web.Configuration;
using IMapper = Base.Contracts.DTO.IMapper<DTO.Web.PublicUserWheelDto, Domain.UserWheel>;

namespace Web.API.Controllers;

// The only unauthenticated read surface in the API. [AllowAnonymous] overrides the global
// FallbackPolicy (which otherwise requires an authenticated user); [ApiBearerAuthorize] is deliberately
// absent. Rate limited by the stricter, per-IP-partitioned public-api policy.
[ApiController]
[ApiVersion(1.0)]
[EnableRateLimiting(RateLimitPolicies.PublicApi)]
[Route("api/v{version:apiVersion}/public/wheels")]
[Produces("application/json")]
[AllowAnonymous]
public class PublicWheelsController(
    IUserWheelService userWheelService,
    IMapper mapper) : ControllerBase
{
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<PublicUserWheelDto>> GetById(Guid id)
    {
        var result = await userWheelService.GetPublicByIdAsync(id);
        if (!result.Successful)
        {
            // The service only ever fails with NOT_FOUND here, and a missing wheel and a non-public
            // wheel collapse to the same 404 - never a 401/403 that would leak which ids exist.
            return Problem(
                statusCode: StatusCodes.Status404NotFound,
                title: ErrorDefaults.Codes.NotFound,
                detail: ErrorDefaults.Messages.NotFound);
        }

        return Ok(mapper.Map(result.Value));
    }
}
