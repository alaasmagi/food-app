using Base.Application;
using Base.Contracts.DTO;
using Base.DTO;
using Contracts.Application;
using Contracts.DataAccess;
using Domain;

namespace Application;

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

public class OfferProviderService
    : BaseService<OfferProvider, OfferProvider, IOfferProviderRepository>, IOfferProviderService
{
    private readonly IOfferProviderRepository _offerProviderRepository;

    public OfferProviderService(
        IOfferProviderRepository offerProviderRepository,
        Base.Contracts.DataAccess.IBaseUow uow,
        IMapper<OfferProvider, OfferProvider> mapper)
        : base(uow, offerProviderRepository, mapper)
    {
        _offerProviderRepository = offerProviderRepository;
    }

    public override async Task<IMethodResponse<bool>> RemoveAsync(
        Guid id,
        string? expectedConcurrencyToken,
        Guid actor = default)
    {
        if (await _offerProviderRepository.IsReferencedByRestaurantAsync(id))
        {
            return MethodResponse<bool>.Failure(new Error(
                ErrorDefaults.Codes.Forbidden,
                "OfferProvider is referenced by one or more restaurants."));
        }

        return await base.RemoveAsync(id, expectedConcurrencyToken, actor);
    }
}
