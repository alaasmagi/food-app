using Application;

namespace Tests;

public class DailyRecommendationScheduleCalculatorTests
{
    // Fixed +02:00 zone with no DST so assertions are deterministic across host machines.
    private static readonly TimeZoneInfo PlusTwo =
        TimeZoneInfo.CreateCustomTimeZone("Test+2", TimeSpan.FromHours(2), "Test+2", "Test+2");

    [Fact]
    public void GetNextOccurrenceUtc_BeforeRunTimeToday_ReturnsTodayRunTime()
    {
        // 04:00Z == 06:00 local, run time 08:00 local -> today 08:00 local == 06:00Z.
        var now = new DateTimeOffset(2026, 7, 15, 4, 0, 0, TimeSpan.Zero);

        var next = DailyRecommendationScheduleCalculator.GetNextOccurrenceUtc(now, new TimeOnly(8, 0), PlusTwo);

        Assert.Equal(new DateTimeOffset(2026, 7, 15, 6, 0, 0, TimeSpan.Zero), next);
    }

    [Fact]
    public void GetNextOccurrenceUtc_AfterRunTimeToday_ReturnsTomorrowRunTime()
    {
        // 07:00Z == 09:00 local, run time 08:00 already passed -> tomorrow 08:00 local == 06:00Z next day.
        var now = new DateTimeOffset(2026, 7, 15, 7, 0, 0, TimeSpan.Zero);

        var next = DailyRecommendationScheduleCalculator.GetNextOccurrenceUtc(now, new TimeOnly(8, 0), PlusTwo);

        Assert.Equal(new DateTimeOffset(2026, 7, 16, 6, 0, 0, TimeSpan.Zero), next);
    }

    [Fact]
    public void GetNextOccurrenceUtc_UtcZone_AfterRunTime_ReturnsTomorrow()
    {
        var now = new DateTimeOffset(2026, 7, 15, 9, 0, 0, TimeSpan.Zero);

        var next = DailyRecommendationScheduleCalculator.GetNextOccurrenceUtc(now, new TimeOnly(8, 0), TimeZoneInfo.Utc);

        Assert.Equal(new DateTimeOffset(2026, 7, 16, 8, 0, 0, TimeSpan.Zero), next);
    }
}
