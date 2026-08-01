namespace DTO.Messaging;

// Fixed envelope values for the daily lunch-recommendation command. `source` and `tenant` are NOT
// here — they are the deployment's app slug (MessagingOptions.Slug) and must equal the broker
// username, so they come from configuration, not a constant. `action` is a single hyphenated segment
// (no dots) because the routing-key builder rejects dots in any segment.
public static class LunchRecommendationContract
{
    public const string Action = "lunch-recommendation";

    // Plain string passed through verbatim; email-hub selects the template model by major version.
    public const string ContentVersion = "1.0";
}
