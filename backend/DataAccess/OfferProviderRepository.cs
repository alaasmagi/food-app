using Base.Contracts.DTO;
using Base.DataAccess.EF;
using Contracts.DataAccess;
using DataAccess.Context;
using Domain;
using DTO.DataAccess;
using Microsoft.EntityFrameworkCore;

namespace DataAccess;

public class OfferProviderRepository
    : BaseRepository<OfferProvider, OfferProviderEntity, IMapper<OfferProvider, OfferProviderEntity>>,
        IOfferProviderRepository
{
    private readonly AppDbContext _context;

    public OfferProviderRepository(
        AppDbContext repositoryDbContext,
        IMapper<OfferProvider, OfferProviderEntity> repositoryMapper)
        : base(repositoryDbContext, repositoryMapper)
    {
        _context = repositoryDbContext;
    }

    public async Task<bool> IsReferencedByRestaurantAsync(Guid id, CancellationToken ct = default)
    {
        return await _context.Restaurants
            .AsNoTracking()
            .AnyAsync(restaurant => restaurant.OfferProviderId == id, ct);
    }
}
