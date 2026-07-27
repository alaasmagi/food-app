namespace Contracts.Application;

public static class DiningEnvironmentErrorCodes
{
    // Write-path validation of the auto-fill origin fields (both-or-neither coordinates, radius
    // requires coordinates, coordinate/radius ranges). Maps to HTTP 400.
    public const string AutoFillValidation = "AUTO_FILL_VALIDATION";

    // Auto-fill invoked on an environment that has no stored coordinates. Maps to HTTP 400.
    public const string AutoFillLocationRequired = "AUTO_FILL_LOCATION_REQUIRED";
}
