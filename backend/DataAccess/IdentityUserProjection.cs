using Contracts.DataAccess;
using DataAccess.Context;
using DTO.DataAccess;
using Microsoft.EntityFrameworkCore;

namespace DataAccess;

public class IdentityUserProjection(AppDbContext context, IAppUserRepository users) : IIdentityUserProjection
{
    public async Task<IdentityUserEventOutcome> ApplyAsync(
        Guid envelopeId,
        string source,
        string action,
        IdentityUserData data,
        CancellationToken ct = default)
    {
        // Insert-before-apply: if the id is already recorded, this is a redelivery — do nothing.
        if (await context.ProcessedMessages.AnyAsync(m => m.Id == envelopeId, ct))
        {
            return IdentityUserEventOutcome.Duplicate;
        }

        // The ledger row is added to the same tracked context as the user change. The upsert/delete
        // below issues one SaveChanges, committing the ledger row and the projection atomically; if
        // either fails, neither persists and the message can be requeued.
        context.ProcessedMessages.Add(new ProcessedMessageEntity
        {
            Id = envelopeId,
            ProcessedAtUtc = DateTime.UtcNow,
            Source = source,
            Action = action
        });

        try
        {
            var outcome = await DispatchAsync(action, data, ct);
            // Flush the ledger row for paths that did not themselves save (user-deleted of a missing
            // user, or an ignored action). A no-op when the dispatch already saved.
            await context.SaveChangesAsync(ct);
            return outcome;
        }
        catch (DbUpdateException ex) when (PostgresErrors.IsUniqueViolation(ex))
        {
            // A concurrent delivery recorded the same id first.
            return IdentityUserEventOutcome.Duplicate;
        }
    }

    private async Task<IdentityUserEventOutcome> DispatchAsync(
        string action,
        IdentityUserData data,
        CancellationToken ct)
    {
        switch (action)
        {
            case IdentityUserActions.Created:
                await users.UpsertFromIdentityEventAsync(
                    data.UserId, data.Email, data.Username, data.FullName, data.Locale, isEnabled: true, ct);
                return IdentityUserEventOutcome.Applied;

            case IdentityUserActions.Updated:
                await users.UpsertFromIdentityEventAsync(
                    data.UserId, data.Email, data.Username, data.FullName, data.Locale, isEnabled: null, ct);
                return IdentityUserEventOutcome.Applied;

            case IdentityUserActions.Enabled:
                await users.UpsertFromIdentityEventAsync(
                    data.UserId, data.Email, data.Username, data.FullName, data.Locale, isEnabled: true, ct);
                return IdentityUserEventOutcome.Applied;

            case IdentityUserActions.Disabled:
                await users.UpsertFromIdentityEventAsync(
                    data.UserId, data.Email, data.Username, data.FullName, data.Locale, isEnabled: false, ct);
                return IdentityUserEventOutcome.Applied;

            case IdentityUserActions.Deleted:
                // Idempotent: deleting an already-absent user is still a successful projection.
                await users.DeleteFromIdentityEventAsync(data.UserId, ct);
                return IdentityUserEventOutcome.Applied;

            default:
                return IdentityUserEventOutcome.Ignored;
        }
    }
}
