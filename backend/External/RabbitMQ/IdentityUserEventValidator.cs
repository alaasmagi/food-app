using System.Text.Json;
using Base.Contracts.Message;

namespace External.RabbitMQ;

// Envelope validation applied to every identity-hub user event before it is acted on. None of these
// failures improve on retry, so the consumer rejects without requeue on any of them — requeueing
// would only burn the delivery limit and delay the dead letter a human needs to see.
public static class IdentityUserEventValidator
{
    // Compatibility is checked on the major part only; an additive minor bump stays supported.
    public const string SupportedContentVersionMajor = "1";

    public static bool TryValidate(
        IBaseEventEnvelope<JsonElement> envelope,
        string routingKey,
        out Guid envelopeId,
        out string? failureReason)
    {
        envelopeId = Guid.Empty;

        // RabbitMQ enforces topic permissions on the routing key and never looks at the body. Verify
        // the key's source segment against the payload source so a spoofed body cannot bypass it.
        var keySource = routingKey.Split('.', 2)[0];
        if (!string.Equals(keySource, envelope.Source, StringComparison.Ordinal))
        {
            failureReason = $"routing-key source '{keySource}' does not match payload source '{envelope.Source}'.";
            return false;
        }

        if (string.IsNullOrWhiteSpace(envelope.Tenant))
        {
            failureReason = "tenant is missing.";
            return false;
        }

        var major = MajorOf(envelope.ContentVersion);
        if (!string.Equals(major, SupportedContentVersionMajor, StringComparison.Ordinal))
        {
            failureReason = $"unsupported contentVersion major '{major}'.";
            return false;
        }

        if (!Guid.TryParse(envelope.Id, out envelopeId))
        {
            failureReason = "envelope id is not a UUID.";
            return false;
        }

        failureReason = null;
        return true;
    }

    private static string MajorOf(string? contentVersion)
    {
        return string.IsNullOrWhiteSpace(contentVersion)
            ? string.Empty
            : contentVersion.Split('.', 2)[0];
    }
}
