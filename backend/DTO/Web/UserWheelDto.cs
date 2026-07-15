using System.ComponentModel.DataAnnotations;
using Base.Domain;

namespace DTO.Web;

public class UserWheelDto : BaseEntityWithConcurrency
{
    [Required]
    [StringLength(256)]
    public string Name { get; set; } = default!;

    public List<string> RestaurantNames { get; set; } = [];

    public bool IsPublic { get; set; }
}
