using Domain;
using DTO.Web;
using DTO.Web.Mappers;

namespace Tests;

public class PublicUserWheelDtoMapperTests
{
    [Fact]
    public void Map_Wheel_CopiesOnlyNameAndRestaurantNames()
    {
        var wheel = new UserWheel
        {
            Id = Guid.NewGuid(),
            UserId = Guid.NewGuid(),
            ConcurrencyToken = "token",
            Name = "Lunch Roulette",
            RestaurantNames = ["Place A", "Place B"],
            IsPublic = true
        };

        var dto = new PublicUserWheelDtoMapper().Map(wheel);

        Assert.NotNull(dto);
        Assert.Equal("Lunch Roulette", dto!.Name);
        Assert.Equal(["Place A", "Place B"], dto.RestaurantNames);
    }

    [Fact]
    public void Map_Null_ReturnsNull()
    {
        Assert.Null(new PublicUserWheelDtoMapper().Map((UserWheel?)null));
    }

    [Fact]
    public void PublicUserWheelDto_ExposesOnlyNameAndRestaurantNames()
    {
        // The public surface can only serialize declared/inherited public properties, so guaranteeing
        // the DTO has exactly these two properties guarantees UserId, Id, ConcurrencyToken, and IsPublic
        // can never leak through this endpoint.
        var propertyNames = typeof(PublicUserWheelDto)
            .GetProperties()
            .Select(property => property.Name)
            .OrderBy(name => name)
            .ToArray();

        Assert.Equal(["Name", "RestaurantNames"], propertyNames);
    }
}
