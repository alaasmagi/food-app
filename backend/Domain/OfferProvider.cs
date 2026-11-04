using System.Text.RegularExpressions;
using Base.Domain;

namespace Domain;

public class OfferProvider : BaseEntityWithConcurrency
{
    private static readonly Regex HtmlSegmentPattern = new("^[.#]?[A-Za-z_][A-Za-z0-9_-]*$");

    public string Name { get; set; } = default!;
    public EOfferProviderType ProviderType { get; set; }
    public string OfferLocator { get; set; } = default!;
    public string OfferTextLocator { get; set; } = default!;
    public string OfferPriceLocator { get; set; } = default!;

    public string? ValidateLocators()
    {
        if (ProviderType == EOfferProviderType.Manual)
        {
            return null;
        }

        if (SplitLocator(OfferLocator).Count == 0)
        {
            return $"{nameof(OfferLocator)} must contain at least one path segment.";
        }

        return ValidateLocator(nameof(OfferLocator), OfferLocator)
               ?? ValidateLocator(nameof(OfferTextLocator), OfferTextLocator)
               ?? ValidateLocator(nameof(OfferPriceLocator), OfferPriceLocator);
    }


    public static IReadOnlyList<string> SplitLocator(string? locator)
    {
        if (string.IsNullOrWhiteSpace(locator) || locator.Trim() == ".")
        {
            return [];
        }

        return locator.Split('>').Select(segment => segment.Trim()).ToList();
    }

    private string? ValidateLocator(string name, string? locator)
    {
        foreach (var segment in SplitLocator(locator))
        {
            if (segment.Length == 0)
            {
                return $"{name} must not contain empty path segments.";
            }

            if (ProviderType == EOfferProviderType.Html && !HtmlSegmentPattern.IsMatch(segment))
            {
                return $"{name} segment '{segment}' must be .class, #id or tag.";
            }
        }

        return null;
    }
}
