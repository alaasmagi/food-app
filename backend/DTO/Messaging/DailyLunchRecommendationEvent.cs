using Base.Contracts.Message;

namespace DTO.Messaging;

// Food-sourced email event envelope. Fixed envelope values (type/source/action) are baked in so
// the daily lunch recommendation contract stays exact; the notification service supplies only the
// timestamp and content. Implemented against IBaseEventEnvelope so it can be published directly
// through IBaseEventPublisher without going through the identity-source AppEventPublisher wrapper.
public sealed class DailyLunchRecommendationEvent : IBaseEventEnvelope<DailyLunchRecommendationContent>
{
    public DailyLunchRecommendationEvent(DateTime timestamp, DailyLunchRecommendationContent content)
    {
        Timestamp = timestamp;
        Content = content;
    }

    public string Type { get; init; } = AppMessageTypes.Email;
    public string Source { get; init; } = AppMessageSources.Food;
    public string Action { get; init; } = AppMessageActions.DailyLunchRecommendation;
    public DateTime Timestamp { get; init; }
    public DailyLunchRecommendationContent Content { get; init; }
}
