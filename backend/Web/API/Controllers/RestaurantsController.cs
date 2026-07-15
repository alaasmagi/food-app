using Asp.Versioning;
using Base.Contracts.DTO;
using Base.DTO;
using Contracts.Application;
using DTO.Web;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.Mvc;
using Web.Configuration;
using IMapper = Base.Contracts.DTO.IMapper<DTO.Web.RestaurantDto, Domain.Restaurant>;

namespace Web.API.Controllers;

[ApiController]
[ApiVersion(1.0)]
[EnableRateLimiting(RateLimitPolicies.Api)]
[Route("api/v{version:apiVersion}/restaurants")]
[Produces("application/json")]
public class RestaurantsController(
    IRestaurantService restaurantService,
    IOfferFetchService offerFetchService,
    IMapper mapper) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<RestaurantDto>>> GetAll()
    {
        var result = await restaurantService.GetAllAsync();
        if (!result.Successful)
        {
            return ToProblem(result.Error);
        }

        return Ok(mapper.Map(result.Value)?.ToList() ?? []);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<RestaurantDto>> GetById(Guid id)
    {
        var result = await restaurantService.GetByIdAsync(id);
        if (!result.Successful)
        {
            return ToProblem(result.Error);
        }

        return Ok(mapper.Map(result.Value));
    }

    [HttpGet("{restaurantId:guid}/offers")]
    public async Task<IActionResult> GetDailyOffers(Guid restaurantId)
    {
        var result = await offerFetchService.GetDailyOffersAsync(restaurantId);
        if (!result.Successful)
        {
            return ToProblem(result.Error);
        }

        return Content(result.Value ?? "[]", "application/json");
    }

    [HttpPost]
    [Authorize(Policy = AuthorizationPolicies.Admin)]
    public async Task<ActionResult<RestaurantDto>> Create(RestaurantDto input)
    {
        var restaurant = mapper.Map(input);
        if (restaurant == null)
        {
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Invalid Restaurant payload.");
        }

        var result = await restaurantService.CreateAsync(restaurant);
        if (!result.Successful)
        {
            return ToProblem(result.Error);
        }

        var output = mapper.Map(result.Value)!;
        return CreatedAtAction(nameof(GetById), new { version = "1", id = output.Id }, output);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = AuthorizationPolicies.Admin)]
    public async Task<ActionResult<RestaurantDto>> Update(
        Guid id,
        RestaurantDto input,
        [FromHeader(Name = "If-Match")] string? expectedConcurrencyToken)
    {
        var restaurant = mapper.Map(input);
        if (restaurant == null)
        {
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Invalid Restaurant payload.");
        }

        var result = await restaurantService.UpdateAsync(
            id,
            restaurant,
            NormalizeConcurrencyToken(expectedConcurrencyToken));
        if (!result.Successful)
        {
            return ToProblem(result.Error);
        }

        return Ok(mapper.Map(result.Value));
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = AuthorizationPolicies.Admin)]
    public async Task<IActionResult> Delete(
        Guid id,
        [FromHeader(Name = "If-Match")] string? expectedConcurrencyToken)
    {
        var result = await restaurantService.RemoveAsync(id, NormalizeConcurrencyToken(expectedConcurrencyToken));
        if (!result.Successful)
        {
            return ToProblem(result.Error);
        }

        return NoContent();
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
            OfferFetchErrorCodes.MissingOffersResourceUrl => StatusCodes.Status400BadRequest,
            OfferFetchErrorCodes.UnsupportedProviderType => StatusCodes.Status400BadRequest,
            OfferFetchErrorCodes.FetchFailed => StatusCodes.Status502BadGateway,
            OfferFetchErrorCodes.ParseFailed => StatusCodes.Status502BadGateway,
            _ => StatusCodes.Status500InternalServerError
        };

        return Problem(
            statusCode: statusCode,
            title: error?.Code ?? "REQUEST_FAILED",
            detail: error?.Message ?? "The request failed.");
    }
}
