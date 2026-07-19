using Asp.Versioning;
using DataAccess.Context;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using System.Threading.RateLimiting;
using Web.Configuration;

DotEnvConfiguration.LoadFromRepositoryRoot();
DotEnvConfiguration.ConfigureAspNetCoreUrls();

var builder = WebApplication.CreateBuilder(args);
var apiRateLimitOptions = RequiredConfiguration.ApiRateLimitOptions();
var publicApiRateLimitOptions = RequiredConfiguration.PublicApiRateLimitOptions();

builder.Services.AddHealthChecks();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services
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
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddFixedWindowLimiter(RateLimitPolicies.Api, limiterOptions =>
    {
        limiterOptions.PermitLimit = apiRateLimitOptions.PermitLimit;
        limiterOptions.Window = TimeSpan.FromSeconds(apiRateLimitOptions.WindowSeconds);
        limiterOptions.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        limiterOptions.QueueLimit = apiRateLimitOptions.QueueLimit;
    });
    // Unauthenticated public read surface: partition the fixed window by client IP (UseForwardedHeaders
    // runs before UseRateLimiter, so RemoteIpAddress reflects the real client) so one caller cannot
    // exhaust the window for everyone.
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
builder.ConfigureApplicationServices();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    scope.ServiceProvider.GetRequiredService<AppDbContext>().Database.Migrate();
    scope.ServiceProvider.GetRequiredService<OfferCacheDbContext>().Database.Migrate();
}

app.UseForwardedHeaders();

if (app.Environment.IsDevelopment())
{
    app.UseMigrationsEndPoint();
}
else
{
    app.UseExceptionHandler("/Home/Error");
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseRouting();

app.UseSwagger();
app.UseSwaggerUI(options =>
{
    options.SwaggerEndpoint("/swagger/v1/swagger.json", "Alaasmagi Dotnet Template API v1");
});

// CORS must run before the rate limiter: a rate-limited (429) response short-circuits the pipeline,
// so if UseCors ran later the 429 would lack Access-Control-Allow-Origin and the browser would
// surface it as an opaque CORS error instead of a handleable 429.
app.UseCors(CorsPolicies.Frontend);

app.UseRateLimiter();

app.UseAuthentication();
app.UseAuthorization();

app.MapStaticAssets();
app.MapHealthChecks("/health").AllowAnonymous();

app.MapControllerRoute(
        name: "areas",
        pattern: "{area:exists}/{controller=Home}/{action=Index}/{id?}")
    .WithStaticAssets();

app.MapControllerRoute(
        name: "default",
        pattern: "{controller=Home}/{action=Index}/{id?}")
    .WithStaticAssets();

app.Run();
