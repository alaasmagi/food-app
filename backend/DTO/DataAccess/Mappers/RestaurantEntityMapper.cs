using Base.Contracts.DTO;
using Domain;

namespace DTO.DataAccess.Mappers;

public class RestaurantEntityMapper : IMapper<Restaurant, RestaurantEntity>
{
    public Restaurant? Map(RestaurantEntity? entity)
    {
        return entity == null ? null : new Restaurant
        {
            Id = entity.Id,
            ConcurrencyToken = entity.ConcurrencyToken,
            Name = entity.Name,
            City = entity.City,
            Latitude = entity.Latitude,
            Longitude = entity.Longitude,
            OfferTimeText = entity.OfferTimeText,
            ParkingInfo = entity.ParkingInfo,
            OpeningInfo = entity.OpeningInfo,
            HasOffers = entity.HasOffers,
            IsFastFood = entity.IsFastFood,
            OffersResourceUrl = entity.OffersResourceUrl,
            OfferProviderId = entity.OfferProviderId,
        };
    }

    public IEnumerable<Restaurant>? Map(IEnumerable<RestaurantEntity>? entities)
    {
        return entities?.Select(entity => Map(entity)!);
    }

    public RestaurantEntity? Map(Restaurant? entity)
    {
        return entity == null ? null : new RestaurantEntity
        {
            Id = entity.Id,
            ConcurrencyToken = entity.ConcurrencyToken,
            Name = entity.Name,
            City = entity.City,
            Latitude = entity.Latitude,
            Longitude = entity.Longitude,
            OfferTimeText = entity.OfferTimeText,
            ParkingInfo = entity.ParkingInfo,
            OpeningInfo = entity.OpeningInfo,
            HasOffers = entity.HasOffers,
            IsFastFood = entity.IsFastFood,
            OffersResourceUrl = entity.OffersResourceUrl,
            OfferProviderId = entity.OfferProviderId,
        };
    }

    public IEnumerable<RestaurantEntity>? Map(IEnumerable<Restaurant>? entities)
    {
        return entities?.Select(entity => Map(entity)!);
    }
}
