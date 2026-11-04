using Base.Domain;

namespace Domain;

public class DiningEnvironment : BaseEntityUserWithConcurrency
{
    private const int MinAutoFillRadiusMeters = 1;
    private const int MaxAutoFillRadiusMeters = 50000;

    public string Name { get; set; } = default!;
    public string? Description { get; set; }

    // A null radius means "use the auto-fill-time default", not a stored value.
    public double? AutoFillLatitude { get; set; }
    public double? AutoFillLongitude { get; set; }
    public int? AutoFillRadiusMeters { get; set; }

    public string? ValidateAutoFillFields()
    {
        var hasLatitude = AutoFillLatitude.HasValue;
        var hasLongitude = AutoFillLongitude.HasValue;

        if (hasLatitude != hasLongitude)
        {
            return "AutoFillLatitude and AutoFillLongitude must be provided together.";
        }

        if (AutoFillRadiusMeters.HasValue && !(hasLatitude && hasLongitude))
        {
            return "AutoFillRadiusMeters requires AutoFillLatitude and AutoFillLongitude to be set.";
        }

        if (hasLatitude && (AutoFillLatitude!.Value < -90 || AutoFillLatitude.Value > 90))
        {
            return "AutoFillLatitude must be between -90 and 90 degrees.";
        }

        if (hasLongitude && (AutoFillLongitude!.Value < -180 || AutoFillLongitude.Value > 180))
        {
            return "AutoFillLongitude must be between -180 and 180 degrees.";
        }

        if (AutoFillRadiusMeters.HasValue &&
            (AutoFillRadiusMeters.Value < MinAutoFillRadiusMeters || AutoFillRadiusMeters.Value > MaxAutoFillRadiusMeters))
        {
            return $"AutoFillRadiusMeters must be between {MinAutoFillRadiusMeters} and {MaxAutoFillRadiusMeters} meters.";
        }

        return null;
    }
}
