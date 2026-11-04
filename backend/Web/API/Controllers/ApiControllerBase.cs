using Base.Contracts.DTO;
using Base.DTO;
using Contracts.Application;
using Microsoft.AspNetCore.Mvc;

namespace Web.API.Controllers;

/// <summary>
/// Shared error mapping and request helpers for the API controllers.
/// </summary>
public abstract class ApiControllerBase : ControllerBase
{
    private static readonly IReadOnlyDictionary<string, int> DefaultErrorStatusCodes = new Dictionary<string, int>
    {
        [ErrorDefaults.Codes.NotFound] = StatusCodes.Status404NotFound,
        [ErrorDefaults.Codes.Forbidden] = StatusCodes.Status403Forbidden,
        [ErrorDefaults.Codes.ConcurrencyConflict] = StatusCodes.Status409Conflict,
        [ErrorDefaults.Codes.ConcurrencyTokenRequired] = StatusCodes.Status428PreconditionRequired,
        [ErrorDefaults.Codes.InvalidPaging] = StatusCodes.Status400BadRequest,
        [ErrorDefaults.Codes.MapFailed] = StatusCodes.Status400BadRequest,
    };

    private static readonly IReadOnlyDictionary<string, int> NoErrorStatusCodes = new Dictionary<string, int>();

    // Feature error codes a controller maps on top of the defaults; anything unmapped is a 500.
    protected virtual IReadOnlyDictionary<string, int> ErrorStatusCodes => NoErrorStatusCodes;

    protected ObjectResult ToProblem(IError? error)
    {
        var code = error?.Code;
        var statusCode = code != null &&
                         (ErrorStatusCodes.TryGetValue(code, out var mapped) ||
                          DefaultErrorStatusCodes.TryGetValue(code, out mapped))
            ? mapped
            : StatusCodes.Status500InternalServerError;

        return Problem(
            statusCode: statusCode,
            title: code ?? "REQUEST_FAILED",
            detail: error?.Message ?? "The request failed.");
    }

    protected static string? NormalizeConcurrencyToken(string? value)
    {
        return string.IsNullOrWhiteSpace(value)
            ? null
            : value.Trim().Trim('"');
    }

    protected bool TryGetActorId(
        ICurrentActorAccessor currentActorAccessor,
        out Guid actorId,
        out ActionResult unauthorizedResult)
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
}
