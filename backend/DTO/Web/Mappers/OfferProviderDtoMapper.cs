using Base.Contracts.DTO;
using Domain;

namespace DTO.Web.Mappers;

public class OfferProviderDtoMapper : IMapper<OfferProviderDto, OfferProvider>
{
    public OfferProviderDto? Map(OfferProvider? entity)
    {
        return entity == null ? null : new OfferProviderDto
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

    public IEnumerable<OfferProviderDto>? Map(IEnumerable<OfferProvider>? entities)
    {
        return entities?.Select(entity => Map(entity)!);
    }

    public OfferProvider? Map(OfferProviderDto? entity)
    {
        return entity == null ? null : new OfferProvider
        {
            Id = entity.Id == Guid.Empty ? Guid.NewGuid() : entity.Id,
            ConcurrencyToken = entity.ConcurrencyToken ?? string.Empty,
            Name = entity.Name,
            ProviderType = entity.ProviderType,
            OfferLocator = entity.OfferLocator,
            OfferTextLocator = entity.OfferTextLocator,
            OfferPriceLocator = entity.OfferPriceLocator,
        };
    }

    public IEnumerable<OfferProvider>? Map(IEnumerable<OfferProviderDto>? entities)
    {
        return entities?.Select(entity => Map(entity)!);
    }
}
