using Asp.Versioning;
using Contracts.Application;
using DTO.Web;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.Mvc;
using Web.Configuration;
using IMapper = Base.Contracts.DTO.IMapper<DTO.Web.DiningEnvironmentDto, Domain.DiningEnvironment>;

namespace Web.API.Controllers;

[ApiController]
[ApiVersion(1.0)]
[EnableRateLimiting(RateLimitPolicies.Api)]
[Route("api/v{version:apiVersion}/dining-environments")]
[Produces("application/json")]
[ApiBearerAuthorize]
public class DiningEnvironmentsController(
    IDiningEnvironmentService diningEnvironmentService,
    ICurrentActorAccessor currentActorAccessor,
    IMapper mapper) : ApiControllerBase
{
    protected override IReadOnlyDictionary<string, int> ErrorStatusCodes { get; } = new Dictionary<string, int>
    {
        [DiningEnvironmentErrorCodes.AutoFillValidation] = StatusCodes.Status400BadRequest,
        [DiningEnvironmentErrorCodes.AutoFillLocationRequired] = StatusCodes.Status400BadRequest,
    };

    [HttpGet]
    public async Task<ActionResult<IEnumerable<DiningEnvironmentDto>>> GetAll()
    {
        if (!TryGetActorId(currentActorAccessor, out var actorId, out var unauthorized))
        {
            return unauthorized;
        }

        var result = await diningEnvironmentService.GetAllAsync(actorId);
        if (!result.Successful)
        {
            return ToProblem(result.Error);
        }

        return Ok(mapper.Map(result.Value)?.ToList() ?? []);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<DiningEnvironmentDto>> GetById(Guid id)
    {
        if (!TryGetActorId(currentActorAccessor, out var actorId, out var unauthorized))
        {
            return unauthorized;
        }

        var result = await diningEnvironmentService.GetByIdAsync(id, actorId);
        if (!result.Successful)
        {
            return ToProblem(result.Error);
        }

        return Ok(mapper.Map(result.Value));
    }

    [HttpPost]
    public async Task<ActionResult<DiningEnvironmentDto>> Create(DiningEnvironmentDto input)
    {
        if (!TryGetActorId(currentActorAccessor, out var actorId, out var unauthorized))
        {
            return unauthorized;
        }

        var diningEnvironment = mapper.Map(input);
        if (diningEnvironment == null)
        {
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Invalid DiningEnvironment payload.");
        }

        var result = await diningEnvironmentService.CreateAsync(diningEnvironment, actorId);
        if (!result.Successful)
        {
            return ToProblem(result.Error);
        }

        var output = mapper.Map(result.Value)!;
        return CreatedAtAction(nameof(GetById), new { version = "1", id = output.Id }, output);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<DiningEnvironmentDto>> Update(
        Guid id,
        DiningEnvironmentDto input,
        [FromHeader(Name = "If-Match")] string? expectedConcurrencyToken)
    {
        if (!TryGetActorId(currentActorAccessor, out var actorId, out var unauthorized))
        {
            return unauthorized;
        }

        var diningEnvironment = mapper.Map(input);
        if (diningEnvironment == null)
        {
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Invalid DiningEnvironment payload.");
        }

        var result = await diningEnvironmentService.UpdateAsync(
            id,
            diningEnvironment,
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

        var result = await diningEnvironmentService.RemoveAsync(id, NormalizeConcurrencyToken(expectedConcurrencyToken), actorId);
        if (!result.Successful)
        {
            return ToProblem(result.Error);
        }

        return NoContent();
    }

    [HttpPost("{id:guid}/auto-fill")]
    public async Task<ActionResult<DiningEnvironmentAutoFillResultDto>> AutoFill(Guid id)
    {
        if (!TryGetActorId(currentActorAccessor, out var actorId, out var unauthorized))
        {
            return unauthorized;
        }

        var result = await diningEnvironmentService.AutoFillAsync(id, actorId);
        if (!result.Successful)
        {
            return ToProblem(result.Error);
        }

        var summary = result.Value!;
        return Ok(new DiningEnvironmentAutoFillResultDto
        {
            Added = summary.Added,
            AlreadyPresent = summary.AlreadyPresent,
            TotalMembers = summary.TotalMembers
        });
    }
}
