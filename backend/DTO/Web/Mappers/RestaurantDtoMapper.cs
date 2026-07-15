using Base.Contracts.DTO;
using Domain;

namespace DTO.Web.Mappers;

public class RestaurantDtoMapper : IMapper<RestaurantDto, Restaurant>
{
    public RestaurantDto? Map(Restaurant? entity)
    {
        return entity == null ? null : new RestaurantDto
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

    public IEnumerable<RestaurantDto>? Map(IEnumerable<Restaurant>? entities)
    {
        return entities?.Select(entity => Map(entity)!);
    }

    public Restaurant? Map(RestaurantDto? entity)
    {
        return entity == null ? null : new Restaurant
        {
            Id = entity.Id == Guid.Empty ? Guid.NewGuid() : entity.Id,
            ConcurrencyToken = entity.ConcurrencyToken ?? string.Empty,
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

    public IEnumerable<Restaurant>? Map(IEnumerable<RestaurantDto>? entities)
    {
        return entities?.Select(entity => Map(entity)!);
    }
}
