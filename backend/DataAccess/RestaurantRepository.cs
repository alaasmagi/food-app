using Base.Contracts.DTO;
using Base.DataAccess.EF;
using Contracts.DataAccess;
using DataAccess.Context;
using Domain;
using DTO.DataAccess;

namespace DataAccess;

public class RestaurantRepository
    : BaseRepository<Restaurant, RestaurantEntity, IMapper<Restaurant, RestaurantEntity>>, IRestaurantRepository
{
    public RestaurantRepository(
        AppDbContext repositoryDbContext,
        IMapper<Restaurant, RestaurantEntity> repositoryMapper)
        : base(repositoryDbContext, repositoryMapper)
    {
    }
}
