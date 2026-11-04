using Base.Application;
using Base.Contracts.DTO;
using Base.DTO;
using Contracts.Application;
using Contracts.DataAccess;
using Domain;

namespace Application;

public class AppUserService(
    IAppUserRepository appUserRepository,
    Base.Contracts.DataAccess.IBaseUow uow,
    IMapper<AppUser, AppUser> mapper,
    IDiningEnvironmentRepository diningEnvironmentRepository,
    ICurrentActorAccessor currentActorAccessor)
    : BaseService<AppUser, AppUser, IAppUserRepository>(uow, appUserRepository, mapper), IAppUserService
{
    public async Task<IMethodResponse<AppUser>> UpdateNotificationPreferencesAsync(
        Guid actor,
        bool sendNotifications,
        Guid? notificationEnvironmentId)
    {
        // Self-scoped: only the acting user's own AppUser is loaded and mutated, and only the two
        // notification fields change. Environment ownership is validated by UpdateAsync below.
        var current = await appUserRepository.GetByIdAsync(actor);
        if (current == null)
        {
            return MethodResponse<AppUser>.Failure(
                new Error(ErrorDefaults.Codes.NotFound, ErrorDefaults.Messages.NotFound));
        }

        current.SendNotifications = sendNotifications;
        current.NotificationEnvironmentId = notificationEnvironmentId;

        return await UpdateAsync(actor, current, current.ConcurrencyToken, actor);
    }

    public override async Task<IMethodResponse<AppUser>> UpdateAsync(
        Guid id,
        AppUser entity,
        string? expectedConcurrencyToken = default,
        Guid actor = default)
    {
        // A non-null notification scope must reference a DiningEnvironment owned by the acting user;
        // null means "all of the user's environments" and is always allowed.
        if (entity.NotificationEnvironmentId is { } environmentId)
        {
            var ownershipError = await ValidateNotificationEnvironmentOwnershipAsync(environmentId);
            if (ownershipError != null)
            {
                return MethodResponse<AppUser>.Failure(ownershipError);
            }
        }

        return await base.UpdateAsync(id, entity, expectedConcurrencyToken, actor);
    }

    // Fetches unscoped first so a foreign-owned environment reports FORBIDDEN instead of NOT_FOUND.
    private async Task<IError?> ValidateNotificationEnvironmentOwnershipAsync(Guid environmentId)
    {
        var actorId = currentActorAccessor.TryGetActorId();
        var unscopedResponse = await diningEnvironmentRepository.GetByIdAsync(environmentId);
        if (!unscopedResponse.Successful || unscopedResponse.Value == null)
        {
            return new Error(ErrorDefaults.Codes.NotFound, ErrorDefaults.Messages.NotFound);
        }

        if (actorId == null || unscopedResponse.Value.UserId != actorId)
        {
            return new Error(ErrorDefaults.Codes.Forbidden, ErrorDefaults.Messages.Forbidden);
        }

        return null;
    }
}
