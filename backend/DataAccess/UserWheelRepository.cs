using Base.Contracts.DTO;
using Base.DataAccess.EF;
using Contracts.DataAccess;
using DataAccess.Context;
using Domain;
using DTO.DataAccess;

namespace DataAccess;

public class UserWheelRepository
    : BaseRepository<UserWheel, UserWheelEntity, IMapper<UserWheel, UserWheelEntity>>, IUserWheelRepository
{
    public UserWheelRepository(
        AppDbContext repositoryDbContext,
        IMapper<UserWheel, UserWheelEntity> repositoryMapper)
        : base(repositoryDbContext, repositoryMapper)
    {
    }
}
