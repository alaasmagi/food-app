using System.Threading.RateLimiting;
using Asp.Versioning;
using Microsoft.AspNetCore.RateLimiting;

namespace Web.Configuration;

public static class ApiConfiguration
{
    public static void AddApiInfrastructure(this IServiceCollection services)
    {
        var apiRateLimitOptions = RequiredConfiguration.ApiRateLimitOptions();
        var publicApiRateLimitOptions = RequiredConfiguration.PublicApiRateLimitOptions();

        services.AddHealthChecks();
        services.AddEndpointsApiExplorer();
        services.AddSwaggerGen();
        services
            .AddApiVersioning(options =>
            {
                options.DefaultApiVersion = new ApiVersion(1, 0);
                options.AssumeDefaultVersionWhenUnspecified = true;
                options.ReportApiVersions = true;
            })
            .AddMvc()
            .AddApiExplorer(options =>
            {
                options.GroupNameFormat = "'v'VVV";
                options.SubstituteApiVersionInUrl = true;
            });
        services.AddRateLimiter(options =>
        {
            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
            options.AddFixedWindowLimiter(RateLimitPolicies.Api, limiterOptions =>
            {
                limiterOptions.PermitLimit = apiRateLimitOptions.PermitLimit;
                limiterOptions.Window = TimeSpan.FromSeconds(apiRateLimitOptions.WindowSeconds);
                limiterOptions.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
                limiterOptions.QueueLimit = apiRateLimitOptions.QueueLimit;
            });
            // Partitioned by client IP (UseForwardedHeaders runs before UseRateLimiter) so one caller
            // cannot exhaust the anonymous public window for everyone.
            options.AddPolicy(RateLimitPolicies.PublicApi, httpContext =>
                RateLimitPartition.GetFixedWindowLimiter(
                    partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                    factory: _ => new FixedWindowRateLimiterOptions
                    {
                        PermitLimit = publicApiRateLimitOptions.PermitLimit,
                        Window = TimeSpan.FromSeconds(publicApiRateLimitOptions.WindowSeconds),
                        QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                        QueueLimit = publicApiRateLimitOptions.QueueLimit,
                    }));
        });
    }
}
