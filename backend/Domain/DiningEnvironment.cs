using Base.Domain;

namespace Domain;

public class DiningEnvironment : BaseEntityUserWithConcurrency
{
    public string Name { get; set; } = default!;
    public string? Description { get; set; }

    // Optional saved auto-fill origin: the map point (and radius) a proximity import runs from. Both
    // coordinates are set together or left null; a null radius means "use the auto-fill-time default"
    // rather than a stored value. Validation lives on the write path (see DiningEnvironmentService).
    public double? AutoFillLatitude { get; set; }
    public double? AutoFillLongitude { get; set; }
    public int? AutoFillRadiusMeters { get; set; }
}
