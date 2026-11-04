using Application;
using Contracts.Application;
using DataAccess;
using DataAccess.Context;
using Domain;
using DTO.DataAccess.Mappers;
using Microsoft.EntityFrameworkCore;

namespace Tests;

public class OfferProviderServiceTests
{
    [Fact]
    public async Task CreateAsync_InvalidLocator_ReturnsValidationErrorAndDoesNotPersist()
    {
        await using var context = TestAppDbContextFactory.CreateInMemory();
        var provider = OfferProviderTests.CreateProvider(EOfferProviderType.Html, "div.menu li", ".name", ".price");

        var result = await CreateService(context).CreateAsync(provider);

        Assert.False(result.Successful);
        Assert.Equal(OfferProviderErrorCodes.LocatorValidation, result.Error!.Code);
        Assert.False(await context.OfferProviders.AnyAsync());
    }

    [Fact]
    public async Task CreateAsync_ValidLocator_Persists()
    {
        await using var context = TestAppDbContextFactory.CreateInMemory();
        var provider = OfferProviderTests.CreateProvider(EOfferProviderType.Api, "foods > menu", "name", "price");

        var result = await CreateService(context).CreateAsync(provider);

        Assert.True(result.Successful);
        Assert.True(await context.OfferProviders.AnyAsync());
    }

    [Fact]
    public async Task UpdateAsync_InvalidLocator_ReturnsValidationError()
    {
        await using var context = TestAppDbContextFactory.CreateInMemory();
        var provider = OfferProviderTests.CreateProvider(EOfferProviderType.Api, "a > > b", "name", "price");

        var result = await CreateService(context).UpdateAsync(provider.Id, provider, "token");

        Assert.False(result.Successful);
        Assert.Equal(OfferProviderErrorCodes.LocatorValidation, result.Error!.Code);
    }

    private static OfferProviderService CreateService(AppDbContext context)
    {
        return new OfferProviderService(
            new OfferProviderRepository(context, new OfferProviderEntityMapper()),
            new DataAccessUow(context),
            new OfferProviderIdentityMapper());
    }
}
