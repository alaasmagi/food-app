using System.Text.Json;
using Domain;
using DTO.Web;
using DTO.Web.Mappers;

namespace Tests;

public class DailyOfferDtoMapperTests
{
    [Fact]
    public void Map_Offer_CopiesTextAndPrice()
    {
        var dto = new DailyOfferDtoMapper().Map(new DailyOfferItem { Text = "Kodune seljanka.", PriceText = "3,90€" });

        Assert.NotNull(dto);
        Assert.Equal("Kodune seljanka.", dto!.OfferText);
        Assert.Equal("3,90€", dto.OfferPrice);
    }

    [Fact]
    public void Map_OfferWithoutPrice_KeepsNullPrice()
    {
        var dto = new DailyOfferDtoMapper().Map(new DailyOfferItem { Text = "Paneeritud lestafilee." });

        Assert.Null(dto!.OfferPrice);
    }

    [Fact]
    public void Map_Null_ReturnsNull()
    {
        Assert.Null(new DailyOfferDtoMapper().Map((DailyOfferItem?)null));
    }

    [Fact]
    public void Map_Dto_CopiesTextAndPriceBack()
    {
        var item = new DailyOfferDtoMapper().Map(new DailyOfferDto { OfferText = "Soup", OfferPrice = "4 €" });

        Assert.Equal("Soup", item!.Text);
        Assert.Equal("4 €", item.PriceText);
    }

    [Fact]
    public void DailyOfferDto_SerializesAsOfferTextAndOfferPrice()
    {
        // The web and mobile clients read exactly these property names.
        var json = JsonSerializer.Serialize(
            new DailyOfferDto { OfferText = "Soup", OfferPrice = null },
            new JsonSerializerOptions(JsonSerializerDefaults.Web));

        Assert.Equal("""{"offerText":"Soup","offerPrice":null}""", json);
    }
}
