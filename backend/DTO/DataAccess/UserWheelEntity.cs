using System.ComponentModel.DataAnnotations;
using Base.Domain;

namespace DTO.DataAccess;

public class UserWheelEntity : BaseEntityUserWithMetaConcurrency
{
    [Required]
    [MaxLength(256)]
    public string Name { get; set; } = default!;

    public List<string> RestaurantNames { get; set; } = [];

    public bool IsPublic { get; set; }
}
