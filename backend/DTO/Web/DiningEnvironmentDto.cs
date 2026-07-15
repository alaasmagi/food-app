using System.ComponentModel.DataAnnotations;
using Base.Domain;

namespace DTO.Web;

public class DiningEnvironmentDto : BaseEntityWithConcurrency
{
    [Required]
    [StringLength(256)]
    public string Name { get; set; } = default!;

    [StringLength(1024)]
    public string? Description { get; set; }
}
