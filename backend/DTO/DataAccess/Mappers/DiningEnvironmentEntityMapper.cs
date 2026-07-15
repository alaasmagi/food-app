using Base.Contracts.DTO;
using Domain;

namespace DTO.DataAccess.Mappers;

public class DiningEnvironmentEntityMapper : IMapper<DiningEnvironment, DiningEnvironmentEntity>
{
    public DiningEnvironment? Map(DiningEnvironmentEntity? entity)
    {
        return entity == null ? null : new DiningEnvironment
        {
            Id = entity.Id,
            ConcurrencyToken = entity.ConcurrencyToken,
            UserId = entity.UserId,
            Name = entity.Name,
            Description = entity.Description,
        };
    }

    public IEnumerable<DiningEnvironment>? Map(IEnumerable<DiningEnvironmentEntity>? entities)
    {
        return entities?.Select(entity => Map(entity)!);
    }

    public DiningEnvironmentEntity? Map(DiningEnvironment? entity)
    {
        return entity == null ? null : new DiningEnvironmentEntity
        {
            Id = entity.Id,
            ConcurrencyToken = entity.ConcurrencyToken,
            UserId = entity.UserId,
            Name = entity.Name,
            Description = entity.Description,
        };
    }

    public IEnumerable<DiningEnvironmentEntity>? Map(IEnumerable<DiningEnvironment>? entities)
    {
        return entities?.Select(entity => Map(entity)!);
    }
}
