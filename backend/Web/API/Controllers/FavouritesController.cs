using Asp.Versioning;
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
    IMapper mapper) : ApiControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<FavouriteDto>>> GetAll()
    {
        if (!TryGetActorId(currentActorAccessor, out var actorId, out var unauthorized))
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
        if (!TryGetActorId(currentActorAccessor, out var actorId, out var unauthorized))
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
        if (!TryGetActorId(currentActorAccessor, out var actorId, out var unauthorized))
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
        if (!TryGetActorId(currentActorAccessor, out var actorId, out var unauthorized))
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
        if (!TryGetActorId(currentActorAccessor, out var actorId, out var unauthorized))
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
}
