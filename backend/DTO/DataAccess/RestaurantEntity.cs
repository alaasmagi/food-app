using System.ComponentModel.DataAnnotations;
using Base.Domain;

namespace DTO.DataAccess;

public class RestaurantEntity : BaseEntityWithMetaConcurrency
{
    [Required]
    [MaxLength(256)]
    public string Name { get; set; } = default!;

    [Required]
    [MaxLength(128)]
    public string City { get; set; } = default!;

    public double Latitude { get; set; }

    public double Longitude { get; set; }

    [Required]
    [MaxLength(512)]
    public string OfferTimeText { get; set; } = default!;

    [Required]
    [MaxLength(1024)]
    public string ParkingInfo { get; set; } = default!;

    [Required]
    [MaxLength(1024)]
    public string OpeningInfo { get; set; } = default!;

    public bool HasOffers { get; set; }

    public bool IsFastFood { get; set; }

    [MaxLength(2048)]
    public string? OffersResourceUrl { get; set; }

    public Guid? OfferProviderId { get; set; }

    public OfferProviderEntity? OfferProvider { get; set; }
}
