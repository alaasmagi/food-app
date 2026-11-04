using System.ComponentModel.DataAnnotations;
using Base.Contracts.Domain;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using Microsoft.AspNetCore.Mvc.ModelBinding.Metadata;

namespace Web.Configuration;

/// <summary>
/// Makes the base <c>[Required]</c> ConcurrencyToken optional on request DTOs; the expected token comes
/// from the <c>If-Match</c> header and a create has none yet.
/// </summary>
public class ConcurrencyTokenValidationMetadataProvider : IValidationMetadataProvider
{
    public void CreateValidationMetadata(ValidationMetadataProviderContext context)
    {
        if (context.Key.MetadataKind != ModelMetadataKind.Property ||
            context.Key.Name != nameof(IBaseEntityConcurrency.ConcurrencyToken))
        {
            return;
        }

        context.ValidationMetadata.IsRequired = false;

        for (var i = context.ValidationMetadata.ValidatorMetadata.Count - 1; i >= 0; i--)
        {
            if (context.ValidationMetadata.ValidatorMetadata[i] is RequiredAttribute)
            {
                context.ValidationMetadata.ValidatorMetadata.RemoveAt(i);
            }
        }
    }
}
