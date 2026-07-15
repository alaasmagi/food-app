namespace Application;

// Pure next-run computation for the daily recommendation trigger, isolated from the hosted
// service loop so it can be unit tested and so the run time/time zone are never inline constants.
public static class DailyRecommendationScheduleCalculator
{
    public static DateTimeOffset GetNextOccurrenceUtc(DateTimeOffset nowUtc, TimeOnly runTime, TimeZoneInfo timeZone)
    {
        var nowLocal = TimeZoneInfo.ConvertTime(nowUtc, timeZone);
        var candidateLocalDate = DateOnly.FromDateTime(nowLocal.DateTime);
        var candidateLocal = candidateLocalDate.ToDateTime(runTime);

        // If today's run time has already passed in the target zone, schedule tomorrow's.
        if (candidateLocal <= nowLocal.DateTime)
        {
            candidateLocal = candidateLocalDate.AddDays(1).ToDateTime(runTime);
        }

        var candidateUtc = TimeZoneInfo.ConvertTimeToUtc(
            DateTime.SpecifyKind(candidateLocal, DateTimeKind.Unspecified),
            timeZone);

        return new DateTimeOffset(candidateUtc, TimeSpan.Zero);
    }
}
