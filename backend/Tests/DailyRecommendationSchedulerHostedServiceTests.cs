using Application;
using Contracts.Application;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;

namespace Tests;

public class DailyRecommendationSchedulerHostedServiceTests
{
    [Fact]
    public async Task ExecuteAsync_AtScheduledOccurrence_CreatesScopeAndInvokesNotificationService()
    {
        var recording = new RecordingNotificationService();

        var services = new ServiceCollection();
        services.AddScoped<IDailyRecommendationNotificationService>(_ => recording);
        await using var provider = services.BuildServiceProvider();

        var schedule = new DailyRecommendationScheduleOptions
        {
            // Fire a few seconds from now so the timer path (not an immediate call) is exercised.
            RunTime = TimeOnly.FromDateTime(DateTime.UtcNow.AddSeconds(3)),
            TimeZone = "UTC"
        };

        var hosted = new DailyRecommendationSchedulerHostedService(
            provider.GetRequiredService<IServiceScopeFactory>(),
            schedule,
            NullLogger<DailyRecommendationSchedulerHostedService>.Instance);

        await hosted.StartAsync(CancellationToken.None);
        await Task.WhenAny(recording.Invoked, Task.Delay(TimeSpan.FromSeconds(30)));
        await hosted.StopAsync(CancellationToken.None);

        Assert.True(recording.Invoked.IsCompletedSuccessfully, "The notification service should have been invoked.");
        Assert.True(recording.Calls >= 1);
    }

    private sealed class RecordingNotificationService : IDailyRecommendationNotificationService
    {
        private readonly TaskCompletionSource _invoked = new(TaskCreationOptions.RunContinuationsAsynchronously);

        public Task Invoked => _invoked.Task;
        public int Calls;

        public Task RunAsync(CancellationToken ct = default)
        {
            Interlocked.Increment(ref Calls);
            _invoked.TrySetResult();
            return Task.CompletedTask;
        }
    }
}
