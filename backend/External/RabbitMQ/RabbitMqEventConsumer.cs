using System.Text.Json;
using Base.Contracts.Message;
using Base.Message.RabbitMQ;
using Microsoft.Extensions.Logging;

namespace External.RabbitMQ;

public class RabbitMqEventConsumer : RabbitMqConsumerBase<JsonElement>
{
    public RabbitMqEventConsumer(
        RabbitMqConnectionManager connections,
        RabbitMqOptions options,
        AppMessagingOptions appOptions,
        IBaseEventHandler<JsonElement> handler,
        ILogger<RabbitMqEventConsumer> logger)
        : base(
            connections,
            options,
            handler,
            logger,
            queueName: appOptions.Queue)
    {
        // Queue-only consumer: the food-app queue and its bindings are owned by the
        // external identity/email-hub topology, so no exchange binding or routing-key
        // pattern is declared here. Passing no routing keys skips the exchange bind in
        // RabbitMqConsumerBase; RabbitMqEventHandler still filters on the envelope's
        // Type/Source fields.
    }
}
