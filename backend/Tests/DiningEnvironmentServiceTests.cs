using Application;
using Base.DTO;
using Contracts.Application;
using DataAccess;
using DataAccess.Context;
using Domain;
using DTO.DataAccess;
using DTO.DataAccess.Mappers;
using Microsoft.EntityFrameworkCore;

namespace Tests;

public class DiningEnvironmentServiceTests
{
    [Fact]
    public async Task RemoveAsync_ReferencedByNotificationScope_ClearsScopeAndDeletes()
    {
        await using var context = TestAppDbContextFactory.CreateInMemory();
        var actorId = Guid.NewGuid();
        var environment = AddEnvironment(context, actorId);
        AddUser(context, actorId, notificationEnvironmentId: environment.Id);
        await context.SaveChangesAsync();

        var service = CreateService(context);
        var result = await service.RemoveAsync(environment.Id, environment.ConcurrencyToken, actorId);

        Assert.True(result.Successful);
        Assert.True(result.Value);

        var user = await new AppUserRepository(context, new AppUserEntityMapper()).GetByIdAsync(actorId);
        Assert.Null(user!.NotificationEnvironmentId);
    }

    [Fact]
    public async Task RemoveAsync_NotReferenced_LeavesOtherUsersScopeUnchanged()
    {
        await using var context = TestAppDbContextFactory.CreateInMemory();
        var actorId = Guid.NewGuid();
        var deletedEnvironment = AddEnvironment(context, actorId);
        var otherEnvironment = AddEnvironment(context, actorId);
        // A different user keeps their scope pointed at an unrelated environment.
        var otherUserId = Guid.NewGuid();
        AddUser(context, otherUserId, notificationEnvironmentId: otherEnvironment.Id);
        await context.SaveChangesAsync();

        var service = CreateService(context);
        var result = await service.RemoveAsync(deletedEnvironment.Id, deletedEnvironment.ConcurrencyToken, actorId);

        Assert.True(result.Successful);

        var otherUser = await new AppUserRepository(context, new AppUserEntityMapper()).GetByIdAsync(otherUserId);
        Assert.Equal(otherEnvironment.Id, otherUser!.NotificationEnvironmentId);
    }

    private static DiningEnvironmentService CreateService(AppDbContext context)
    {
        return new DiningEnvironmentService(
            new DiningEnvironmentRepository(context, new DiningEnvironmentEntityMapper()),
            new AppUserRepository(context, new AppUserEntityMapper()),
            new RestaurantRepository(context, new RestaurantEntityMapper()),
            new EnvironmentRestaurantRepository(context, new EnvironmentRestaurantEntityMapper()),
            new DataAccessUow(context),
            new DiningEnvironmentIdentityMapper());
    }

    private static void AddUser(AppDbContext context, Guid id, Guid? notificationEnvironmentId)
    {
        var now = DateTime.UtcNow;
        context.AppUsers.Add(new AppUserEntity
        {
            Id = id,
            Email = $"{id:N}@example.com",
            Username = id.ToString("N"),
            FullName = "Test User",
            Locale = "et",
            SendNotifications = true,
            NotificationEnvironmentId = notificationEnvironmentId,
            CreatedBy = "test",
            UpdatedBy = "test",
            CreatedAt = now,
            UpdatedAt = now,
            ConcurrencyToken = Guid.NewGuid().ToString("N")
        });
    }

    private static DiningEnvironmentEntity AddEnvironment(
        AppDbContext context,
        Guid userId,
        double? autoFillLatitude = null,
        double? autoFillLongitude = null,
        int? autoFillRadiusMeters = null)
    {
        var now = DateTime.UtcNow;
        var environment = new DiningEnvironmentEntity
        {
            Id = Guid.NewGuid(),
            Name = "Env",
            UserId = userId,
            AutoFillLatitude = autoFillLatitude,
            AutoFillLongitude = autoFillLongitude,
            AutoFillRadiusMeters = autoFillRadiusMeters,
            CreatedBy = "test",
            UpdatedBy = "test",
            CreatedAt = now,
            UpdatedAt = now,
            ConcurrencyToken = Guid.NewGuid().ToString("N")
        };
        context.DiningEnvironments.Add(environment);
        return environment;
    }

    private static RestaurantEntity AddRestaurant(AppDbContext context, double lat, double lon)
    {
        var now = DateTime.UtcNow;
        var restaurant = new RestaurantEntity
        {
            Id = Guid.NewGuid(),
            Name = "Restaurant",
            City = "City",
            Latitude = lat,
            Longitude = lon,
            OfferTimeText = "11:00-14:00",
            ParkingInfo = "parking",
            OpeningInfo = "opening",
            HasOffers = true,
            CreatedBy = "test",
            UpdatedBy = "test",
            CreatedAt = now,
            UpdatedAt = now,
            ConcurrencyToken = Guid.NewGuid().ToString("N")
        };
        context.Restaurants.Add(restaurant);
        return restaurant;
    }

    private static void AddMembership(AppDbContext context, Guid userId, Guid environmentId, Guid restaurantId)
    {
        var now = DateTime.UtcNow;
        context.EnvironmentRestaurants.Add(new EnvironmentRestaurantEntity
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            EnvironmentId = environmentId,
            RestaurantId = restaurantId,
            CreatedBy = "test",
            UpdatedBy = "test",
            CreatedAt = now,
            UpdatedAt = now,
            ConcurrencyToken = Guid.NewGuid().ToString("N")
        });
    }

    // Roughly 111m north of the origin used across the auto-fill tests (well inside the 500m default).
    private const double OriginLat = 59.4370;
    private const double OriginLon = 24.7536;

    [Fact]
    public async Task CreateAsync_LatitudeWithoutLongitude_FailsValidation()
    {
        await using var context = TestAppDbContextFactory.CreateInMemory();
        var service = CreateService(context);

        var result = await service.CreateAsync(
            new DiningEnvironment { Name = "Env", AutoFillLatitude = OriginLat },
            Guid.NewGuid());

        Assert.False(result.Successful);
        Assert.Equal(DiningEnvironmentErrorCodes.AutoFillValidation, result.Error!.Code);
    }

    [Fact]
    public async Task CreateAsync_RadiusWithoutCoordinates_FailsValidation()
    {
        await using var context = TestAppDbContextFactory.CreateInMemory();
        var service = CreateService(context);

        var result = await service.CreateAsync(
            new DiningEnvironment { Name = "Env", AutoFillRadiusMeters = 500 },
            Guid.NewGuid());

        Assert.False(result.Successful);
        Assert.Equal(DiningEnvironmentErrorCodes.AutoFillValidation, result.Error!.Code);
    }

    [Theory]
    [InlineData(91.0, 24.0)]   // latitude above range
    [InlineData(-91.0, 24.0)]  // latitude below range
    [InlineData(59.0, 181.0)]  // longitude above range
    [InlineData(59.0, -181.0)] // longitude below range
    public async Task CreateAsync_OutOfRangeCoordinates_FailsValidation(double lat, double lon)
    {
        await using var context = TestAppDbContextFactory.CreateInMemory();
        var service = CreateService(context);

        var result = await service.CreateAsync(
            new DiningEnvironment { Name = "Env", AutoFillLatitude = lat, AutoFillLongitude = lon },
            Guid.NewGuid());

        Assert.False(result.Successful);
        Assert.Equal(DiningEnvironmentErrorCodes.AutoFillValidation, result.Error!.Code);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(50001)]
    public async Task CreateAsync_OutOfRangeRadius_FailsValidation(int radius)
    {
        await using var context = TestAppDbContextFactory.CreateInMemory();
        var service = CreateService(context);

        var result = await service.CreateAsync(
            new DiningEnvironment
            {
                Name = "Env",
                AutoFillLatitude = OriginLat,
                AutoFillLongitude = OriginLon,
                AutoFillRadiusMeters = radius
            },
            Guid.NewGuid());

        Assert.False(result.Successful);
        Assert.Equal(DiningEnvironmentErrorCodes.AutoFillValidation, result.Error!.Code);
    }

    [Fact]
    public async Task CreateAsync_CoordinatesWithoutRadius_PersistsNullRadius()
    {
        await using var context = TestAppDbContextFactory.CreateInMemory();
        var service = CreateService(context);

        var result = await service.CreateAsync(
            new DiningEnvironment { Name = "Env", AutoFillLatitude = OriginLat, AutoFillLongitude = OriginLon },
            Guid.NewGuid());

        Assert.True(result.Successful);
        Assert.Null(result.Value!.AutoFillRadiusMeters);

        var stored = await context.DiningEnvironments.FindAsync(result.Value.Id);
        Assert.NotNull(stored);
        Assert.Null(stored!.AutoFillRadiusMeters);
    }

    [Fact]
    public async Task AutoFillAsync_AddsInRadiusRestaurants_AndSkipsOutOfRadius()
    {
        await using var context = TestAppDbContextFactory.CreateInMemory();
        var actorId = Guid.NewGuid();
        var environment = AddEnvironment(context, actorId, OriginLat, OriginLon, autoFillRadiusMeters: 500);
        var near = AddRestaurant(context, OriginLat + 0.001, OriginLon); // ~111m away
        AddRestaurant(context, OriginLat + 0.05, OriginLon);             // ~5.5km away
        await context.SaveChangesAsync();

        var service = CreateService(context);
        var result = await service.AutoFillAsync(environment.Id, actorId);

        Assert.True(result.Successful);
        Assert.Equal(1, result.Value!.Added);
        Assert.Equal(0, result.Value.AlreadyPresent);
        Assert.Equal(1, result.Value.TotalMembers);

        var members = await context.EnvironmentRestaurants
            .Where(er => er.EnvironmentId == environment.Id)
            .Select(er => er.RestaurantId)
            .ToListAsync();
        Assert.Equal(new[] { near.Id }, members);
    }

    [Fact]
    public async Task AutoFillAsync_NullRadius_UsesFiveHundredMeterDefault()
    {
        await using var context = TestAppDbContextFactory.CreateInMemory();
        var actorId = Guid.NewGuid();
        var environment = AddEnvironment(context, actorId, OriginLat, OriginLon); // radius null
        AddRestaurant(context, OriginLat + 0.001, OriginLon);  // ~111m: inside 500m
        AddRestaurant(context, OriginLat + 0.006, OriginLon);  // ~668m: outside 500m
        await context.SaveChangesAsync();

        var service = CreateService(context);
        var result = await service.AutoFillAsync(environment.Id, actorId);

        Assert.True(result.Successful);
        Assert.Equal(1, result.Value!.Added);
    }

    [Fact]
    public async Task AutoFillAsync_DoesNotDuplicate_AndRetainsOutOfRadiusMembers()
    {
        await using var context = TestAppDbContextFactory.CreateInMemory();
        var actorId = Guid.NewGuid();
        var environment = AddEnvironment(context, actorId, OriginLat, OriginLon, autoFillRadiusMeters: 500);
        var near = AddRestaurant(context, OriginLat + 0.001, OriginLon); // in radius, already a member
        var far = AddRestaurant(context, OriginLat + 0.05, OriginLon);   // out of radius, already a member
        AddMembership(context, actorId, environment.Id, near.Id);
        AddMembership(context, actorId, environment.Id, far.Id);
        await context.SaveChangesAsync();

        var service = CreateService(context);
        var result = await service.AutoFillAsync(environment.Id, actorId);

        Assert.True(result.Successful);
        Assert.Equal(0, result.Value!.Added);
        Assert.Equal(1, result.Value.AlreadyPresent); // only the in-radius one counts as "already present"
        Assert.Equal(2, result.Value.TotalMembers);

        var memberCount = await context.EnvironmentRestaurants.CountAsync(er => er.EnvironmentId == environment.Id);
        Assert.Equal(2, memberCount); // far member retained, near not duplicated
    }

    [Fact]
    public async Task AutoFillAsync_WithoutStoredCoordinates_ReturnsLocationRequired()
    {
        await using var context = TestAppDbContextFactory.CreateInMemory();
        var actorId = Guid.NewGuid();
        var environment = AddEnvironment(context, actorId); // no coordinates
        await context.SaveChangesAsync();

        var service = CreateService(context);
        var result = await service.AutoFillAsync(environment.Id, actorId);

        Assert.False(result.Successful);
        Assert.Equal(DiningEnvironmentErrorCodes.AutoFillLocationRequired, result.Error!.Code);
    }

    [Fact]
    public async Task AutoFillAsync_AnotherUsersEnvironment_IsForbidden()
    {
        await using var context = TestAppDbContextFactory.CreateInMemory();
        var ownerId = Guid.NewGuid();
        var environment = AddEnvironment(context, ownerId, OriginLat, OriginLon, autoFillRadiusMeters: 500);
        AddRestaurant(context, OriginLat + 0.001, OriginLon);
        await context.SaveChangesAsync();

        var service = CreateService(context);
        var result = await service.AutoFillAsync(environment.Id, Guid.NewGuid());

        Assert.False(result.Successful);
        Assert.Equal(ErrorDefaults.Codes.Forbidden, result.Error!.Code);

        var memberCount = await context.EnvironmentRestaurants.CountAsync(er => er.EnvironmentId == environment.Id);
        Assert.Equal(0, memberCount);
    }

    [Fact]
    public async Task AutoFillAsync_MissingEnvironment_IsNotFound()
    {
        await using var context = TestAppDbContextFactory.CreateInMemory();
        var service = CreateService(context);

        var result = await service.AutoFillAsync(Guid.NewGuid(), Guid.NewGuid());

        Assert.False(result.Successful);
        Assert.Equal(ErrorDefaults.Codes.NotFound, result.Error!.Code);
    }
}
