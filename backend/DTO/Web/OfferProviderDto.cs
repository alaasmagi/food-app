using System.ComponentModel.DataAnnotations;
using Base.Domain;
using Domain;

namespace DTO.Web;

public class OfferProviderDto : BaseEntityWithConcurrency
{
    [Required]
    [StringLength(256)]
    public string Name { get; set; } = default!;

    public EOfferProviderType ProviderType { get; set; }

    [Required]
    [StringLength(1024)]
    public string OfferLocator { get; set; } = default!;

    [Required]
    [StringLength(1024)]
    public string OfferTextLocator { get; set; } = default!;

    [Required]
    [StringLength(1024)]
    public string OfferPriceLocator { get; set; } = default!;
}
