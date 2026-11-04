namespace DTO.Web;

/// <summary>
/// One daily offer line returned by GET /api/v1/restaurants/{restaurantId}/offers.
/// </summary>
public class DailyOfferDto
{
    public string OfferText { get; set; } = default!;

    public string? OfferPrice { get; set; }
}
