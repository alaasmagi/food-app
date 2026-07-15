namespace DTO.Web;

// Self-service request: a user sets only their own notification preferences. The target AppUser is
// resolved from the authenticated identity, never from this payload.
public class NotificationPreferencesDto
{
    public bool SendNotifications { get; set; }

    public Guid? NotificationEnvironmentId { get; set; }
}
