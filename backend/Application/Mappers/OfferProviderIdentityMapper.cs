using Base.Contracts.DTO;
using Domain;

namespace Application.Mappers;

public class OfferProviderIdentityMapper : IMapper<OfferProvider, OfferProvider>
{
    public OfferProvider? Map(OfferProvider? entity)
    {
        return entity;
    }

    public IEnumerable<OfferProvider>? Map(IEnumerable<OfferProvider>? entities)
    {
        return entities;
    }
}
