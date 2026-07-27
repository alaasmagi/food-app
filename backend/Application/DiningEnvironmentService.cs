using Base.Application;
using Base.Contracts.DTO;
using Base.DTO;
using Contracts.Application;
using Contracts.DataAccess;
using Domain;

namespace Application;

public class DiningEnvironmentIdentityMapper : IMapper<DiningEnvironment, DiningEnvironment>
{
    public DiningEnvironment? Map(DiningEnvironment? entity)
    {
        return entity;
    }

    public IEnumerable<DiningEnvironment>? Map(IEnumerable<DiningEnvironment>? entities)
    {
        return entities;
    }
}

public class DiningEnvironmentService
    : BaseService<DiningEnvironment, DiningEnvironment, IDiningEnvironmentRepository>, IDiningEnvironmentService
{
    // Effective radius used when an environment has coordinates but no stored radius. Applied only
    // here, at auto-fill time - a null radius is never persisted as this value (see design.md).
    private const int DefaultAutoFillRadiusMeters = 500;
    private const int MinAutoFillRadiusMeters = 1;
    private const int MaxAutoFillRadiusMeters = 50000;
    private const double MetersPerDegreeLatitude = 111_320.0;
    private const double EarthRadiusMeters = 6_371_000.0;

    private readonly IDiningEnvironmentRepository _diningEnvironmentRepository;
    private readonly IAppUserRepository _appUserRepository;
    private readonly IRestaurantRepository _restaurantRepository;
    private readonly IEnvironmentRestaurantRepository _environmentRestaurantRepository;

    public DiningEnvironmentService(
        IDiningEnvironmentRepository diningEnvironmentRepository,
        IAppUserRepository appUserRepository,
        IRestaurantRepository restaurantRepository,
        IEnvironmentRestaurantRepository environmentRestaurantRepository,
        Base.Contracts.DataAccess.IBaseUow uow,
        IMapper<DiningEnvironment, DiningEnvironment> mapper)
        : base(uow, diningEnvironmentRepository, mapper)
    {
        _diningEnvironmentRepository = diningEnvironmentRepository;
        _appUserRepository = appUserRepository;
        _restaurantRepository = restaurantRepository;
        _environmentRestaurantRepository = environmentRestaurantRepository;
    }

    public override async Task<IMethodResponse<DiningEnvironment>> CreateAsync(DiningEnvironment entity, Guid actor = default)
    {
        var validationError = ValidateAutoFillFields(entity);
        if (validationError != null)
        {
            return MethodResponse<DiningEnvironment>.Failure(validationError);
        }

        return await base.CreateAsync(entity, actor);
    }

    public override async Task<IMethodResponse<DiningEnvironment>> GetByIdAsync(Guid id, Guid actor = default)
    {
        var ownershipError = await CheckOwnershipAsync(id, actor);
        if (ownershipError != null)
        {
            return MethodResponse<DiningEnvironment>.Failure(ownershipError);
        }

        return await base.GetByIdAsync(id, actor);
    }

    public override async Task<IMethodResponse<DiningEnvironment>> UpdateAsync(
        Guid id,
        DiningEnvironment entity,
        string? expectedConcurrencyToken = default,
        Guid actor = default)
    {
        var validationError = ValidateAutoFillFields(entity);
        if (validationError != null)
        {
            return MethodResponse<DiningEnvironment>.Failure(validationError);
        }

        var ownershipError = await CheckOwnershipAsync(id, actor);
        if (ownershipError != null)
        {
            return MethodResponse<DiningEnvironment>.Failure(ownershipError);
        }

        return await base.UpdateAsync(id, entity, expectedConcurrencyToken, actor);
    }

    public override async Task<IMethodResponse<bool>> RemoveAsync(
        Guid id,
        string? expectedConcurrencyToken = default,
        Guid actor = default)
    {
        var ownershipError = await CheckOwnershipAsync(id, actor);
        if (ownershipError != null)
        {
            return MethodResponse<bool>.Failure(ownershipError);
        }

        var removeResult = await base.RemoveAsync(id, expectedConcurrencyToken, actor);
        if (removeResult.Successful && removeResult.Value)
        {
            // Clear the notification scope of any user that pointed at this environment.
            await _appUserRepository.ClearNotificationEnvironmentAsync(id);
        }

        return removeResult;
    }

    /// <summary>
    /// BaseRepository's actor scoping would already return NOT_FOUND for a foreign-owned row before any
    /// ownership check runs, so this fetches unscoped first to distinguish "does not exist" from
    /// "exists but belongs to someone else" and report FORBIDDEN for the latter (see design.md Decision 3).
    /// </summary>
    private async Task<IError?> CheckOwnershipAsync(Guid id, Guid actor)
    {
        var unscopedResponse = await _diningEnvironmentRepository.GetByIdAsync(id);
        if (!unscopedResponse.Successful || unscopedResponse.Value == null)
        {
            return new Error(ErrorDefaults.Codes.NotFound, ErrorDefaults.Messages.NotFound);
        }

        if (unscopedResponse.Value.UserId != actor)
        {
            return new Error(ErrorDefaults.Codes.Forbidden, ErrorDefaults.Messages.Forbidden);
        }

        return null;
    }

    public async Task<IMethodResponse<DiningEnvironmentAutoFillResult>> AutoFillAsync(Guid id, Guid actor = default)
    {
        // Owner-scoping first: NOT_FOUND vs FORBIDDEN, same unscoped-fetch pattern as the CRUD path.
        var ownershipError = await CheckOwnershipAsync(id, actor);
        if (ownershipError != null)
        {
            return MethodResponse<DiningEnvironmentAutoFillResult>.Failure(ownershipError);
        }

        var environmentResponse = await _diningEnvironmentRepository.GetByIdAsync(id);
        var environment = environmentResponse.Value!; // CheckOwnershipAsync guarantees it exists and is owned.

        if (environment.AutoFillLatitude == null || environment.AutoFillLongitude == null)
        {
            return MethodResponse<DiningEnvironmentAutoFillResult>.Failure(new Error(
                DiningEnvironmentErrorCodes.AutoFillLocationRequired,
                "Auto-fill is unavailable without a stored location. Set AutoFillLatitude and AutoFillLongitude on the environment first."));
        }

        var originLat = environment.AutoFillLatitude.Value;
        var originLon = environment.AutoFillLongitude.Value;
        var radiusMeters = environment.AutoFillRadiusMeters ?? DefaultAutoFillRadiusMeters;

        // Indexed bounding-box pre-filter, then exact great-circle test in memory. Restaurant
        // coordinates are non-nullable, so every restaurant participates; the exact test trims the
        // box corners that lie outside the true radius.
        var (minLat, minLon, maxLat, maxLon) = BoundingBox(originLat, originLon, radiusMeters);
        var candidates = await _restaurantRepository.GetAllInBoundsAsync(minLat, minLon, maxLat, maxLon);

        var inRadiusRestaurantIds = candidates
            .Where(restaurant => HaversineMeters(originLat, originLon, restaurant.Latitude, restaurant.Longitude) <= radiusMeters)
            .Select(restaurant => restaurant.Id)
            .ToList();

        var existingRestaurantIds = (await _environmentRestaurantRepository.GetRestaurantIdsForEnvironmentAsync(id)).ToHashSet();
        var toAdd = inRadiusRestaurantIds.Where(restaurantId => !existingRestaurantIds.Contains(restaurantId)).ToList();
        var alreadyPresent = inRadiusRestaurantIds.Count - toAdd.Count;

        var added = await _environmentRestaurantRepository.AddMembershipsAsync(id, actor, toAdd);
        var totalMembers = existingRestaurantIds.Count + added;

        return MethodResponse<DiningEnvironmentAutoFillResult>.Success(
            new DiningEnvironmentAutoFillResult(added, alreadyPresent, totalMembers));
    }

    /// <summary>
    /// Enforces the auto-fill origin write rules: coordinates are both-or-neither, a radius requires
    /// coordinates, and supplied coordinates/radius stay within valid ranges. Returns null when valid.
    /// A null radius alongside coordinates is valid and is persisted as null (the 500m default is
    /// applied only at auto-fill time).
    /// </summary>
    private static IError? ValidateAutoFillFields(DiningEnvironment entity)
    {
        var hasLatitude = entity.AutoFillLatitude.HasValue;
        var hasLongitude = entity.AutoFillLongitude.HasValue;

        if (hasLatitude != hasLongitude)
        {
            return AutoFillValidationError("AutoFillLatitude and AutoFillLongitude must be provided together.");
        }

        if (entity.AutoFillRadiusMeters.HasValue && !(hasLatitude && hasLongitude))
        {
            return AutoFillValidationError("AutoFillRadiusMeters requires AutoFillLatitude and AutoFillLongitude to be set.");
        }

        if (hasLatitude && (entity.AutoFillLatitude!.Value < -90 || entity.AutoFillLatitude.Value > 90))
        {
            return AutoFillValidationError("AutoFillLatitude must be between -90 and 90 degrees.");
        }

        if (hasLongitude && (entity.AutoFillLongitude!.Value < -180 || entity.AutoFillLongitude.Value > 180))
        {
            return AutoFillValidationError("AutoFillLongitude must be between -180 and 180 degrees.");
        }

        if (entity.AutoFillRadiusMeters.HasValue &&
            (entity.AutoFillRadiusMeters.Value < MinAutoFillRadiusMeters || entity.AutoFillRadiusMeters.Value > MaxAutoFillRadiusMeters))
        {
            return AutoFillValidationError($"AutoFillRadiusMeters must be between {MinAutoFillRadiusMeters} and {MaxAutoFillRadiusMeters} meters.");
        }

        return null;
    }

    private static Error AutoFillValidationError(string message)
    {
        return new Error(DiningEnvironmentErrorCodes.AutoFillValidation, message);
    }

    /// <summary>
    /// A lat/lon box guaranteed to contain every point within <paramref name="radiusMeters"/> of the
    /// origin. Longitude degrees shrink with latitude (cos), so the box is widened accordingly and
    /// clamped to valid ranges; near the poles the longitude span collapses to a full hemisphere.
    /// </summary>
    private static (double MinLat, double MinLon, double MaxLat, double MaxLon) BoundingBox(
        double latitude,
        double longitude,
        int radiusMeters)
    {
        var latDelta = radiusMeters / MetersPerDegreeLatitude;
        var cosLatitude = Math.Cos(latitude * Math.PI / 180.0);
        var lonDelta = Math.Abs(cosLatitude) < 1e-9
            ? 180.0
            : radiusMeters / (MetersPerDegreeLatitude * Math.Abs(cosLatitude));

        return (
            Math.Max(-90.0, latitude - latDelta),
            Math.Max(-180.0, longitude - lonDelta),
            Math.Min(90.0, latitude + latDelta),
            Math.Min(180.0, longitude + lonDelta));
    }

    private static double HaversineMeters(double lat1, double lon1, double lat2, double lon2)
    {
        var dLat = (lat2 - lat1) * Math.PI / 180.0;
        var dLon = (lon2 - lon1) * Math.PI / 180.0;
        var lat1Rad = lat1 * Math.PI / 180.0;
        var lat2Rad = lat2 * Math.PI / 180.0;

        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                Math.Cos(lat1Rad) * Math.Cos(lat2Rad) * Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
        var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));

        return EarthRadiusMeters * c;
    }
}
