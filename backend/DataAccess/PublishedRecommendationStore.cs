using Contracts.DataAccess;
using DataAccess.Context;
using DTO.DataAccess;
using Microsoft.EntityFrameworkCore;

namespace DataAccess;

public class PublishedRecommendationStore(AppDbContext context) : IPublishedRecommendationStore
{
    public Task<bool> IsPublishedAsync(Guid userId, DateOnly localDate, CancellationToken ct = default)
    {
        return context.PublishedRecommendations
            .AsNoTracking()
            .AnyAsync(r => r.UserId == userId && r.LocalDate == localDate, ct);
    }

    public async Task RecordPublishedAsync(
        Guid envelopeId,
        Guid userId,
        DateOnly localDate,
        DateTime publishedAtUtc,
        CancellationToken ct = default)
    {
        var entity = new PublishedRecommendationEntity
        {
            Id = envelopeId,
            UserId = userId,
            LocalDate = localDate,
            PublishedAtUtc = publishedAtUtc
        };
        context.PublishedRecommendations.Add(entity);

        try
        {
            await context.SaveChangesAsync(ct);
        }
        catch (DbUpdateException ex) when (PostgresErrors.IsUniqueViolation(ex))
        {
            // Another run recorded this send first; drop the pending add and treat it as recorded.
            context.Entry(entity).State = EntityState.Detached;
        }
    }
}
