using Base.Domain;

namespace Domain;

public class UserWheel : BaseEntityUserWithConcurrency
{
    public string Name { get; set; } = default!;
    public List<string> RestaurantNames { get; set; } = [];
    public bool IsPublic { get; set; }
}
