using Domain;
using DTO.DataAccess;
using DTO.DataAccess.Mappers;
using DTO.Web;
using DTO.Web.Mappers;

namespace Tests;

public class AppUserMapperTests
{
    [Fact]
    public void EntityMapper_PreservesNotificationPreference_BothDirections()
    {
        var mapper = new AppUserEntityMapper();

        var domain = mapper.Map(new AppUserEntity
        {
            Id = Guid.NewGuid(),
            Email = "user@example.com",
            Username = "user",
            FullName = "User",
            Locale = "et",
            DailyLunchRecommendationsEnabled = true
        });
        Assert.NotNull(domain);
        Assert.True(domain!.DailyLunchRecommendationsEnabled);

        var entity = mapper.Map(new AppUser { DailyLunchRecommendationsEnabled = true });
        Assert.NotNull(entity);
        Assert.True(entity!.DailyLunchRecommendationsEnabled);
    }

    [Fact]
    public void DtoMapper_PreservesNotificationPreference_BothDirections()
    {
        var mapper = new AppUserDtoMapper();

        var dto = mapper.Map(new AppUser { DailyLunchRecommendationsEnabled = true });
        Assert.NotNull(dto);
        Assert.True(dto!.DailyLunchRecommendationsEnabled);

        var domain = mapper.Map(new AppUserDto
        {
            Email = "user@example.com",
            Username = "user",
            FullName = "User",
            Locale = "et",
            DailyLunchRecommendationsEnabled = true
        });
        Assert.NotNull(domain);
        Assert.True(domain!.DailyLunchRecommendationsEnabled);
    }
}
