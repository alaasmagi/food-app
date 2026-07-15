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
            SendNotifications = true
        });
        Assert.NotNull(domain);
        Assert.True(domain!.SendNotifications);

        var entity = mapper.Map(new AppUser { SendNotifications = true });
        Assert.NotNull(entity);
        Assert.True(entity!.SendNotifications);
    }

    [Fact]
    public void DtoMapper_PreservesNotificationPreference_BothDirections()
    {
        var mapper = new AppUserDtoMapper();

        var dto = mapper.Map(new AppUser { SendNotifications = true });
        Assert.NotNull(dto);
        Assert.True(dto!.SendNotifications);

        var domain = mapper.Map(new AppUserDto
        {
            Email = "user@example.com",
            Username = "user",
            FullName = "User",
            Locale = "et",
            SendNotifications = true
        });
        Assert.NotNull(domain);
        Assert.True(domain!.SendNotifications);
    }
}
