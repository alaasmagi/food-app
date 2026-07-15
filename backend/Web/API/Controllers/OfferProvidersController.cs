using Asp.Versioning;
using Base.Contracts.DTO;
using Base.DTO;
using Contracts.Application;
using DTO.Web;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.Mvc;
using Web.Configuration;
using IMapper = Base.Contracts.DTO.IMapper<DTO.Web.OfferProviderDto, Domain.OfferProvider>;

namespace Web.API.Controllers;

[ApiController]
[ApiVersion(1.0)]
[EnableRateLimiting(RateLimitPolicies.Api)]
[Route("api/v{version:apiVersion}/offer-providers")]
[Produces("application/json")]
[ApiBearerAuthorize]
public class OfferProvidersController(
    IOfferProviderService offerProviderService,
    IMapper mapper) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<OfferProviderDto>>> GetAll()
    {
        var result = await offerProviderService.GetAllAsync();
        if (!result.Successful)
        {
            return ToProblem(result.Error);
        }

        return Ok(mapper.Map(result.Value)?.ToList() ?? []);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<OfferProviderDto>> GetById(Guid id)
    {
        var result = await offerProviderService.GetByIdAsync(id);
        if (!result.Successful)
        {
            return ToProblem(result.Error);
        }

        return Ok(mapper.Map(result.Value));
    }

    [HttpPost]
    [Authorize(Policy = AuthorizationPolicies.Admin)]
    public async Task<ActionResult<OfferProviderDto>> Create(OfferProviderDto input)
    {
        var offerProvider = mapper.Map(input);
        if (offerProvider == null)
        {
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Invalid OfferProvider payload.");
        }

        var result = await offerProviderService.CreateAsync(offerProvider);
        if (!result.Successful)
        {
            return ToProblem(result.Error);
        }

        var output = mapper.Map(result.Value)!;
        return CreatedAtAction(nameof(GetById), new { version = "1", id = output.Id }, output);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = AuthorizationPolicies.Admin)]
    public async Task<ActionResult<OfferProviderDto>> Update(
        Guid id,
        OfferProviderDto input,
        [FromHeader(Name = "If-Match")] string? expectedConcurrencyToken)
    {
        var offerProvider = mapper.Map(input);
        if (offerProvider == null)
        {
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Invalid OfferProvider payload.");
        }

        var result = await offerProviderService.UpdateAsync(
            id,
            offerProvider,
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
        var result = await offerProviderService.RemoveAsync(id, NormalizeConcurrencyToken(expectedConcurrencyToken));
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
            _ => StatusCodes.Status500InternalServerError
        };

        return Problem(
            statusCode: statusCode,
            title: error?.Code ?? "REQUEST_FAILED",
            detail: error?.Message ?? "The request failed.");
    }
}
