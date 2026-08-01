using System.Text.Json;
using Base.Contracts.Message;
using Base.Keycloak.Events;
using Base.Message;
using Base.Message.RabbitMQ;
using Contracts.Application;
using Contracts.DataAccess;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;

namespace External.RabbitMQ;

// Consumes identity-hub user events from this app's existing {slug}.users queue and projects them
// into the local user table. Manual acks, bounded prefetch, no declare/bind (the queue, its binding
// and DLX are provisioned on the broker). Validation failures reject without requeue; transient
// failures requeue so the queue's delivery limit dead-letters after a few attempts.
public class IdentityUserEventConsumer(
    RabbitMqConnectionManager connections,
    MessagingOptions messagingOptions,
    IServiceScopeFactory scopeFactory,
    ILogger<IdentityUserEventConsumer> logger) : BackgroundService
{
    private const ushort PrefetchCount = 20;

    private static readonly JsonSerializerOptions SerializerOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var channel = await connections.CreateChannelAsync(null, stoppingToken);
        try
        {
            await channel.BasicQosAsync(0, PrefetchCount, false, stoppingToken);

            var consumer = new AsyncEventingBasicConsumer(channel);
            consumer.ReceivedAsync += (_, ea) => HandleAsync(channel, ea, stoppingToken);

            await channel.BasicConsumeAsync(messagingOptions.UsersQueue, autoAck: false, consumer, stoppingToken);
            logger.LogInformation("Consuming identity user events from queue '{Queue}'.", messagingOptions.UsersQueue);

            await Task.Delay(Timeout.Infinite, stoppingToken);
        }
        catch (OperationCanceledException)
        {
            // Shutdown requested.
        }
        finally
        {
            await channel.DisposeAsync();
        }
    }

    private async Task HandleAsync(IChannel channel, BasicDeliverEventArgs ea, CancellationToken ct)
    {
        BaseEventEnvelope<JsonElement>? envelope;
        try
        {
            envelope = JsonSerializer.Deserialize<BaseEventEnvelope<JsonElement>>(ea.Body.Span);
        }
        catch (JsonException)
        {
            logger.LogWarning("Rejected malformed message on '{Queue}' (unparseable envelope).", messagingOptions.UsersQueue);
            await channel.BasicNackAsync(ea.DeliveryTag, false, requeue: false, ct);
            return;
        }

        if (envelope is null)
        {
            await channel.BasicNackAsync(ea.DeliveryTag, false, requeue: false, ct);
            return;
        }

        if (!IdentityUserEventValidator.TryValidate(envelope, ea.RoutingKey, out var envelopeId, out var failureReason))
        {
            logger.LogWarning(
                "Rejected event {EnvelopeId} (source {Source}, tenant {Tenant}, action {Action}): {Reason}",
                envelope.Id, envelope.Source, envelope.Tenant, envelope.Action, failureReason);
            await channel.BasicNackAsync(ea.DeliveryTag, false, requeue: false, ct);
            return;
        }

        if (!TryExtractUserData(envelope, out var data))
        {
            logger.LogWarning(
                "Rejected event {EnvelopeId} (source {Source}, tenant {Tenant}, action {Action}): content has no valid userId.",
                envelope.Id, envelope.Source, envelope.Tenant, envelope.Action);
            await channel.BasicNackAsync(ea.DeliveryTag, false, requeue: false, ct);
            return;
        }

        try
        {
            using var scope = scopeFactory.CreateScope();
            var projection = scope.ServiceProvider.GetRequiredService<IIdentityUserProjection>();
            var outcome = await projection.ApplyAsync(envelopeId, envelope.Source, envelope.Action, data, ct);
            await channel.BasicAckAsync(ea.DeliveryTag, false, ct);

            logger.LogInformation(
                "Processed event {EnvelopeId} (source {Source}, tenant {Tenant}, action {Action}): {Outcome}.",
                envelope.Id, envelope.Source, envelope.Tenant, envelope.Action, outcome);
        }
        catch (Exception ex) when (!ct.IsCancellationRequested)
        {
            logger.LogError(
                ex,
                "Transient failure processing event {EnvelopeId} (source {Source}, action {Action}); requeueing.",
                envelope.Id, envelope.Source, envelope.Action);
            await channel.BasicNackAsync(ea.DeliveryTag, false, requeue: true, ct);
        }
    }

    private static bool TryExtractUserData(IBaseEventEnvelope<JsonElement> envelope, out IdentityUserData data)
    {
        data = default!;

        UserEventContent? content;
        try
        {
            content = envelope.Content.Deserialize<UserEventContent>(SerializerOptions);
        }
        catch (JsonException)
        {
            return false;
        }

        if (content is null || !Guid.TryParse(content.UserId, out var userId))
        {
            return false;
        }

        data = new IdentityUserData(userId, content.Email, content.Username, content.FullName, content.Locale);
        return true;
    }
}
