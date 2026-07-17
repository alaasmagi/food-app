namespace DTO.Web;

/// <summary>
/// Deliberately minimal public projection of a shared <see cref="Domain.UserWheel"/>. It does NOT
/// inherit any BaseEntity type, so it carries no Id, UserId, ConcurrencyToken, or IsPublic - the public
/// read surface exposes only the wheel's display name and its frozen restaurant-name snapshot.
/// </summary>
public class PublicUserWheelDto
{
    public string Name { get; set; } = default!;

    public List<string> RestaurantNames { get; set; } = [];
}
