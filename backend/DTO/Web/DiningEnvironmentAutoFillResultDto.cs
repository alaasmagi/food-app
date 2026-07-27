namespace DTO.Web;

/// <summary>
/// Response for POST /api/v1/dining-environments/{id}/auto-fill: how many nearby restaurants were
/// newly added as memberships, how many were already members, and the environment's resulting total
/// membership count. Auto-fill is additive, so the total can exceed the number of in-radius matches.
/// </summary>
public class DiningEnvironmentAutoFillResultDto
{
    public int Added { get; set; }
    public int AlreadyPresent { get; set; }
    public int TotalMembers { get; set; }
}
