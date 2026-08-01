using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;

namespace Application.Messaging;

// Turns the free-text values scraped from restaurant providers into the machine-readable shapes the
// email-hub contract requires. Upstream data is provider-dependent and may carry symbols, commas or
// arbitrary text, so every method is a Try-parse: a value that cannot be produced faithfully returns
// false and the caller drops the offer/restaurant rather than emitting a degraded row.
public static partial class OfferValueParser
{
    // Parses a scraped price ("7.99", "4,50 €", "€ 6", "12,00 EUR") into an invariant decimal string
    // ("7.99", "4.50", "6"). Never a JSON number, never a comma. Assumes a single comma is a decimal
    // separator (lunch prices have no thousands grouping); when both '.' and ',' appear the
    // last-occurring one is the decimal point and the other is stripped as grouping.
    public static bool TryParsePrice(string? raw, out string invariantDecimal)
    {
        invariantDecimal = string.Empty;
        if (string.IsNullOrWhiteSpace(raw))
        {
            return false;
        }

        var filtered = new StringBuilder(raw.Length);
        foreach (var c in raw)
        {
            if (char.IsDigit(c) || c is '.' or ',')
            {
                filtered.Append(c);
            }
        }

        var value = filtered.ToString();
        if (value.Length == 0)
        {
            return false;
        }

        var hasDot = value.Contains('.');
        var hasComma = value.Contains(',');
        if (hasDot && hasComma)
        {
            var decimalIsDot = value.LastIndexOf('.') > value.LastIndexOf(',');
            value = decimalIsDot
                ? value.Replace(",", string.Empty)
                : value.Replace(".", string.Empty).Replace(',', '.');
        }
        else if (hasComma)
        {
            value = value.Replace(',', '.');
        }

        if (!decimal.TryParse(value, NumberStyles.AllowDecimalPoint, CultureInfo.InvariantCulture, out var parsed) ||
            parsed < 0)
        {
            return false;
        }

        // decimal preserves scale, so "4,50" survives round-trip as "4.50" (trailing zeroes intact).
        invariantDecimal = parsed.ToString(CultureInfo.InvariantCulture);
        return true;
    }

    // Parses a restaurant's free-text offer window ("11:00-14:00", "11.00 – 15.00", "L-R 11-15") into
    // separate local wall-clock times. Requires two distinct time tokens with from < until; anything
    // else is treated as unparseable so the restaurant is skipped rather than sent with a bad window.
    public static bool TryParseOfferWindow(string? raw, out TimeOnly from, out TimeOnly until)
    {
        from = default;
        until = default;
        if (string.IsNullOrWhiteSpace(raw))
        {
            return false;
        }

        var times = new List<TimeOnly>(2);
        foreach (Match match in TimeTokenRegex().Matches(raw))
        {
            var hour = int.Parse(match.Groups[1].Value, CultureInfo.InvariantCulture);
            var minute = match.Groups[2].Success
                ? int.Parse(match.Groups[2].Value, CultureInfo.InvariantCulture)
                : 0;
            if (hour > 23 || minute > 59)
            {
                continue;
            }

            times.Add(new TimeOnly(hour, minute));
            if (times.Count == 2)
            {
                break;
            }
        }

        if (times.Count < 2 || times[1] <= times[0])
        {
            return false;
        }

        from = times[0];
        until = times[1];
        return true;
    }

    [GeneratedRegex(@"(\d{1,2})(?:[:.](\d{2}))?")]
    private static partial Regex TimeTokenRegex();
}
