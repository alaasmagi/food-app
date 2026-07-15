using Base.Contracts.DTO;
using Domain;

namespace DTO.DataAccess.Mappers;

public class OfferProviderEntityMapper : IMapper<OfferProvider, OfferProviderEntity>
{
    public OfferProvider? Map(OfferProviderEntity? entity)
    {
        return entity == null ? null : new OfferProvider
        {
            Id = entity.Id,
            ConcurrencyToken = entity.ConcurrencyToken,
            Name = entity.Name,
            ProviderType = entity.ProviderType,
            OfferLocator = entity.OfferLocator,
            OfferTextLocator = entity.OfferTextLocator,
            OfferPriceLocator = entity.OfferPriceLocator,
        };
    }

    public IEnumerable<OfferProvider>? Map(IEnumerable<OfferProviderEntity>? entities)
    {
        return entities?.Select(entity => Map(entity)!);
    }

    public OfferProviderEntity? Map(OfferProvider? entity)
    {
        return entity == null ? null : new OfferProviderEntity
        {
            Id = entity.Id,
            ConcurrencyToken = entity.ConcurrencyToken,
            Name = entity.Name,
            ProviderType = entity.ProviderType,
            OfferLocator = entity.OfferLocator,
            OfferTextLocator = entity.OfferTextLocator,
            OfferPriceLocator = entity.OfferPriceLocator,
        };
    }

    public IEnumerable<OfferProviderEntity>? Map(IEnumerable<OfferProvider>? entities)
    {
        return entities?.Select(entity => Map(entity)!);
    }
}
