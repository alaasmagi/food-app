using DataAccess.Context;
using Microsoft.EntityFrameworkCore;

namespace Web.Configuration;

public static class DatabaseConfiguration
{
    public static void MigrateDatabases(this WebApplication app)
    {
        using var scope = app.Services.CreateScope();
        scope.ServiceProvider.GetRequiredService<AppDbContext>().Database.Migrate();
        scope.ServiceProvider.GetRequiredService<OfferCacheDbContext>().Database.Migrate();
    }
}
