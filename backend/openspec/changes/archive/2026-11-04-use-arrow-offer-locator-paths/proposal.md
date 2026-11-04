## Why

OfferProvider locators currently take raw JSONPath (Api) or raw CSS selectors / `regex:` patterns (Html). Admins have to know three different syntaxes, a typo is only discovered when a fetch fails, and raw regex from the database can cause catastrophic backtracking. A single, simple path syntax with `>` as the separator, validated on save, makes provider setup predictable for both provider types.

## What Changes

- **BREAKING**: `OfferLocator`, `OfferTextLocator` and `OfferPriceLocator` use one `>`-separated path syntax for both Api and Html providers. Raw JSONPath, raw CSS selectors and `regex:` locators are no longer accepted. Existing provider rows are re-entered by an admin; no data migration.
- Api paths: each segment is a JSON object key, e.g. `foods > restaurants > mysushi > menu`. When a segment reaches an array, it is applied to every item.
- Html paths: each segment is `.class`, `#id` or `tag`, e.g. `#mysushi > .menu-item`. Each segment matches at any depth below the previous one.
- `OfferTextLocator` / `OfferPriceLocator` are resolved relative to each offer found by `OfferLocator`. An empty value or `.` means the offer node itself.
- Locator syntax is validated when an OfferProvider is created or updated; invalid paths are rejected with a validation error instead of failing at fetch time.
- **Unchanged**: the three locator fields, the database schema, the fetch/cache flow, the normalized `{ text, priceText }` output, and the Manual provider behavior.

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `offer-provider-reference-data`: locator fields use the `>` path syntax and are validated on create/update for Api and Html providers.
- `daily-offer-fetching`: Api and Html fetchers resolve offers through the `>` path syntax instead of raw JSONPath, CSS selectors or regex.

## Impact

- Affected code: `Domain/OfferProvider.cs` (locator validation), `Application/OfferProviderService.cs` (run validation on add/update), `External/Offers/ApiOfferProviderFetcher.cs`, `External/Offers/HtmlOfferProviderFetcher.cs`, and new unit tests in `Tests/`.
- No database schema change, no migration, no env variable change.
- Existing OfferProvider rows using the old syntax stop producing offers until re-entered.
- Admin form help text (`Web/MVC/Areas/Admin/Views/OfferProviders/Create.cshtml`, `Edit.cshtml`) is out of scope until a design exists in the design system.
