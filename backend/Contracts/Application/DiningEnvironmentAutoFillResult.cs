namespace Contracts.Application;

/// <summary>
/// Summary of a proximity auto-fill run: how many in-radius restaurants were newly added as
/// memberships, how many were already members, and the resulting total membership count for the
/// environment. Auto-fill is additive, so <c>TotalMembers</c> can exceed the in-radius count.
/// </summary>
public record DiningEnvironmentAutoFillResult(int Added, int AlreadyPresent, int TotalMembers);
