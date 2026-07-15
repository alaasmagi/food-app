using Asp.Versioning;
using Base.Contracts.DTO;
using Base.DTO;
using Contracts.Application;
using DTO.Web;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.Mvc;
using Web.Configuration;
using IMapper = Base.Contracts.DTO.IMapper<DTO.Web.FavouriteDto, Domain.Favourite>;

namespace Web.API.Controllers;

[ApiController]
[ApiVersion(1.0)]
[EnableRateLimiting(RateLimitPolicies.Api)]
[Route("api/v{version:apiVersion}/favourites")]
[Produces("application/json")]
[ApiBearerAuthorize]
public class FavouritesController(
    IFavouriteService favouriteService,
    ICurrentActorAccessor currentActorAccessor,
    IMapper mapper) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<FavouriteDto>>> GetAll()
    {
        if (!TryGetActorId(out var actorId, out var unauthorized))
        {
            return unauthorized;
        }

        var result = await favouriteService.GetAllAsync(actorId);
        if (!result.Successful)
        {
            return ToProblem(result.Error);
        }

        return Ok(mapper.Map(result.Value)?.ToList() ?? []);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<FavouriteDto>> GetById(Guid id)
    {
        if (!TryGetActorId(out var actorId, out var unauthorized))
        {
            return unauthorized;
        }

        var result = await favouriteService.GetByIdAsync(id, actorId);
        if (!result.Successful)
        {
            return ToProblem(result.Error);
        }

        return Ok(mapper.Map(result.Value));
    }

    [HttpPost]
    public async Task<ActionResult<FavouriteDto>> Create(FavouriteDto input)
    {
        if (!TryGetActorId(out var actorId, out var unauthorized))
        {
            return unauthorized;
        }

        var favourite = mapper.Map(input);
        if (favourite == null)
        {
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Invalid Favourite payload.");
        }

        var result = await favouriteService.CreateAsync(favourite, actorId);
        if (!result.Successful)
        {
            return ToProblem(result.Error);
        }

        var output = mapper.Map(result.Value)!;
        return CreatedAtAction(nameof(GetById), new { version = "1", id = output.Id }, output);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<FavouriteDto>> Update(
        Guid id,
        FavouriteDto input,
        [FromHeader(Name = "If-Match")] string? expectedConcurrencyToken)
    {
        if (!TryGetActorId(out var actorId, out var unauthorized))
        {
            return unauthorized;
        }

        var favourite = mapper.Map(input);
        if (favourite == null)
        {
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Invalid Favourite payload.");
        }

        var result = await favouriteService.UpdateAsync(
            id,
            favourite,
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

        var result = await favouriteService.RemoveAsync(id, NormalizeConcurrencyToken(expectedConcurrencyToken), actorId);
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
