using Base.Domain;

namespace Domain;

public class AppUser : BaseEntityWithConcurrency
{
    public string Email { get; set; } = default!;
    public string Username { get; set; } = default!;
    public string FullName { get; set; } = default!;
    public string Locale { get; set; } = "en";
    public bool SendNotifications { get; set; }

    // Mirrors the Keycloak account's enabled state, driven by identity-hub user-enabled/user-disabled
    // events. A disabled user is removed from the daily send regardless of SendNotifications — a
    // disabled account that keeps receiving mail is the most visible failure this service can have.
    public bool IsEnabled { get; set; } = true;

    public Guid? NotificationEnvironmentId { get; set; }
}
