namespace Contracts.DataAccess;

// The five identity-hub user actions this service projects into its local user table. Single
// hyphenated segments, matching the envelope `action` verbatim.
public static class IdentityUserActions
{
    public const string Created = "user-created";
    public const string Updated = "user-updated";
    public const string Enabled = "user-enabled";
    public const string Disabled = "user-disabled";
    public const string Deleted = "user-deleted";
}

// Identity-sourced user fields carried by a user event. Only UserId is present on user-deleted.
public sealed record IdentityUserData(
    Guid UserId,
    string? Email,
    string? Username,
    string? FullName,
    string? Locale);

public enum IdentityUserEventOutcome
{
    // The event was new: the user projection was applied and the envelope id recorded.
    Applied,

    // The envelope id was already processed: nothing was applied, the message should be acked.
    Duplicate,

    // The action is not one this service acts on: recorded and acked, no projection change.
    Ignored
}

// Applies an identity-hub user event to the local user table idempotently. The envelope id is
// inserted into the processed-message ledger in the same transaction as the user change, so a
// redelivery of an already-processed id returns Duplicate and leaves the table untouched. Throws on
// a transient failure (e.g. the database is unavailable) so the caller can requeue; the delivery
// limit dead-letters after a few attempts.
public interface IIdentityUserProjection
{
    Task<IdentityUserEventOutcome> ApplyAsync(
        Guid envelopeId,
        string source,
        string action,
        IdentityUserData data,
        CancellationToken ct = default);
}
