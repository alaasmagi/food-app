using Asp.Versioning;
using Base.Contracts.DTO;
using Base.DTO;
using Contracts.Application;
using DTO.Web;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.Mvc;
using Web.Configuration;
using IMapper = Base.Contracts.DTO.IMapper<DTO.Web.UserWheelDto, Domain.UserWheel>;

namespace Web.API.Controllers;

[ApiController]
[ApiVersion(1.0)]
[EnableRateLimiting(RateLimitPolicies.Api)]
[Route("api/v{version:apiVersion}/user-wheels")]
[Produces("application/json")]
[ApiBearerAuthorize]
public class UserWheelsController(
    IUserWheelService userWheelService,
    ICurrentActorAccessor currentActorAccessor,
    IMapper mapper) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<UserWheelDto>>> GetAll()
    {
        if (!TryGetActorId(out var actorId, out var unauthorized))
        {
            return unauthorized;
        }

        var result = await userWheelService.GetAllAsync(actorId);
        if (!result.Successful)
        {
            return ToProblem(result.Error);
        }

        return Ok(mapper.Map(result.Value)?.ToList() ?? []);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<UserWheelDto>> GetById(Guid id)
    {
        if (!TryGetActorId(out var actorId, out var unauthorized))
        {
            return unauthorized;
        }

        var result = await userWheelService.GetByIdAsync(id, actorId);
        if (!result.Successful)
        {
            return ToProblem(result.Error);
        }

        return Ok(mapper.Map(result.Value));
    }

    [HttpPost]
    public async Task<ActionResult<UserWheelDto>> Create(UserWheelDto input)
    {
        if (!TryGetActorId(out var actorId, out var unauthorized))
        {
            return unauthorized;
        }

        var userWheel = mapper.Map(input);
        if (userWheel == null)
        {
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Invalid UserWheel payload.");
        }

        var result = await userWheelService.CreateAsync(userWheel, actorId);
        if (!result.Successful)
        {
            return ToProblem(result.Error);
        }

        var output = mapper.Map(result.Value)!;
        return CreatedAtAction(nameof(GetById), new { version = "1", id = output.Id }, output);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<UserWheelDto>> Update(
        Guid id,
        UserWheelDto input,
        [FromHeader(Name = "If-Match")] string? expectedConcurrencyToken)
    {
        if (!TryGetActorId(out var actorId, out var unauthorized))
        {
            return unauthorized;
        }

        var userWheel = mapper.Map(input);
        if (userWheel == null)
        {
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Invalid UserWheel payload.");
        }

        var result = await userWheelService.UpdateAsync(
            id,
            userWheel,
            NormalizeConcurrencyToken(expectedConcurrencyToken),
            actorId);
        if (!result.Successful)
        {
            return ToProblem(result.Error);
        }

        return Ok(mapper.Map(result.Value));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(
        Guid id,
        [FromHeader(Name = "If-Match")] string? expectedConcurrencyToken)
    {
        if (!TryGetActorId(out var actorId, out var unauthorized))
        {
            return unauthorized;
        }

        var result = await userWheelService.RemoveAsync(id, NormalizeConcurrencyToken(expectedConcurrencyToken), actorId);
        if (!result.Successful)
        {
            return ToProblem(result.Error);
        }

        return NoContent();
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

    private static string? NormalizeConcurrencyToken(string? value)
    {
        return string.IsNullOrWhiteSpace(value)
            ? null
            : value.Trim().Trim('"');
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
