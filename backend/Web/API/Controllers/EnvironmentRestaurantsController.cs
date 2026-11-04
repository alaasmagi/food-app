using Asp.Versioning;
using Contracts.Application;
using DTO.Web;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.Mvc;
using Web.Configuration;
using IMapper = Base.Contracts.DTO.IMapper<DTO.Web.EnvironmentRestaurantDto, Domain.EnvironmentRestaurant>;

namespace Web.API.Controllers;

[ApiController]
[ApiVersion(1.0)]
[EnableRateLimiting(RateLimitPolicies.Api)]
[Route("api/v{version:apiVersion}/environment-restaurants")]
[Produces("application/json")]
[ApiBearerAuthorize]
public class EnvironmentRestaurantsController(
    IEnvironmentRestaurantService environmentRestaurantService,
    ICurrentActorAccessor currentActorAccessor,
    IMapper mapper) : ApiControllerBase
{
    protected override IReadOnlyDictionary<string, int> ErrorStatusCodes { get; } = new Dictionary<string, int>
    {
        [EnvironmentRestaurantErrorCodes.DuplicateMembership] = StatusCodes.Status409Conflict,
    };

    [HttpGet]
    public async Task<ActionResult<IEnumerable<EnvironmentRestaurantDto>>> GetAll()
    {
        if (!TryGetActorId(currentActorAccessor, out var actorId, out var unauthorized))
        {
            return unauthorized;
        }

        var result = await environmentRestaurantService.GetAllAsync(actorId);
        if (!result.Successful)
        {
            return ToProblem(result.Error);
        }

        return Ok(mapper.Map(result.Value)?.ToList() ?? []);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<EnvironmentRestaurantDto>> GetById(Guid id)
    {
        if (!TryGetActorId(currentActorAccessor, out var actorId, out var unauthorized))
        {
            return unauthorized;
        }

        var result = await environmentRestaurantService.GetByIdAsync(id, actorId);
        if (!result.Successful)
        {
            return ToProblem(result.Error);
        }

        return Ok(mapper.Map(result.Value));
    }

    [HttpPost]
    public async Task<ActionResult<EnvironmentRestaurantDto>> Create(EnvironmentRestaurantDto input)
    {
        if (!TryGetActorId(currentActorAccessor, out var actorId, out var unauthorized))
        {
            return unauthorized;
        }

        var environmentRestaurant = mapper.Map(input);
        if (environmentRestaurant == null)
        {
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Invalid EnvironmentRestaurant payload.");
        }

        var result = await environmentRestaurantService.CreateAsync(environmentRestaurant, actorId);
        if (!result.Successful)
        {
            return ToProblem(result.Error);
        }

        var output = mapper.Map(result.Value)!;
        return CreatedAtAction(nameof(GetById), new { version = "1", id = output.Id }, output);
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

        var result = await environmentRestaurantService.RemoveAsync(id, NormalizeConcurrencyToken(expectedConcurrencyToken), actorId);
        if (!result.Successful)
        {
            return ToProblem(result.Error);
        }

        return NoContent();
    }
}
