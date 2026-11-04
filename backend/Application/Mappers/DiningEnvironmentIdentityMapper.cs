using Base.Contracts.DTO;
using Domain;

namespace Application.Mappers;

public class DiningEnvironmentIdentityMapper : IMapper<DiningEnvironment, DiningEnvironment>
{
    public DiningEnvironment? Map(DiningEnvironment? entity)
    {
        return entity;
    }

    public IEnumerable<DiningEnvironment>? Map(IEnumerable<DiningEnvironment>? entities)
    {
        return entities;
    }
}
