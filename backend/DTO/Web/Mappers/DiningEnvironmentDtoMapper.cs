using Base.Contracts.DTO;
using Domain;

namespace DTO.Web.Mappers;

public class DiningEnvironmentDtoMapper : IMapper<DiningEnvironmentDto, DiningEnvironment>
{
    public DiningEnvironmentDto? Map(DiningEnvironment? entity)
    {
        return entity == null ? null : new DiningEnvironmentDto
        {
            Id = entity.Id,
            ConcurrencyToken = entity.ConcurrencyToken,
            Name = entity.Name,
            Description = entity.Description,
        };
    }

    public IEnumerable<DiningEnvironmentDto>? Map(IEnumerable<DiningEnvironment>? entities)
    {
        return entities?.Select(entity => Map(entity)!);
    }

    public DiningEnvironment? Map(DiningEnvironmentDto? entity)
    {
        return entity == null ? null : new DiningEnvironment
        {
            Id = entity.Id == Guid.Empty ? Guid.NewGuid() : entity.Id,
            ConcurrencyToken = entity.ConcurrencyToken ?? string.Empty,
            Name = entity.Name,
            Description = entity.Description,
        };
    }

    public IEnumerable<DiningEnvironment>? Map(IEnumerable<DiningEnvironmentDto>? entities)
    {
        return entities?.Select(entity => Map(entity)!);
    }
}
