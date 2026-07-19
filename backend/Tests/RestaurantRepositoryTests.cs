using DataAccess;
using DataAccess.Context;
using DTO.DataAccess;
using DTO.DataAccess.Mappers;

namespace Tests;

public class RestaurantRepositoryTests
{
    [Fact]
    public async Task GetInBoundsAsync_ReturnsOnlyRestaurantsInsideTheBox()
    {
        await using var context = TestAppDbContextFactory.CreateInMemory();
        var inside = AddRestaurant(context, "Inside", lat: 59.43, lon: 24.75);
        AddRestaurant(context, "North of box", lat: 60.00, lon: 24.75);
        AddRestaurant(context, "East of box", lat: 59.43, lon: 27.00);
        await context.SaveChangesAsync();

        var result = await CreateRepository(context)
            .GetInBoundsAsync(minLat: 59.30, minLon: 24.55, maxLat: 59.58, maxLon: 24.95, limit: 100);

        Assert.Single(result);
        Assert.Equal(inside.Id, result[0].Id);
    }

    [Fact]
    public async Task GetInBoundsAsync_CapsAtLimit_KeepingClosestToCentreFirst()
    {
        await using var context = TestAppDbContextFactory.CreateInMemory();
        // Box centre is (59.44, 24.75). "Near" sits on the centre, "Far" near a corner.
        var near = AddRestaurant(context, "Near centre", lat: 59.44, lon: 24.75);
        AddRestaurant(context, "Far corner", lat: 59.31, lon: 24.56);
        await context.SaveChangesAsync();

        var result = await CreateRepository(context)
            .GetInBoundsAsync(minLat: 59.30, minLon: 24.55, maxLat: 59.58, maxLon: 24.95, limit: 1);

        Assert.Single(result);
        Assert.Equal(near.Id, result[0].Id);
    }

    [Fact]
    public async Task GetInBoundsAsync_ReturnsEmpty_WhenNothingInside()
    {
        await using var context = TestAppDbContextFactory.CreateInMemory();
        AddRestaurant(context, "Elsewhere", lat: 40.00, lon: 10.00);
        await context.SaveChangesAsync();

        var result = await CreateRepository(context)
            .GetInBoundsAsync(minLat: 59.30, minLon: 24.55, maxLat: 59.58, maxLon: 24.95, limit: 100);

        Assert.Empty(result);
    }

    [Fact]
    public async Task SearchPageAsync_FiltersByNameOrCity_CaseInsensitive()
    {
        await using var context = TestAppDbContextFactory.CreateInMemory();
        AddRestaurant(context, "Pizza Place", city: "Tallinn");
        AddRestaurant(context, "Sushi Bar", city: "Tartu");
        AddRestaurant(context, "Burger Joint", city: "PIZZAtown"); // city matches "pizza" too
        await context.SaveChangesAsync();

        var (items, total) = await CreateRepository(context).SearchPageAsync("pIzZa", pageNr: 1, pageSize: 20);

        Assert.Equal(2, total);
        Assert.Equal(new[] { "Burger Joint", "Pizza Place" }, items.Select(r => r.Name)); // ordered by name
    }

    [Fact]
    public async Task SearchPageAsync_WithoutSearch_ReturnsAllOrderedByName()
    {
        await using var context = TestAppDbContextFactory.CreateInMemory();
        AddRestaurant(context, "Charlie", city: "X");
        AddRestaurant(context, "Alpha", city: "X");
        AddRestaurant(context, "Bravo", city: "X");
        await context.SaveChangesAsync();

        var (items, total) = await CreateRepository(context).SearchPageAsync(null, pageNr: 1, pageSize: 20);

        Assert.Equal(3, total);
        Assert.Equal(new[] { "Alpha", "Bravo", "Charlie" }, items.Select(r => r.Name));
    }

    [Fact]
    public async Task SearchPageAsync_PaginatesWithSkipTake_AndReportsFullTotal()
    {
        await using var context = TestAppDbContextFactory.CreateInMemory();
        foreach (var name in new[] { "A", "B", "C", "D", "E" })
        {
            AddRestaurant(context, name, city: "X");
        }
        await context.SaveChangesAsync();

        var (items, total) = await CreateRepository(context).SearchPageAsync(null, pageNr: 2, pageSize: 2);

        Assert.Equal(5, total); // total reflects the whole match set, not the page
        Assert.Equal(new[] { "C", "D" }, items.Select(r => r.Name)); // page 2 of size 2
    }

    private static RestaurantRepository CreateRepository(AppDbContext context)
    {
        return new RestaurantRepository(context, new RestaurantEntityMapper());
    }

    private static RestaurantEntity AddRestaurant(
        AppDbContext context, string name, double lat = 0, double lon = 0, string city = "City")
    {
        var restaurant = new RestaurantEntity
        {
            Id = Guid.NewGuid(),
            Name = name,
            City = city,
            Latitude = lat,
            Longitude = lon,
            OfferTimeText = "11:00-14:00",
            ParkingInfo = "parking",
            OpeningInfo = "opening",
            HasOffers = true
        };
        var now = DateTime.UtcNow;
        restaurant.CreatedBy = "test";
        restaurant.UpdatedBy = "test";
        restaurant.CreatedAt = now;
        restaurant.UpdatedAt = now;
        restaurant.ConcurrencyToken = Guid.NewGuid().ToString("N");
        context.Restaurants.Add(restaurant);
        return restaurant;
    }
}
