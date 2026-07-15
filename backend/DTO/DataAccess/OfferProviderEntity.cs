using System.ComponentModel.DataAnnotations;
using Base.Domain;
using Domain;

namespace DTO.DataAccess;

public class OfferProviderEntity : BaseEntityWithMetaConcurrency
{
    [Required]
    [MaxLength(256)]
    public string Name { get; set; } = default!;

    public EOfferProviderType ProviderType { get; set; }

    [Required]
    [MaxLength(1024)]
    public string OfferLocator { get; set; } = default!;

    [Required]
    [MaxLength(1024)]
    public string OfferTextLocator { get; set; } = default!;

    [Required]
    [MaxLength(1024)]
    public string OfferPriceLocator { get; set; } = default!;

    public ICollection<RestaurantEntity> Restaurants { get; set; } = [];
}
