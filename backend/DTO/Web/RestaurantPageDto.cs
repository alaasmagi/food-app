namespace DTO.Web;

/// <summary>
/// Response envelope for the paginated, searchable restaurant list (GET /api/v1/restaurants/page).
/// Distinct from the bare-array GetAll response so pagination metadata can travel with the items.
/// </summary>
public class RestaurantPageDto
{
    public IEnumerable<RestaurantDto> Items { get; set; } = [];
    public int Total { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
}
