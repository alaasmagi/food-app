namespace Contracts.Application;

// Configurable morning schedule for the daily lunch recommendation trigger.
public class DailyRecommendationScheduleOptions
{
    public TimeOnly RunTime { get; init; } = new(8, 0);
    public string TimeZone { get; init; } = "Europe/Tallinn";
}
