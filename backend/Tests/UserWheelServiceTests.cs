using Application;
using Base.DTO;
using DataAccess;
using DataAccess.Context;
using DTO.DataAccess;
using DTO.DataAccess.Mappers;

namespace Tests;

public class UserWheelServiceTests
{
    [Fact]
    public async Task GetPublicByIdAsync_PublicWheel_ReturnsNameAndRestaurantNames()
    {
        await using var context = TestAppDbContextFactory.CreateInMemory();
        var wheel = AddWheel(context, isPublic: true, name: "Lunch Roulette", restaurantNames: ["Place A", "Place B"]);
        await context.SaveChangesAsync();

        var result = await CreateService(context).GetPublicByIdAsync(wheel.Id);

        Assert.True(result.Successful);
        Assert.Equal("Lunch Roulette", result.Value!.Name);
        Assert.Equal(["Place A", "Place B"], result.Value.RestaurantNames);
    }

    [Fact]
    public async Task GetPublicByIdAsync_NonPublicWheel_ReturnsNotFound()
    {
        await using var context = TestAppDbContextFactory.CreateInMemory();
        var wheel = AddWheel(context, isPublic: false, name: "Private", restaurantNames: ["Place A"]);
        await context.SaveChangesAsync();

        var result = await CreateService(context).GetPublicByIdAsync(wheel.Id);

        Assert.False(result.Successful);
        Assert.Equal(ErrorDefaults.Codes.NotFound, result.Error!.Code);
    }

    [Fact]
    public async Task GetPublicByIdAsync_MissingWheel_ReturnsNotFound()
    {
        await using var context = TestAppDbContextFactory.CreateInMemory();

        var result = await CreateService(context).GetPublicByIdAsync(Guid.NewGuid());

        Assert.False(result.Successful);
        Assert.Equal(ErrorDefaults.Codes.NotFound, result.Error!.Code);
    }

    [Fact]
    public async Task GetPublicByIdAsync_NonPublicAndMissing_AreIndistinguishable()
    {
        await using var context = TestAppDbContextFactory.CreateInMemory();
        var nonPublic = AddWheel(context, isPublic: false, name: "Private", restaurantNames: ["Place A"]);
        await context.SaveChangesAsync();

        var service = CreateService(context);
        var nonPublicResult = await service.GetPublicByIdAsync(nonPublic.Id);
        var missingResult = await service.GetPublicByIdAsync(Guid.NewGuid());

        // A non-public wheel and a non-existent id must fail identically so ids cannot be enumerated.
        Assert.False(nonPublicResult.Successful);
        Assert.False(missingResult.Successful);
        Assert.Equal(missingResult.Error!.Code, nonPublicResult.Error!.Code);
        Assert.Equal(missingResult.Error.Message, nonPublicResult.Error.Message);
    }

    private static UserWheelService CreateService(AppDbContext context)
    {
        return new UserWheelService(
            new UserWheelRepository(context, new UserWheelEntityMapper()),
            new DataAccessUow(context),
            new UserWheelIdentityMapper());
    }

    private static UserWheelEntity AddWheel(
        AppDbContext context,
        bool isPublic,
        string name,
        List<string> restaurantNames)
    {
        var now = DateTime.UtcNow;
        var wheel = new UserWheelEntity
        {
            Id = Guid.NewGuid(),
            UserId = Guid.NewGuid(),
            Name = name,
            RestaurantNames = restaurantNames,
            IsPublic = isPublic,
            CreatedBy = "test",
            UpdatedBy = "test",
            CreatedAt = now,
            UpdatedAt = now,
            ConcurrencyToken = Guid.NewGuid().ToString("N")
        };
        context.UserWheels.Add(wheel);
        return wheel;
    }
}
