using System.Text.Json;
using Base.Keycloak.Events;
using Base.Message;
using Contracts.DataAccess;
using DataAccess;
using DataAccess.Context;
using DTO.DataAccess.Mappers;
using External.RabbitMQ;
using Microsoft.EntityFrameworkCore;

namespace Tests;

// Feeds the platform's exact identity-event payloads (source "identity", compound tenant
// "realmName/appName", nanosecond timestamp) through the same validate -> extract -> project path the
// consumer uses, proving the wiring accepts them.
public class IdentityEventContractCompatibilityTests
{
    private const string UserId = "1b9dc316-98d7-488f-8614-6d275497d0b9";

    private static string UserEvent(string action, string userId = UserId) => $$"""
    {
        "id": "2b9dc316-98d7-488f-8614-6d275497d0b9",
        "source": "identity",
        "tenant": "realmName/appName",
        "action": "{{action}}",
        "timestamp": "2026-07-08T12:44:37.408804148Z",
        "contentVersion": "1.0",
        "content": {
            "userId": "{{userId}}",
            "email": "user@example.com",
            "username": "testUser",
            "fullName": "testFullName",
            "locale": "et"
        }
    }
    """;

    private const string UserDeletedJson = """
    {
        "id": "2b9dc316-98d7-488f-8614-6d275497d0b9",
        "source": "identity",
        "tenant": "realmName/appName",
        "action": "user-deleted",
        "timestamp": "2026-07-08T12:44:37.408804148Z",
        "contentVersion": "1.0",
        "content": { "userId": "65d43b2d-2f0d-4eaa-8a40-a3f6c2698bbf" }
    }
    """;

    [Theory]
    [InlineData("user-created")]
    [InlineData("user-updated")]
    [InlineData("user-enabled")]
    [InlineData("user-disabled")]
    public async Task UserProfileEvents_ValidateAndProject(string action)
    {
        await using var context = TestAppDbContextFactory.CreateInMemory();

        var outcome = await ProcessAsync(context, UserEvent(action));

        Assert.Equal(IdentityUserEventOutcome.Applied, outcome);
        var user = await context.AppUsers.SingleAsync();
        Assert.Equal(Guid.Parse(UserId), user.Id);
        Assert.Equal("user@example.com", user.Email);
        // user-disabled must land the recipient disabled; the other three leave it enabled.
        Assert.Equal(action != "user-disabled", user.IsEnabled);
    }

    [Fact]
    public async Task UserDeleted_RemovesRecipient()
    {
        await using var context = TestAppDbContextFactory.CreateInMemory();
        // Seed the recipient directly (a real create would arrive with its own distinct envelope id).
        await new AppUserRepository(context, new AppUserEntityMapper()).UpsertFromIdentityEventAsync(
            Guid.Parse("65d43b2d-2f0d-4eaa-8a40-a3f6c2698bbf"),
            "user@example.com", "testUser", "testFullName", "et", isEnabled: true);

        var outcome = await ProcessAsync(context, UserDeletedJson);

        Assert.Equal(IdentityUserEventOutcome.Applied, outcome);
        Assert.False(await context.AppUsers.AnyAsync());
    }

    [Fact]
    public async Task EmailUserEvent_OnThisQueue_IsAckedWithoutProjecting()
    {
        // user-verify is an email-hub action, not one this service projects. If one ever landed on the
        // users queue it must be validated-and-ignored (acked), never dead-lettered.
        const string userVerifyJson = """
        {
            "id": "2b9dc316-98d7-488f-8614-6d275497d0b9",
            "source": "identity",
            "tenant": "realmName/appName",
            "action": "user-verify",
            "timestamp": "2026-07-08T12:44:37.408804148Z",
            "contentVersion": "1.0",
            "content": {
                "userId": "1b9dc316-98d7-488f-8614-6d275497d0b9",
                "email": "user@example.com",
                "fullName": "testFullName",
                "actionLink": "https://identity.example.com/realms/my-realm/login-actions/action-token?key=x",
                "expiresAt": "2026-07-02T20:50:00Z",
                "validForMinutes": 10,
                "locale": "et"
            }
        }
        """;

        await using var context = TestAppDbContextFactory.CreateInMemory();

        var outcome = await ProcessAsync(context, userVerifyJson);

        Assert.Equal(IdentityUserEventOutcome.Ignored, outcome);
        Assert.False(await context.AppUsers.AnyAsync());
    }

    // Mirrors IdentityUserEventConsumer.HandleAsync without the AMQP channel: deserialize the envelope,
    // validate against the actual routing key, extract the user content, and project.
    private static async Task<IdentityUserEventOutcome> ProcessAsync(AppDbContext context, string json)
    {
        var envelope = JsonSerializer.Deserialize<BaseEventEnvelope<JsonElement>>(json)!;

        // The broker delivers routing key {source}.{tenant}.{action}; only the source segment is checked.
        var routingKey = $"{envelope.Source}.{envelope.Tenant}.{envelope.Action}";
        Assert.True(
            IdentityUserEventValidator.TryValidate(envelope, routingKey, out var envelopeId, out var reason),
            $"validation failed: {reason}");

        var content = envelope.Content.Deserialize<UserEventContent>(
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true })!;
        var data = new IdentityUserData(
            Guid.Parse(content.UserId), content.Email, content.Username, content.FullName, content.Locale);

        var projection = new IdentityUserProjection(context, new AppUserRepository(context, new AppUserEntityMapper()));
        return await projection.ApplyAsync(envelopeId, envelope.Source, envelope.Action, data);
    }
}
