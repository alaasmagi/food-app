using System.ComponentModel.DataAnnotations;
using Base.Domain;

namespace DTO.DataAccess;

public class AppUserEntity : BaseEntityWithMetaConcurrency
{
    [Required]
    [MaxLength(256)]
    public string Email { get; set; } = default!;

    [Required]
    [MaxLength(256)]
    public string Username { get; set; } = default!;

    [Required]
    [MaxLength(256)]
    public string FullName { get; set; } = default!;

    [Required]
    [MaxLength(16)]
    public string Locale { get; set; } = "en";

    public bool SendNotifications { get; set; }

    // Keycloak account enabled state; a disabled user never receives the daily send.
    public bool IsEnabled { get; set; } = true;

    public Guid? NotificationEnvironmentId { get; set; }
}
