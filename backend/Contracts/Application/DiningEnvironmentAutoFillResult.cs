namespace Contracts.Application;

/// <summary>
/// Result of a dining environment auto-fill run.
/// </summary>
public record DiningEnvironmentAutoFillResult(int Added, int AlreadyPresent, int TotalMembers);
