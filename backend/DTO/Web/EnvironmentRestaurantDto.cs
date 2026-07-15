using Base.Domain;

namespace DTO.Web;

public class EnvironmentRestaurantDto : BaseEntityWithConcurrency
{
    public Guid EnvironmentId { get; set; }
    public Guid RestaurantId { get; set; }
}
