namespace DTO.Web;

/// <summary>
/// Result of a dining environment auto-fill run.
/// </summary>
public class DiningEnvironmentAutoFillResultDto
{
    public int Added { get; set; }
    public int AlreadyPresent { get; set; }
    public int TotalMembers { get; set; }
}
