## MODIFIED Requirements

### Requirement: OfferProvider records include provider type and locator fields
The system SHALL persist and return each OfferProvider with Name, ProviderType, OfferLocator, OfferTextLocator, and OfferPriceLocator. For Api and Html providers, each locator SHALL use the `>` path syntax: segments separated by `>`, each segment trimmed and non-empty. OfferLocator SHALL contain at least one segment. OfferTextLocator and OfferPriceLocator MAY be empty or `.` to mean the offer node itself.

#### Scenario: HTML provider configuration
- **WHEN** an admin creates or updates an OfferProvider with ProviderType Html and locators whose segments are each `.class`, `#id` or `tag`
- **THEN** the system stores the locator fields as the provider's HTML parsing configuration.

#### Scenario: API provider configuration
- **WHEN** an admin creates or updates an OfferProvider with ProviderType Api and locators whose segments are JSON object keys
- **THEN** the system stores the locator fields as the provider's API parsing configuration.

#### Scenario: Manual provider type
- **WHEN** an admin creates or updates an OfferProvider with ProviderType Manual
- **THEN** the system stores the provider type without requiring any base URL or endpoint field and without validating locator syntax.

#### Scenario: Invalid locator is rejected
- **WHEN** an admin creates or updates an Api or Html OfferProvider with a locator that has an empty segment, an empty OfferLocator, or an Html segment that is not `.class`, `#id` or `tag`
- **THEN** the system rejects the write with a validation error through the standard IMethodResponse error mapping and does not persist the change.

#### Scenario: Old locator syntax is rejected
- **WHEN** an admin creates or updates an Html OfferProvider with a raw CSS selector such as `div.menu li` or a `regex:` locator
- **THEN** the system rejects the write with a validation error.
