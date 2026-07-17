using System.ComponentModel.DataAnnotations;
using Base.Contracts.Domain;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using Microsoft.AspNetCore.Mvc.ModelBinding.Metadata;

namespace Web.Configuration;

/// <summary>
/// The shared <c>BaseEntityWithConcurrency</c> marks <see cref="IBaseEntityConcurrency.ConcurrencyToken"/>
/// as <c>[Required]</c>, which is correct for persisted entities but wrong for the request DTOs: a create
/// has no token yet (the server assigns one) and update/delete carry the expected token in the
/// <c>If-Match</c> header, never the body. Without this the automatic model validation rejects every POST
/// with "The ConcurrencyToken field is required." This makes the property optional for model binding while
/// leaving it on responses.
/// </summary>
public sealed class ConcurrencyTokenValidationMetadataProvider : IValidationMetadataProvider
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
