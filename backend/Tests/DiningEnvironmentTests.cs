using Domain;

namespace Tests;

public class DiningEnvironmentTests
{
    [Theory]
    [InlineData(null, null, null)]
    [InlineData(59.43, 24.75, null)]
    [InlineData(59.43, 24.75, 1)]
    [InlineData(-90.0, 180.0, 50000)]
    public void ValidateAutoFillFields_ValidOrigin_ReturnsNull(double? lat, double? lon, int? radius)
    {
        Assert.Null(Create(lat, lon, radius).ValidateAutoFillFields());
    }

    [Theory]
    [InlineData(59.43, null, null, "AutoFillLatitude and AutoFillLongitude must be provided together.")]
    [InlineData(null, null, 500, "AutoFillRadiusMeters requires AutoFillLatitude and AutoFillLongitude to be set.")]
    [InlineData(91.0, 24.75, null, "AutoFillLatitude must be between -90 and 90 degrees.")]
    [InlineData(59.43, -181.0, null, "AutoFillLongitude must be between -180 and 180 degrees.")]
    [InlineData(59.43, 24.75, 0, "AutoFillRadiusMeters must be between 1 and 50000 meters.")]
    [InlineData(59.43, 24.75, 50001, "AutoFillRadiusMeters must be between 1 and 50000 meters.")]
    public void ValidateAutoFillFields_InvalidOrigin_ReturnsMessage(double? lat, double? lon, int? radius, string expected)
    {
        Assert.Equal(expected, Create(lat, lon, radius).ValidateAutoFillFields());
    }

    private static DiningEnvironment Create(double? lat, double? lon, int? radius)
    {
        return new DiningEnvironment
        {
            Name = "Office",
            AutoFillLatitude = lat,
            AutoFillLongitude = lon,
            AutoFillRadiusMeters = radius
        };
    }
}
