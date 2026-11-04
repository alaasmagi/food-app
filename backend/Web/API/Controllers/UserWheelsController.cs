using Asp.Versioning;
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
    IMapper mapper) : ApiControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<UserWheelDto>>> GetAll()
    {
        if (!TryGetActorId(currentActorAccessor, out var actorId, out var unauthorized))
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
        if (!TryGetActorId(currentActorAccessor, out var actorId, out var unauthorized))
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
        if (!TryGetActorId(currentActorAccessor, out var actorId, out var unauthorized))
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
        if (!TryGetActorId(currentActorAccessor, out var actorId, out var unauthorized))
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
        if (!TryGetActorId(currentActorAccessor, out var actorId, out var unauthorized))
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
}
