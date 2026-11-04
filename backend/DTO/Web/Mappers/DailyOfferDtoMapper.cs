using Base.Contracts.DTO;
using Domain;

namespace DTO.Web.Mappers;

public class DailyOfferDtoMapper : IMapper<DailyOfferDto, DailyOfferItem>
{
    public DailyOfferDto? Map(DailyOfferItem? entity)
    {
        return entity == null ? null : new DailyOfferDto
        {
            OfferText = entity.Text,
            OfferPrice = entity.PriceText
        };
    }

    public IEnumerable<DailyOfferDto>? Map(IEnumerable<DailyOfferItem>? entities)
    {
        return entities?.Select(entity => Map(entity)!);
    }

    public DailyOfferItem? Map(DailyOfferDto? entity)
    {
        return entity == null ? null : new DailyOfferItem
        {
            Text = entity.OfferText,
            PriceText = entity.OfferPrice
        };
    }

    public IEnumerable<DailyOfferItem>? Map(IEnumerable<DailyOfferDto>? entities)
    {
        return entities?.Select(entity => Map(entity)!);
    }
}
