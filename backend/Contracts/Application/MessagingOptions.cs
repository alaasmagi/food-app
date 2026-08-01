namespace Contracts.Application;

// Messaging identity for this deployment. Slug is the single registry value: it is the envelope
// `source` and `tenant`, the first routing-key segment, the broker username, and the Keycloak realm
// name — they must all match or the broker refuses the publish. UsersQueue is the identity-hub
// consumer queue this app reads, conventionally "{slug}.users".
public class MessagingOptions
{
    public string Slug { get; init; } = default!;
    public string UsersQueue { get; init; } = default!;
}
