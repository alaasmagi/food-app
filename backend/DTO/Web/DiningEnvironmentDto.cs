using System.ComponentModel.DataAnnotations;
using Base.Domain;

namespace DTO.Web;

public class DiningEnvironmentDto : BaseEntityWithConcurrency
{
    [Required]
    [StringLength(256)]
    public string Name { get; set; } = default!;

    [StringLength(1024)]
    public string? Description { get; set; }

    // Optional saved auto-fill origin. Cross-field rules (both-or-neither coordinates, radius requires
    // coordinates, ranges) are enforced in DiningEnvironmentService, not by data annotations here.
    [Range(-90, 90)]
    public double? AutoFillLatitude { get; set; }

    [Range(-180, 180)]
    public double? AutoFillLongitude { get; set; }

    [Range(1, 50000)]
    public int? AutoFillRadiusMeters { get; set; }
}
