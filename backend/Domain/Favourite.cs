using Base.Domain;

namespace Domain;

public class Favourite : BaseEntityUserWithConcurrency
{
    public Guid RestaurantId { get; set; }
    public int Rating { get; set; }
    public string? Note { get; set; }
}
