using System.ComponentModel.DataAnnotations;
using Base.Domain;

namespace DTO.DataAccess;

public class FavouriteEntity : BaseEntityUserWithMetaConcurrency
{
    public Guid RestaurantId { get; set; }

    [Range(1, 5)]
    public int Rating { get; set; }

    [MaxLength(1024)]
    public string? Note { get; set; }

    public RestaurantEntity? Restaurant { get; set; }
}
