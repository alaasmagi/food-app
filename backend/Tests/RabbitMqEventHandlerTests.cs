using System.Text.Json;
using Base.Contracts.DTO;
using Base.Message;
using Contracts.DataAccess;
using DataAccess;
using DataAccess.Context;
using Domain;
using DTO.DataAccess;
using DTO.DataAccess.Mappers;
using External.RabbitMQ;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;

namespace Tests;

public class RabbitMqEventHandlerTests
{
    [Fact]
    public async Task UserCreated_CreatesUser_WithExactEventUserId()
    {
        await using var context = TestAppDbContextFactory.CreateInMemory();
        var handler = BuildHandler(context);
        var userId = Guid.Parse("1b9dc316-98d7-488f-8614-6d275497d0b9");

        await handler.HandleAsync(
            UserEvent("user.created", userId, email: "user@example.com", username: "testUser", fullName: "testFullName", locale: "et"),
            CancellationToken.None);

        var created = await context.AppUsers.SingleAsync();
        Assert.Equal(userId, created.Id);
        Assert.Equal("user@example.com", created.Email);
        Assert.Equal("testUser", created.Username);
        Assert.Equal("testFullName", created.FullName);
        Assert.Equal("et", created.Locale);
    }

    [Fact]
    public async Task UserUpdated_UpdatesExistingUser_MatchedByUserId()
    {
        await using var context = TestAppDbContextFactory.CreateInMemory();
        var userId = Guid.Parse("1b9dc316-98d7-488f-8614-6d275497d0b9");
        context.AppUsers.Add(BuildExistingUser(userId, "old@example.com"));
        await context.SaveChangesAsync();

        var handler = BuildHandler(context);

        await handler.HandleAsync(
            UserEvent("user.updated", userId, email: "user@example.com", username: "testUser", fullName: "testFullName", locale: "et"),
            CancellationToken.None);

        var updated = await context.AppUsers.SingleAsync();
        Assert.Equal(userId, updated.Id);
        Assert.Equal("user@example.com", updated.Email);
    }

    [Fact]
    public async Task UserDeleted_RemovesUser_MatchedByUserId()
    {
        await using var context = TestAppDbContextFactory.CreateInMemory();
        var deletedId = Guid.Parse("65d43b2d-2f0d-4eaa-8a40-a3f6c2698bbf");
        var keptId = Guid.NewGuid();
        context.AppUsers.Add(BuildExistingUser(deletedId, "deleted@example.com"));
        context.AppUsers.Add(BuildExistingUser(keptId, "kept@example.com"));
        await context.SaveChangesAsync();

        var handler = BuildHandler(context);

        // user.deleted carries only the userId in its content.
        await handler.HandleAsync(UserEvent("user.deleted", deletedId), CancellationToken.None);

        var remaining = await context.AppUsers.SingleAsync();
        Assert.Equal(keptId, remaining.Id);
    }

    [Fact]
    public async Task NonIdentitySource_IsIgnored()
    {
        await using var context = TestAppDbContextFactory.CreateInMemory();
        var handler = BuildHandler(context);

        var envelope = new BaseEventEnvelope<JsonElement>
        {
            Type = DefaultMessageTypes.User,
            Source = "food", // not an "identity." source
            Action = DefaultMessageActions.UserCreated,
            Timestamp = DateTime.UtcNow,
            Content = JsonSerializer.SerializeToElement(new { userId = Guid.NewGuid().ToString() })
        };

        await handler.HandleAsync(envelope, CancellationToken.None);

        Assert.False(await context.AppUsers.AnyAsync());
    }

    private static RabbitMqEventHandler BuildHandler(AppDbContext context)
    {
        var services = new ServiceCollection();
        services.AddSingleton(context);
        services.AddSingleton<IMapper<AppUser, AppUserEntity>, AppUserEntityMapper>();
        services.AddScoped<IAppUserRepository, AppUserRepository>();
        var provider = services.BuildServiceProvider();

        return new RabbitMqEventHandler(
            provider.GetRequiredService<IServiceScopeFactory>(),
            NullLogger<RabbitMqEventHandler>.Instance);
    }

    private static BaseEventEnvelope<JsonElement> UserEvent(
        string action,
        Guid userId,
        string? email = null,
        string? username = null,
        string? fullName = null,
        string? locale = null)
    {
        object content = email is null
            ? new { userId = userId.ToString() }
            : new { userId = userId.ToString(), email, username, fullName, locale };

        return new BaseEventEnvelope<JsonElement>
        {
            Type = DefaultMessageTypes.User,
            Source = "identity.food-app",
            Action = action,
            Timestamp = DateTime.UtcNow,
            Content = JsonSerializer.SerializeToElement(content)
        };
    }

    private static AppUserEntity BuildExistingUser(Guid id, string email)
    {
        var now = DateTime.UtcNow;
        return new AppUserEntity
        {
            Id = id,
            Email = email,
            Username = email,
            FullName = "Existing User",
            Locale = "et",
            SendNotifications = true,
            CreatedBy = "test",
            UpdatedBy = "test",
            CreatedAt = now,
            UpdatedAt = now,
            ConcurrencyToken = Guid.NewGuid().ToString("N")
        };
    }
}
