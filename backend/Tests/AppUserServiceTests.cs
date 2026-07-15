using Application;
using Base.DTO;
using Contracts.Application;
using DataAccess;
using DataAccess.Context;
using Domain;
using DTO.DataAccess;
using DTO.DataAccess.Mappers;

namespace Tests;

public class AppUserServiceTests
{
    [Fact]
    public async Task UpdateAsync_SetOwnEnvironment_Succeeds()
    {
        await using var context = TestAppDbContextFactory.CreateInMemory();
        var actorId = Guid.NewGuid();
        AddUser(context, actorId);
        var environment = AddEnvironment(context, actorId);
        await context.SaveChangesAsync();
        // Detach seeded entities so the service's update can attach a fresh instance by key.
        context.ChangeTracker.Clear();

        var service = CreateService(context, actorId);
        var update = await GetUpdatePayload(context, actorId, environment.Id);

        var result = await service.UpdateAsync(actorId, update.User, update.Token, actorId);

        Assert.True(result.Successful);
        Assert.Equal(environment.Id, result.Value!.NotificationEnvironmentId);
    }

    [Fact]
    public async Task UpdateAsync_SetAnotherUsersEnvironment_ReturnsForbidden()
    {
        await using var context = TestAppDbContextFactory.CreateInMemory();
        var actorId = Guid.NewGuid();
        var otherUserId = Guid.NewGuid();
        AddUser(context, actorId);
        var foreignEnvironment = AddEnvironment(context, otherUserId);
        await context.SaveChangesAsync();
        // Detach seeded entities so the service's update can attach a fresh instance by key.
        context.ChangeTracker.Clear();

        var service = CreateService(context, actorId);
        var update = await GetUpdatePayload(context, actorId, foreignEnvironment.Id);

        var result = await service.UpdateAsync(actorId, update.User, update.Token, actorId);

        Assert.False(result.Successful);
        Assert.Equal(ErrorDefaults.Codes.Forbidden, result.Error!.Code);
    }

    [Fact]
    public async Task UpdateAsync_SetNonexistentEnvironment_ReturnsNotFound()
    {
        await using var context = TestAppDbContextFactory.CreateInMemory();
        var actorId = Guid.NewGuid();
        AddUser(context, actorId);
        await context.SaveChangesAsync();
        // Detach seeded entities so the service's update can attach a fresh instance by key.
        context.ChangeTracker.Clear();

        var service = CreateService(context, actorId);
        var update = await GetUpdatePayload(context, actorId, Guid.NewGuid());

        var result = await service.UpdateAsync(actorId, update.User, update.Token, actorId);

        Assert.False(result.Successful);
        Assert.Equal(ErrorDefaults.Codes.NotFound, result.Error!.Code);
    }

    [Fact]
    public async Task UpdateAsync_ClearEnvironmentToNull_Succeeds()
    {
        await using var context = TestAppDbContextFactory.CreateInMemory();
        var actorId = Guid.NewGuid();
        var environment = AddEnvironment(context, actorId);
        AddUser(context, actorId, notificationEnvironmentId: environment.Id);
        await context.SaveChangesAsync();
        // Detach seeded entities so the service's update can attach a fresh instance by key.
        context.ChangeTracker.Clear();

        var service = CreateService(context, actorId);
        var update = await GetUpdatePayload(context, actorId, notificationEnvironmentId: null);

        var result = await service.UpdateAsync(actorId, update.User, update.Token, actorId);

        Assert.True(result.Successful);
        Assert.Null(result.Value!.NotificationEnvironmentId);
    }

    [Fact]
    public async Task UpdateNotificationPreferencesAsync_OwnEnvironment_UpdatesOnlyNotificationFields()
    {
        await using var context = TestAppDbContextFactory.CreateInMemory();
        var actorId = Guid.NewGuid();
        AddUser(context, actorId);
        var environment = AddEnvironment(context, actorId);
        await context.SaveChangesAsync();
        context.ChangeTracker.Clear();

        var service = CreateService(context, actorId);
        var result = await service.UpdateNotificationPreferencesAsync(actorId, sendNotifications: false, environment.Id);

        Assert.True(result.Successful);
        Assert.False(result.Value!.SendNotifications);
        Assert.Equal(environment.Id, result.Value.NotificationEnvironmentId);
        // Identity-sourced fields are untouched by the self-service preference update.
        Assert.Equal($"{actorId:N}@example.com", result.Value.Email);
        Assert.Equal("Test User", result.Value.FullName);
    }

    [Fact]
    public async Task UpdateNotificationPreferencesAsync_AnotherUsersEnvironment_ReturnsForbidden()
    {
        await using var context = TestAppDbContextFactory.CreateInMemory();
        var actorId = Guid.NewGuid();
        var otherUserId = Guid.NewGuid();
        AddUser(context, actorId);
        var foreignEnvironment = AddEnvironment(context, otherUserId);
        await context.SaveChangesAsync();
        context.ChangeTracker.Clear();

        var service = CreateService(context, actorId);
        var result = await service.UpdateNotificationPreferencesAsync(actorId, sendNotifications: true, foreignEnvironment.Id);

        Assert.False(result.Successful);
        Assert.Equal(ErrorDefaults.Codes.Forbidden, result.Error!.Code);
    }

    [Fact]
    public async Task UpdateNotificationPreferencesAsync_NonexistentEnvironment_ReturnsNotFound()
    {
        await using var context = TestAppDbContextFactory.CreateInMemory();
        var actorId = Guid.NewGuid();
        AddUser(context, actorId);
        await context.SaveChangesAsync();
        context.ChangeTracker.Clear();

        var service = CreateService(context, actorId);
        var result = await service.UpdateNotificationPreferencesAsync(actorId, sendNotifications: true, Guid.NewGuid());

        Assert.False(result.Successful);
        Assert.Equal(ErrorDefaults.Codes.NotFound, result.Error!.Code);
    }

    [Fact]
    public async Task UpdateNotificationPreferencesAsync_ClearToNull_Succeeds()
    {
        await using var context = TestAppDbContextFactory.CreateInMemory();
        var actorId = Guid.NewGuid();
        var environment = AddEnvironment(context, actorId);
        AddUser(context, actorId, notificationEnvironmentId: environment.Id);
        await context.SaveChangesAsync();
        context.ChangeTracker.Clear();

        var service = CreateService(context, actorId);
        var result = await service.UpdateNotificationPreferencesAsync(actorId, sendNotifications: true, notificationEnvironmentId: null);

        Assert.True(result.Successful);
        Assert.Null(result.Value!.NotificationEnvironmentId);
    }

    [Fact]
    public async Task UpdateNotificationPreferencesAsync_MissingActorUser_ReturnsNotFound()
    {
        await using var context = TestAppDbContextFactory.CreateInMemory();
        var actorId = Guid.NewGuid();
        // No AppUser row seeded for the actor.
        var service = CreateService(context, actorId);

        var result = await service.UpdateNotificationPreferencesAsync(actorId, sendNotifications: true, notificationEnvironmentId: null);

        Assert.False(result.Successful);
        Assert.Equal(ErrorDefaults.Codes.NotFound, result.Error!.Code);
    }

    [Fact]
    public async Task UpdateNotificationPreferencesAsync_TargetsActorOnly_LeavesOtherUsersUnchanged()
    {
        await using var context = TestAppDbContextFactory.CreateInMemory();
        var actorId = Guid.NewGuid();
        var otherUserId = Guid.NewGuid();
        AddUser(context, actorId);
        AddUser(context, otherUserId);
        await context.SaveChangesAsync();
        context.ChangeTracker.Clear();

        var service = CreateService(context, actorId);
        var result = await service.UpdateNotificationPreferencesAsync(actorId, sendNotifications: false, notificationEnvironmentId: null);
        Assert.True(result.Successful);

        // The other user's AppUser is untouched (the target is resolved from the actor, not a supplied id).
        var other = await new AppUserRepository(context, new AppUserEntityMapper()).GetByIdAsync(otherUserId);
        Assert.True(other!.SendNotifications);
    }

    private static AppUserService CreateService(AppDbContext context, Guid actorId)
    {
        return new AppUserService(
            new AppUserRepository(context, new AppUserEntityMapper()),
            new DataAccessUow(context),
            new AppUserIdentityMapper(),
            new DiningEnvironmentRepository(context, new DiningEnvironmentEntityMapper()),
            new FakeCurrentActorAccessor(actorId));
    }

    private static async Task<(AppUser User, string Token)> GetUpdatePayload(
        AppDbContext context, Guid userId, Guid? notificationEnvironmentId)
    {
        var current = await new AppUserRepository(context, new AppUserEntityMapper()).GetByIdAsync(userId);
        current!.NotificationEnvironmentId = notificationEnvironmentId;
        return (current, current.ConcurrencyToken);
    }

    private static void AddUser(AppDbContext context, Guid id, Guid? notificationEnvironmentId = null)
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

internal sealed class FakeCurrentActorAccessor(Guid? actorId) : ICurrentActorAccessor
{
    public Guid? TryGetActorId() => actorId;
}
