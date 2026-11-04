namespace DTO.Web;

/// <summary>
/// One page of the searchable restaurant list with pagination metadata.
/// </summary>
public class RestaurantPageDto
{
    public IEnumerable<RestaurantDto> Items { get; set; } = [];
    public int Total { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
}
