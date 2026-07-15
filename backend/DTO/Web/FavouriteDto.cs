using System.ComponentModel.DataAnnotations;
using Base.Domain;

namespace DTO.Web;

public class FavouriteDto : BaseEntityWithConcurrency
{
    public Guid RestaurantId { get; set; }

    [Range(1, 5)]
    public int Rating { get; set; }

    [StringLength(1024)]
    public string? Note { get; set; }
}
