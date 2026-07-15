using Base.Contracts.DTO;
using Base.DataAccess.EF;
using Contracts.DataAccess;
using DataAccess.Context;
using Domain;
using DTO.DataAccess;

namespace DataAccess;

public class DiningEnvironmentRepository
    : BaseRepository<DiningEnvironment, DiningEnvironmentEntity, IMapper<DiningEnvironment, DiningEnvironmentEntity>>,
        IDiningEnvironmentRepository
{
    public DiningEnvironmentRepository(
        AppDbContext repositoryDbContext,
        IMapper<DiningEnvironment, DiningEnvironmentEntity> repositoryMapper)
        : base(repositoryDbContext, repositoryMapper)
    {
    }
}
