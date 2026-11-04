## Context

`ApiOfferProviderFetcher` passes locators straight to Newtonsoft `SelectTokens` (JSONPath) and `HtmlOfferProviderFetcher` passes them to AngleSharp `QuerySelectorAll` (CSS), with an extra `regex:` mode. Nothing validates locators on save. The admin-facing idea is a single path where `>` separates steps, interpreted per provider type.

## Goals / Non-Goals

**Goals:**
- One `>` path syntax for Api and Html locators.
- No ambiguity: Html segments state whether they are a class, id or tag.
- Invalid locators are rejected when the OfferProvider is saved.
- Remove raw regex execution from database-supplied input.

**Non-Goals:**
- Array indexes, wildcards, filters or attribute selectors.
- JSON keys that contain `>` (not addressable; documented limitation).
- Admin UI help text or a "test provider" action (needs a design first).
- Supporting the old JSONPath / CSS / regex syntax.

## Decisions

### Decision: Keep the three locator fields
`OfferLocator` finds the list of offers; `OfferTextLocator` and `OfferPriceLocator` are resolved relative to each offer. A single path cannot express where text and price live inside one offer, and keeping the fields avoids a schema change.

### Decision: Path grammar
- Split on `>`, trim each segment, reject empty segments.
- Empty locator or `.` means the current node (only allowed for `OfferTextLocator` / `OfferPriceLocator`; `OfferLocator` must have at least one segment).
- Api segment: any non-empty JSON key without `>`.
- Html segment: `.name`, `#name` or `name`, where `name` matches `[A-Za-z_][A-Za-z0-9_-]*`.

### Decision: Api resolution walks keys and flattens arrays
Start from the root token. For each segment, take the property with that key from every current object; when a current token is an array, apply the segment to each item. After the last segment of `OfferLocator`, an array result yields its items as offers; any other token is one offer. Missing keys produce no match, not an error.

- **Alternatives considered:** translating to JSONPath (`$.a.b[*]`) and calling `SelectTokens` — rejected because key escaping and array handling would still need custom code, and a direct walk is simpler to test.

### Decision: Html resolution translates to a descendant CSS selector
Validated segments are joined with a space (`#mysushi > .menu-item` → `#mysushi .menu-item`) and passed to AngleSharp. Because each segment is validated against the grammar first, no arbitrary CSS reaches the parser. Descendant (any depth) is used instead of direct child so small markup changes (an extra wrapper `div`) do not break providers.

### Decision: Validation lives on the domain entity
`OfferProvider.ValidateLocators()` checks the locators for Api and Html provider types and returns an error message or null; it returns a string because Domain does not reference `Base.DTO`. Manual providers skip locator validation. `OfferProviderService` calls it before create/update and returns an `IMethodResponse` failure with `OfferProviderErrorCodes.LocatorValidation` (HTTP 400). The fetchers also call it, so rows saved before this change fail with a clear parse error instead of running old selectors. Per AGENTS.md, business validation rules belong on domain entities.

### Decision: Drop `regex:` support
Regex from the database ran without a timeout and is not expressible in the new syntax. Removing it removes the backtracking risk.

## Risks / Trade-offs

- Existing provider rows stop working until re-entered → accepted (confirmed no rows need to be preserved).
- Some sites may only be addressable with richer selectors (attributes, nth-child) → extend the grammar in a later change if a real site needs it.
- Descendant matching can match more nodes than intended → admins can add a more specific parent segment.
