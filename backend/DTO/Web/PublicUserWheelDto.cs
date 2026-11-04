namespace DTO.Web;

/// <summary>
/// Public view of a shared wheel; deliberately carries no Id, UserId, ConcurrencyToken or IsPublic.
/// </summary>
public class PublicUserWheelDto
{
    public string Name { get; set; } = default!;

    public List<string> RestaurantNames { get; set; } = [];
}
