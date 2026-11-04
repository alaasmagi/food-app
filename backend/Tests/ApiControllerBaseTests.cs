using Base.Contracts.DTO;
using Base.DTO;
using Contracts.Application;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Infrastructure;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using Web.API.Controllers;

namespace Tests;

public class ApiControllerBaseTests
{
    [Theory]
    [InlineData(ErrorDefaults.Codes.NotFound, StatusCodes.Status404NotFound)]
    [InlineData(ErrorDefaults.Codes.Forbidden, StatusCodes.Status403Forbidden)]
    [InlineData(ErrorDefaults.Codes.ConcurrencyConflict, StatusCodes.Status409Conflict)]
    [InlineData(ErrorDefaults.Codes.ConcurrencyTokenRequired, StatusCodes.Status428PreconditionRequired)]
    [InlineData(ErrorDefaults.Codes.InvalidPaging, StatusCodes.Status400BadRequest)]
    [InlineData(ErrorDefaults.Codes.MapFailed, StatusCodes.Status400BadRequest)]
    [InlineData("SOMETHING_ELSE", StatusCodes.Status500InternalServerError)]
    public void ToProblem_MapsDefaultCodes(string code, int expectedStatus)
    {
        var result = CreateController().Map(new Error(code, "message"));

        var problem = Assert.IsType<ProblemDetails>(result.Value);
        Assert.Equal(expectedStatus, result.StatusCode);
        Assert.Equal(code, problem.Title);
        Assert.Equal("message", problem.Detail);
    }

    [Fact]
    public void ToProblem_UsesControllerSpecificCodes()
    {
        var controller = CreateController(new Dictionary<string, int> { ["FEATURE_CODE"] = StatusCodes.Status502BadGateway });

        Assert.Equal(StatusCodes.Status502BadGateway, controller.Map(new Error("FEATURE_CODE", "m")).StatusCode);
        Assert.Equal(StatusCodes.Status404NotFound, controller.Map(new Error(ErrorDefaults.Codes.NotFound, "m")).StatusCode);
    }

    [Fact]
    public void ToProblem_NullError_IsGeneric500()
    {
        var result = CreateController().Map(null);

        var problem = Assert.IsType<ProblemDetails>(result.Value);
        Assert.Equal(StatusCodes.Status500InternalServerError, result.StatusCode);
        Assert.Equal("REQUEST_FAILED", problem.Title);
        Assert.Equal("The request failed.", problem.Detail);
    }

    [Theory]
    [InlineData(null, null)]
    [InlineData("  ", null)]
    [InlineData("\"abc\"", "abc")]
    [InlineData(" abc ", "abc")]
    public void NormalizeConcurrencyToken_TrimsWhitespaceAndQuotes(string? raw, string? expected)
    {
        Assert.Equal(expected, TestController.Normalize(raw));
    }

    [Fact]
    public void TryGetActorId_WithActor_ReturnsIt()
    {
        var actorId = Guid.NewGuid();

        var ok = CreateController().Actor(new FakeCurrentActorAccessor(actorId), out var resolved, out _);

        Assert.True(ok);
        Assert.Equal(actorId, resolved);
    }

    [Fact]
    public void TryGetActorId_WithoutActor_ReturnsUnauthorized()
    {
        var ok = CreateController().Actor(new FakeCurrentActorAccessor(null), out _, out var unauthorized);

        Assert.False(ok);
        Assert.IsType<UnauthorizedResult>(unauthorized);
    }

    private static TestController CreateController(IReadOnlyDictionary<string, int>? errorStatusCodes = null)
    {
        return new TestController(errorStatusCodes)
        {
            ProblemDetailsFactory = new FakeProblemDetailsFactory(),
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() }
        };
    }

    private class TestController(IReadOnlyDictionary<string, int>? errorStatusCodes) : ApiControllerBase
    {
        protected override IReadOnlyDictionary<string, int> ErrorStatusCodes =>
            errorStatusCodes ?? base.ErrorStatusCodes;

        public ObjectResult Map(IError? error) => ToProblem(error);

        public static string? Normalize(string? value) => NormalizeConcurrencyToken(value);

        public bool Actor(ICurrentActorAccessor accessor, out Guid actorId, out ActionResult unauthorized) =>
            TryGetActorId(accessor, out actorId, out unauthorized);
    }

    private class FakeProblemDetailsFactory : ProblemDetailsFactory
    {
        public override ProblemDetails CreateProblemDetails(
            HttpContext httpContext,
            int? statusCode = null,
            string? title = null,
            string? type = null,
            string? detail = null,
            string? instance = null)
        {
            return new ProblemDetails { Status = statusCode, Title = title, Detail = detail };
        }

        public override ValidationProblemDetails CreateValidationProblemDetails(
            HttpContext httpContext,
            ModelStateDictionary modelStateDictionary,
            int? statusCode = null,
            string? title = null,
            string? type = null,
            string? detail = null,
            string? instance = null)
        {
            return new ValidationProblemDetails(modelStateDictionary) { Status = statusCode };
        }
    }
}
