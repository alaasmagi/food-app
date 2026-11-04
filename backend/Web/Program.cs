using Web.Configuration;

DotEnvConfiguration.LoadFromRepositoryRoot();
DotEnvConfiguration.ConfigureAspNetCoreUrls();

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddApiInfrastructure();
builder.ConfigureApplicationServices();

var app = builder.Build();

app.MigrateDatabases();

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
