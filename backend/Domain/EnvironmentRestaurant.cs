using Base.Domain;

namespace Domain;

public class EnvironmentRestaurant : BaseEntityUserWithConcurrency
{
    public Guid EnvironmentId { get; set; }
    public Guid RestaurantId { get; set; }
}
