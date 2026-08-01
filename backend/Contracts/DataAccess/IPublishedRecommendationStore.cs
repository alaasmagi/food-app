namespace Contracts.DataAccess;

// Local ledger of daily lunch-recommendation mail the broker has confirmed, keyed by recipient and
// local send date. Makes the daily batch safe to re-run: a publish is recorded only after the broker
// confirms it, and a same-day re-run skips recipients already recorded.
public interface IPublishedRecommendationStore
{
    Task<bool> IsPublishedAsync(Guid userId, DateOnly localDate, CancellationToken ct = default);

    // Records a confirmed publish. Idempotent: a duplicate (userId, localDate) is treated as already
    // recorded rather than an error, so a race between two runs cannot fail the batch.
    Task RecordPublishedAsync(
        Guid envelopeId,
        Guid userId,
        DateOnly localDate,
        DateTime publishedAtUtc,
        CancellationToken ct = default);
}
