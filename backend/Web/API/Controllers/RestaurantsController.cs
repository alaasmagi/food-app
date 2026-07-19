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
[ApiBearerAuthorize]
public class RestaurantsController(
    IRestaurantService restaurantService,
    IOfferFetchService offerFetchService,
    IMapper mapper) : ControllerBase
{
    // Default cap when the client omits `limit` on a bounded query. Keeps a zoomed-out viewport from
    // returning the whole catalog; the client shows a "zoom in to see more" hint once the cap is hit.
    private const int DefaultBoundsLimit = 250;

    /// <summary>
    /// Lists restaurants. With no query params, returns the full catalog (used by the wheel, environments
    /// and the "add restaurants" picker). When a full bounding box (minLat/minLon/maxLat/maxLon) is
    /// supplied, returns only the restaurants inside it, capped at <paramref name="limit"/> — this is the
    /// map/viewport path. Supplying only some of the four bounds is a 400.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<RestaurantDto>>> GetAll(
        [FromQuery] double? minLat,
        [FromQuery] double? minLon,
        [FromQuery] double? maxLat,
        [FromQuery] double? maxLon,
        [FromQuery] int? limit)
    {
        var boundsProvided = new[] { minLat, minLon, maxLat, maxLon };
        var providedCount = boundsProvided.Count(value => value.HasValue);

        if (providedCount is not (0 or 4))
        {
            return Problem(
                statusCode: StatusCodes.Status400BadRequest,
                title: "Invalid bounds",
                detail: "Provide all of minLat, minLon, maxLat and maxLon together, or none.");
        }

        if (providedCount == 4)
        {
            if (minLat > maxLat || minLon > maxLon)
            {
                return Problem(
                    statusCode: StatusCodes.Status400BadRequest,
                    title: "Invalid bounds",
                    detail: "minLat/minLon must be less than or equal to maxLat/maxLon.");
            }

            var boundedResult = await restaurantService.GetInBoundsAsync(
                minLat!.Value,
                minLon!.Value,
                maxLat!.Value,
                maxLon!.Value,
                limit ?? DefaultBoundsLimit);
            if (!boundedResult.Successful)
            {
                return ToProblem(boundedResult.Error);
            }

            return Ok(mapper.Map(boundedResult.Value)?.ToList() ?? []);
        }

        var result = await restaurantService.GetAllAsync();
        if (!result.Successful)
        {
            return ToProblem(result.Error);
        }

        return Ok(mapper.Map(result.Value)?.ToList() ?? []);
    }

    /// <summary>
    /// A single page of restaurants for the list view, optionally filtered by a case-insensitive search
    /// on name or city. Returns items plus the total match count so the client can paginate without
    /// fetching the whole catalog. An out-of-range page yields 400 (INVALID_PAGING).
    /// </summary>
    [HttpGet("page")]
    public async Task<ActionResult<RestaurantPageDto>> GetPage(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null)
    {
        var result = await restaurantService.SearchPageAsync(search, page, pageSize);
        if (!result.Successful)
        {
            return ToProblem(result.Error);
        }

        var value = result.Value!;
        return Ok(new RestaurantPageDto
        {
            Items = mapper.Map(value.Items)?.ToList() ?? [],
            Total = value.Total,
            Page = value.Page,
            PageSize = value.PageSize,
        });
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
