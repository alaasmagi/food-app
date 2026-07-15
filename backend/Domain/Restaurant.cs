using Base.Domain;

namespace Domain;

public class Restaurant : BaseEntityWithConcurrency
{
    public string Name { get; set; } = default!;
    public string City { get; set; } = default!;
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public string OfferTimeText { get; set; } = default!;
    public string ParkingInfo { get; set; } = default!;
    public string OpeningInfo { get; set; } = default!;
    public bool HasOffers { get; set; }
    public bool IsFastFood { get; set; }
    public string? OffersResourceUrl { get; set; }
    public Guid? OfferProviderId { get; set; }
}
