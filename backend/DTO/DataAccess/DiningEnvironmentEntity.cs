using System.ComponentModel.DataAnnotations;
using Base.Domain;

namespace DTO.DataAccess;

public class DiningEnvironmentEntity : BaseEntityUserWithMetaConcurrency
{
    [Required]
    [MaxLength(256)]
    public string Name { get; set; } = default!;

    [MaxLength(1024)]
    public string? Description { get; set; }

    public ICollection<EnvironmentRestaurantEntity> EnvironmentRestaurants { get; set; } = [];
}
