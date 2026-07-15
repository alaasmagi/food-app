using Application;
using DataAccess;
using DataAccess.Context;
using DTO.DataAccess;
using DTO.DataAccess.Mappers;

namespace Tests;

public class DiningEnvironmentServiceTests
{
    [Fact]
    public async Task RemoveAsync_ReferencedByNotificationScope_ClearsScopeAndDeletes()
    {
        await using var context = TestAppDbContextFactory.CreateInMemory();
        var actorId = Guid.NewGuid();
        var environment = AddEnvironment(context, actorId);
        AddUser(context, actorId, notificationEnvironmentId: environment.Id);
        await context.SaveChangesAsync();

        var service = CreateService(context);
        var result = await service.RemoveAsync(environment.Id, environment.ConcurrencyToken, actorId);

        Assert.True(result.Successful);
        Assert.True(result.Value);

        var user = await new AppUserRepository(context, new AppUserEntityMapper()).GetByIdAsync(actorId);
        Assert.Null(user!.NotificationEnvironmentId);
    }

    [Fact]
    public async Task RemoveAsync_NotReferenced_LeavesOtherUsersScopeUnchanged()
    {
        await using var context = TestAppDbContextFactory.CreateInMemory();
        var actorId = Guid.NewGuid();
        var deletedEnvironment = AddEnvironment(context, actorId);
        var otherEnvironment = AddEnvironment(context, actorId);
        // A different user keeps their scope pointed at an unrelated environment.
        var otherUserId = Guid.NewGuid();
        AddUser(context, otherUserId, notificationEnvironmentId: otherEnvironment.Id);
        await context.SaveChangesAsync();

        var service = CreateService(context);
        var result = await service.RemoveAsync(deletedEnvironment.Id, deletedEnvironment.ConcurrencyToken, actorId);

        Assert.True(result.Successful);

        var otherUser = await new AppUserRepository(context, new AppUserEntityMapper()).GetByIdAsync(otherUserId);
        Assert.Equal(otherEnvironment.Id, otherUser!.NotificationEnvironmentId);
    }

    private static DiningEnvironmentService CreateService(AppDbContext context)
    {
        return new DiningEnvironmentService(
            new DiningEnvironmentRepository(context, new DiningEnvironmentEntityMapper()),
            new AppUserRepository(context, new AppUserEntityMapper()),
            new DataAccessUow(context),
            new DiningEnvironmentIdentityMapper());
    }

    private static void AddUser(AppDbContext context, Guid id, Guid? notificationEnvironmentId)
    {
        var now = DateTime.UtcNow;
        context.AppUsers.Add(new AppUserEntity
        {
            Id = id,
            Email = $"{id:N}@example.com",
            Username = id.ToString("N"),
            FullName = "Test User",
            Locale = "et",
            SendNotifications = true,
            NotificationEnvironmentId = notificationEnvironmentId,
            CreatedBy = "test",
            UpdatedBy = "test",
            CreatedAt = now,
            UpdatedAt = now,
            ConcurrencyToken = Guid.NewGuid().ToString("N")
        });
    }

    private static DiningEnvironmentEntity AddEnvironment(AppDbContext context, Guid userId)
    {
        var now = DateTime.UtcNow;
        var environment = new DiningEnvironmentEntity
        {
            Id = Guid.NewGuid(),
            Name = "Env",
            UserId = userId,
            CreatedBy = "test",
            UpdatedBy = "test",
            CreatedAt = now,
            UpdatedAt = now,
            ConcurrencyToken = Guid.NewGuid().ToString("N")
        };
        context.DiningEnvironments.Add(environment);
        return environment;
    }
}
