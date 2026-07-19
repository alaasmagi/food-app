using Base.Contracts.DTO;
using Base.DataAccess.EF;
using Contracts.DataAccess;
using DataAccess.Context;
using Domain;
using DTO.DataAccess;
using Microsoft.EntityFrameworkCore;

namespace DataAccess;

public class RestaurantRepository
    : BaseRepository<Restaurant, RestaurantEntity, IMapper<Restaurant, RestaurantEntity>>, IRestaurantRepository
{
    private readonly AppDbContext _context;
    private readonly IMapper<Restaurant, RestaurantEntity> _mapper;

    public RestaurantRepository(
        AppDbContext repositoryDbContext,
        IMapper<Restaurant, RestaurantEntity> repositoryMapper)
        : base(repositoryDbContext, repositoryMapper)
    {
        _context = repositoryDbContext;
        _mapper = repositoryMapper;
    }

    public async Task<IReadOnlyList<Restaurant>> GetInBoundsAsync(
        double minLat,
        double minLon,
        double maxLat,
        double maxLon,
        int limit,
        CancellationToken ct = default)
    {
        // Box centre: when the viewport holds more than `limit` restaurants, keep the ones nearest the
        // middle of the visible area. Planar distance² (no sqrt) is enough to order within a city-sized box.
        var centerLat = (minLat + maxLat) / 2;
        var centerLon = (minLon + maxLon) / 2;

        var entities = await _context.Restaurants
            .AsNoTracking()
            .Where(restaurant =>
                restaurant.Latitude >= minLat && restaurant.Latitude <= maxLat &&
                restaurant.Longitude >= minLon && restaurant.Longitude <= maxLon)
            .OrderBy(restaurant =>
                (restaurant.Latitude - centerLat) * (restaurant.Latitude - centerLat) +
                (restaurant.Longitude - centerLon) * (restaurant.Longitude - centerLon))
            .Take(limit)
            .ToListAsync(ct);

        return _mapper.Map(entities)?.ToList() ?? [];
    }

    public async Task<(IReadOnlyList<Restaurant> Items, int Total)> SearchPageAsync(
        string? search,
        int pageNr,
        int pageSize,
        CancellationToken ct = default)
    {
        var query = _context.Restaurants.AsNoTracking();

        var term = search?.Trim().ToLower();
        if (!string.IsNullOrEmpty(term))
        {
            // ToLower().Contains (not the Npgsql-only EF.Functions.ILike) so the same query runs under
            // the in-memory provider used by the repository tests; Npgsql translates it to lower(...) LIKE.
            query = query.Where(restaurant =>
                restaurant.Name.ToLower().Contains(term) ||
                restaurant.City.ToLower().Contains(term));
        }

        var total = await query.CountAsync(ct);
        var entities = await query
            .OrderBy(restaurant => restaurant.Name)
            .Skip((pageNr - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        return (_mapper.Map(entities)?.ToList() ?? [], total);
    }
}
