using Base.Contracts.DTO;
using Base.DataAccess.EF;
using Contracts.DataAccess;
using DataAccess.Context;
using Domain;
using DTO.DataAccess;
using Microsoft.EntityFrameworkCore;

namespace DataAccess;

public class AppUserRepository : BaseRepository<AppUser, AppUserEntity, IMapper<AppUser, AppUserEntity>>, IAppUserRepository
{
    private readonly AppDbContext _context;
    private readonly IMapper<AppUser, AppUserEntity> _mapper;

    public AppUserRepository(AppDbContext repositoryDbContext, IMapper<AppUser, AppUserEntity> repositoryMapper)
        : base(repositoryDbContext, repositoryMapper)
    {
        _context = repositoryDbContext;
        _mapper = repositoryMapper;
    }

    public async Task<AppUser?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        var entity = await _context.AppUsers
            .AsNoTracking()
            .FirstOrDefaultAsync(user => user.Id == id, ct);

        return _mapper.Map(entity);
    }

    public async Task<IReadOnlyList<AppUser>> GetNotificationSubscribersAsync(CancellationToken ct = default)
    {
        var entities = await _context.AppUsers
            .AsNoTracking()
            .Where(user => user.SendNotifications)
            .ToListAsync(ct);

        return entities
            .Select(entity => _mapper.Map(entity)!)
            .ToList();
    }

    public async Task ClearNotificationEnvironmentAsync(Guid environmentId, CancellationToken ct = default)
    {
        // Null the notification scope of every user that pointed at this environment so a deleted
        // environment never leaves a dangling reference. The DB FK is also configured SetNull; this keeps
        // the behavior observable through the repository layer (and provider-agnostic for tests).
        var referencing = await _context.AppUsers
            .Where(user => user.NotificationEnvironmentId == environmentId)
            .ToListAsync(ct);

        if (referencing.Count == 0)
        {
            return;
        }

        foreach (var user in referencing)
        {
            user.NotificationEnvironmentId = null;
        }

        await _context.SaveChangesAsync(ct);
    }

    public async Task<AppUser> UpsertFromIdentityEventAsync(
        Guid id,
        string? email,
        string? username,
        string? fullName,
        string? locale,
        CancellationToken ct = default)
    {
        var entity = await _context.AppUsers
            .FirstOrDefaultAsync(user => user.Id == id, ct);

        if (entity == null)
        {
            entity = new AppUserEntity
            {
                Id = id,
                Email = Normalize(email),
                Username = Normalize(username),
                FullName = Normalize(fullName),
                Locale = NormalizeLocale(locale),
                // New identity-created users are not subscribed to notifications.
                SendNotifications = false
            };
            StampNew(entity);
            _context.AppUsers.Add(entity);
        }
        else
        {
            // Identity events update identity-sourced fields only and must preserve the
            // user's SendNotifications and NotificationEnvironmentId product preferences.
            entity.Email = Normalize(email);
            entity.Username = Normalize(username);
            entity.FullName = Normalize(fullName);
            entity.Locale = NormalizeLocale(locale);
            StampExisting(entity);
        }

        await _context.SaveChangesAsync(ct);
        return _mapper.Map(entity)!;
    }

    public async Task<bool> DeleteFromIdentityEventAsync(Guid id, CancellationToken ct = default)
    {
        var entity = await _context.AppUsers
            .FirstOrDefaultAsync(user => user.Id == id, ct);

        if (entity == null)
        {
            return false;
        }

        _context.AppUsers.Remove(entity);
        await _context.SaveChangesAsync(ct);
        return true;
    }

    private static string Normalize(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? string.Empty : value.Trim();
    }

    private static string NormalizeLocale(string? locale)
    {
        return string.IsNullOrWhiteSpace(locale) ? "et" : locale.Trim();
    }

    private static void StampNew(AppUserEntity entity)
    {
        var now = DateTime.UtcNow;
        entity.CreatedAt = now;
        entity.UpdatedAt = now;
        entity.CreatedBy = "keycloak";
        entity.UpdatedBy = "keycloak";
        entity.ConcurrencyToken = Guid.NewGuid().ToString("N");
    }

    private static void StampExisting(AppUserEntity entity)
    {
        entity.UpdatedAt = DateTime.UtcNow;
        entity.UpdatedBy = "keycloak";
        entity.ConcurrencyToken = Guid.NewGuid().ToString("N");
    }
}
