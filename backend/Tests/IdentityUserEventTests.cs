using System.Text.Json;
using Base.Contracts.Message;
using Base.Message;
using Contracts.DataAccess;
using DataAccess;
using DataAccess.Context;
using DTO.DataAccess;
using DTO.DataAccess.Mappers;
using External.RabbitMQ;
using Microsoft.EntityFrameworkCore;

namespace Tests;

public class IdentityUserProjectionTests
{
    private static IdentityUserProjection Build(AppDbContext context)
        => new(context, new AppUserRepository(context, new AppUserEntityMapper()));

    private static IdentityUserData Data(Guid userId, string email = "user@example.com")
        => new(userId, email, "testUser", "Test User", "et");

    [Fact]
    public async Task Created_CreatesEnabledUnsubscribedUser()
    {
        await using var context = TestAppDbContextFactory.CreateInMemory();
        var userId = Guid.NewGuid();

        var outcome = await Build(context).ApplyAsync(
            Guid.NewGuid(), "identity-hub", IdentityUserActions.Created, Data(userId));

        Assert.Equal(IdentityUserEventOutcome.Applied, outcome);
        var user = await context.AppUsers.SingleAsync();
        Assert.Equal(userId, user.Id);
        Assert.True(user.IsEnabled);
        Assert.False(user.SendNotifications);
    }

    [Fact]
    public async Task Disabled_TurnsOffEnabled_PreservingSubscription()
    {
        await using var context = TestAppDbContextFactory.CreateInMemory();
        var userId = Guid.NewGuid();
        await Build(context).ApplyAsync(Guid.NewGuid(), "identity-hub", IdentityUserActions.Created, Data(userId));

        // Simulate the user opting in to notifications (a product preference).
        var stored = await context.AppUsers.SingleAsync();
        stored.SendNotifications = true;
        await context.SaveChangesAsync();

        await Build(context).ApplyAsync(Guid.NewGuid(), "identity-hub", IdentityUserActions.Disabled, Data(userId));

        var user = await context.AppUsers.SingleAsync();
        Assert.False(user.IsEnabled);
        Assert.True(user.SendNotifications);
    }

    [Fact]
    public async Task Updated_PreservesEnabledState()
    {
        await using var context = TestAppDbContextFactory.CreateInMemory();
        var userId = Guid.NewGuid();
        await Build(context).ApplyAsync(Guid.NewGuid(), "identity-hub", IdentityUserActions.Disabled, Data(userId));

        await Build(context).ApplyAsync(
            Guid.NewGuid(), "identity-hub", IdentityUserActions.Updated, Data(userId, "new@example.com"));

        var user = await context.AppUsers.SingleAsync();
        Assert.Equal("new@example.com", user.Email);
        Assert.False(user.IsEnabled); // user-updated carries no enabled state, so it is preserved.
    }

    [Fact]
    public async Task Deleted_RemovesUser()
    {
        await using var context = TestAppDbContextFactory.CreateInMemory();
        var userId = Guid.NewGuid();
        await Build(context).ApplyAsync(Guid.NewGuid(), "identity-hub", IdentityUserActions.Created, Data(userId));

        var outcome = await Build(context).ApplyAsync(
            Guid.NewGuid(), "identity-hub", IdentityUserActions.Deleted, Data(userId));

        Assert.Equal(IdentityUserEventOutcome.Applied, outcome);
        Assert.False(await context.AppUsers.AnyAsync());
    }

    [Fact]
    public async Task DuplicateEnvelopeId_IsAppliedOnlyOnce()
    {
        await using var context = TestAppDbContextFactory.CreateInMemory();
        var userId = Guid.NewGuid();
        var envelopeId = Guid.NewGuid();
        var projection = Build(context);

        var first = await projection.ApplyAsync(envelopeId, "identity-hub", IdentityUserActions.Created, Data(userId));
        // A redelivery with the same id but a stale email must not overwrite.
        var second = await projection.ApplyAsync(
            envelopeId, "identity-hub", IdentityUserActions.Updated, Data(userId, "stale@example.com"));

        Assert.Equal(IdentityUserEventOutcome.Applied, first);
        Assert.Equal(IdentityUserEventOutcome.Duplicate, second);
        var user = await context.AppUsers.SingleAsync();
        Assert.Equal("user@example.com", user.Email);
    }
}

public class IdentityUserEventValidatorTests
{
    private static BaseEventEnvelope<JsonElement> Envelope(
        string source = "identity-hub",
        string tenant = "food-app",
        string action = "user-created",
        string contentVersion = "1.0",
        string? id = null)
        => new()
        {
            Id = id ?? Guid.NewGuid().ToString(),
            Source = source,
            Tenant = tenant,
            Action = action,
            Timestamp = "2026-07-08T12:44:37.408Z",
            ContentVersion = contentVersion,
            Content = JsonSerializer.SerializeToElement(new { })
        };

    [Fact]
    public void Valid_ReturnsTrue_WithParsedId()
    {
        var id = Guid.NewGuid();
        var ok = IdentityUserEventValidator.TryValidate(
            Envelope(id: id.ToString()), "identity-hub.food-app.user-created", out var parsed, out var reason);

        Assert.True(ok);
        Assert.Null(reason);
        Assert.Equal(id, parsed);
    }

    [Fact]
    public void MinorVersionBump_IsCompatible()
    {
        var ok = IdentityUserEventValidator.TryValidate(
            Envelope(contentVersion: "1.7"), "identity-hub.food-app.user-created", out _, out _);
        Assert.True(ok);
    }

    [Fact]
    public void RoutingKeySourceMismatch_IsRejected()
    {
        // Key says identity-hub but the body claims a different source.
        var ok = IdentityUserEventValidator.TryValidate(
            Envelope(source: "evil"), "identity-hub.food-app.user-created", out _, out var reason);
        Assert.False(ok);
        Assert.Contains("source", reason);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void MissingTenant_IsRejected(string tenant)
    {
        var ok = IdentityUserEventValidator.TryValidate(
            Envelope(tenant: tenant), "identity-hub.food-app.user-created", out _, out _);
        Assert.False(ok);
    }

    [Fact]
    public void UnsupportedMajorVersion_IsRejected()
    {
        var ok = IdentityUserEventValidator.TryValidate(
            Envelope(contentVersion: "2.0"), "identity-hub.food-app.user-created", out _, out _);
        Assert.False(ok);
    }

    [Fact]
    public void NonUuidId_IsRejected()
    {
        var ok = IdentityUserEventValidator.TryValidate(
            Envelope(id: "not-a-uuid"), "identity-hub.food-app.user-created", out _, out _);
        Assert.False(ok);
    }
}
