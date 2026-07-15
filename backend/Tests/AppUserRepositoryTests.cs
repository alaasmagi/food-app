using DataAccess;
using DTO.DataAccess;
using DTO.DataAccess.Mappers;

namespace Tests;

public class AppUserRepositoryTests
{
    [Fact]
    public async Task GetNotificationSubscribersAsync_ReturnsOnlyOptedInUsers()
    {
        await using var context = TestAppDbContextFactory.CreateInMemory();
        context.AppUsers.Add(BuildUser("opted-in-1@example.com", enabled: true));
        context.AppUsers.Add(BuildUser("opted-in-2@example.com", enabled: true));
        context.AppUsers.Add(BuildUser("opted-out@example.com", enabled: false));
        await context.SaveChangesAsync();

        var repository = new AppUserRepository(context, new AppUserEntityMapper());

        var subscribers = await repository.GetNotificationSubscribersAsync();

        Assert.Equal(2, subscribers.Count);
        Assert.All(subscribers, user => Assert.True(user.SendNotifications));
    }

    [Fact]
    public async Task UpsertFromIdentityEventAsync_NewUser_DefaultsToNotSubscribed()
    {
        await using var context = TestAppDbContextFactory.CreateInMemory();
        var repository = new AppUserRepository(context, new AppUserEntityMapper());

        var user = await repository.UpsertFromIdentityEventAsync(
            Guid.NewGuid(), "new@example.com", "new", "New User", "et");

        Assert.False(user.SendNotifications);
    }

    [Fact]
    public async Task UpsertFromIdentityEventAsync_Update_PreservesNotificationPreference()
    {
        await using var context = TestAppDbContextFactory.CreateInMemory();
        var id = Guid.NewGuid();
        context.AppUsers.Add(BuildUser("existing@example.com", enabled: true, id: id));
        await context.SaveChangesAsync();

        var repository = new AppUserRepository(context, new AppUserEntityMapper());

        var updated = await repository.UpsertFromIdentityEventAsync(
            id, "renamed@example.com", "renamed", "Renamed User", "en");

        Assert.Equal("renamed@example.com", updated.Email);
        Assert.True(updated.SendNotifications);
    }

    [Fact]
    public async Task ClearNotificationEnvironmentAsync_NullsReferencingUsers_AndLeavesOthersUnchanged()
    {
        await using var context = TestAppDbContextFactory.CreateInMemory();
        var environmentId = Guid.NewGuid();
        var otherEnvironmentId = Guid.NewGuid();

        var referencing = BuildUser("referencing@example.com", enabled: true);
        referencing.NotificationEnvironmentId = environmentId;
        var otherScope = BuildUser("other-scope@example.com", enabled: true);
        otherScope.NotificationEnvironmentId = otherEnvironmentId;
        var noScope = BuildUser("no-scope@example.com", enabled: true);

        context.AppUsers.AddRange(referencing, otherScope, noScope);
        await context.SaveChangesAsync();

        var repository = new AppUserRepository(context, new AppUserEntityMapper());
        await repository.ClearNotificationEnvironmentAsync(environmentId);

        Assert.Null((await repository.GetByIdAsync(referencing.Id))!.NotificationEnvironmentId);
        Assert.Equal(otherEnvironmentId, (await repository.GetByIdAsync(otherScope.Id))!.NotificationEnvironmentId);
        Assert.Null((await repository.GetByIdAsync(noScope.Id))!.NotificationEnvironmentId);
    }

    private static AppUserEntity BuildUser(string email, bool enabled, Guid? id = null)
    {
        var now = DateTime.UtcNow;
        return new AppUserEntity
        {
            Id = id ?? Guid.NewGuid(),
            Email = email,
            Username = email,
            FullName = "Test User",
            Locale = "et",
            SendNotifications = enabled,
            CreatedBy = "test",
            UpdatedBy = "test",
            CreatedAt = now,
            UpdatedAt = now,
            ConcurrencyToken = Guid.NewGuid().ToString("N")
        };
    }
}
