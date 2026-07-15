using Base.Contracts.DTO;
using Base.DataAccess.EF;
using Contracts.DataAccess;
using DataAccess.Context;
using Domain;
using DTO.DataAccess;
using Microsoft.EntityFrameworkCore;

namespace DataAccess;

public class FavouriteRepository
    : BaseRepository<Favourite, FavouriteEntity, IMapper<Favourite, FavouriteEntity>>, IFavouriteRepository
{
    private readonly AppDbContext _context;
    private readonly IMapper<Favourite, FavouriteEntity> _mapper;

    public FavouriteRepository(
        AppDbContext repositoryDbContext,
        IMapper<Favourite, FavouriteEntity> repositoryMapper)
        : base(repositoryDbContext, repositoryMapper)
    {
        _context = repositoryDbContext;
        _mapper = repositoryMapper;
    }

    public async Task<Favourite?> GetByRestaurantAsync(Guid restaurantId, Guid actor, CancellationToken ct = default)
    {
        var entity = await _context.Favourites
            .AsNoTracking()
            .FirstOrDefaultAsync(
                favourite => favourite.UserId == actor && favourite.RestaurantId == restaurantId,
                ct);

        return _mapper.Map(entity);
    }
}
