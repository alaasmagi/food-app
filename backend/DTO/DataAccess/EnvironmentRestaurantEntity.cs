using Base.Domain;

namespace DTO.DataAccess;

public class EnvironmentRestaurantEntity : BaseEntityUserWithMetaConcurrency
{
    public Guid EnvironmentId { get; set; }
    public Guid RestaurantId { get; set; }

    public DiningEnvironmentEntity? Environment { get; set; }
    public RestaurantEntity? Restaurant { get; set; }
}
