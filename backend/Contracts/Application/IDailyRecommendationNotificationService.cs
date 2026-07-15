namespace Contracts.Application;

public interface IDailyRecommendationNotificationService
{
    // Runs one daily recommendation publishing pass: publishes one event per opted-in user.
    Task RunAsync(CancellationToken ct = default);
}
