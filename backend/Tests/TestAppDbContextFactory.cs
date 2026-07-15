using DataAccess.Context;
using Microsoft.EntityFrameworkCore;

namespace Tests;

internal static class TestAppDbContextFactory
{
    public static AppDbContext CreateInMemory()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"app-tests-{Guid.NewGuid():N}")
            .EnableSensitiveDataLogging()
            .Options;

        return new AppDbContext(options);
    }
}
