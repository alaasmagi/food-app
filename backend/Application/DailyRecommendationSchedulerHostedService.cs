using Contracts.Application;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Application;

// Hosted daily morning trigger. It computes the next configured occurrence, waits for it, then
// creates an application scope and invokes the notification service once per occurrence. The run
// time and time zone come from DailyRecommendationScheduleOptions, never inline constants.
public class DailyRecommendationSchedulerHostedService(
    IServiceScopeFactory scopeFactory,
    DailyRecommendationScheduleOptions scheduleOptions,
    ILogger<DailyRecommendationSchedulerHostedService> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var timeZone = ResolveTimeZone(scheduleOptions.TimeZone);

        while (!stoppingToken.IsCancellationRequested)
        {
            var now = DateTimeOffset.UtcNow;
            var nextRun = DailyRecommendationScheduleCalculator.GetNextOccurrenceUtc(
                now, scheduleOptions.RunTime, timeZone);

            logger.LogInformation("Next daily lunch recommendation run scheduled for {NextRunUtc:o}.", nextRun);

            try
            {
                await Task.Delay(nextRun - now, stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }

            try
            {
                using var scope = scopeFactory.CreateScope();
                var service = scope.ServiceProvider.GetRequiredService<IDailyRecommendationNotificationService>();
                await service.RunAsync(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Daily lunch recommendation run failed.");
            }
        }
    }

    private TimeZoneInfo ResolveTimeZone(string timeZoneId)
    {
        try
        {
            return TimeZoneInfo.FindSystemTimeZoneById(timeZoneId);
        }
        catch (Exception ex) when (ex is TimeZoneNotFoundException or InvalidTimeZoneException)
        {
            logger.LogWarning(ex, "Time zone '{TimeZoneId}' not found; falling back to UTC.", timeZoneId);
            return TimeZoneInfo.Utc;
        }
    }
}
