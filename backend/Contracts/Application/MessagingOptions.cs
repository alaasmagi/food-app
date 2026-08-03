namespace Contracts.Application;

// Messaging identity for this deployment. Slug comes from APP_EVENT_SOURCE: it is the envelope
// `source` and `tenant`, the first routing-key segment, the broker username, and the Keycloak realm
// name — they must all match or the broker refuses the publish. UsersQueue is the identity-hub
// consumer queue this app reads, taken verbatim from RABBITMQ_QUEUE.
public class MessagingOptions
{
    public string Slug { get; init; } = default!;
    public string UsersQueue { get; init; } = default!;
}
