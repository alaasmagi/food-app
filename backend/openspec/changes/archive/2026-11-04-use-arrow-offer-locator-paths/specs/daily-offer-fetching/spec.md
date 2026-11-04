## ADDED Requirements

### Requirement: Api fetcher resolves `>` paths over JSON keys
The Api provider fetcher SHALL resolve each locator by walking JSON object keys in segment order, applying a segment to every item when the current token is an array. OfferTextLocator and OfferPriceLocator SHALL be resolved relative to each offer token.

#### Scenario: Nested key path
- **WHEN** OfferLocator is `foods > restaurants > mysushi > menu` and `menu` is an array of objects
- **THEN** each array item is one offer, and its text and price are read with OfferTextLocator and OfferPriceLocator.

#### Scenario: Array in the middle of the path
- **WHEN** a segment other than the last reaches an array
- **THEN** the remaining segments are applied to every item in that array and all matches become offers.

#### Scenario: Missing key
- **WHEN** a segment does not exist in the JSON
- **THEN** the fetcher returns no offers for that path instead of failing.

### Requirement: Html fetcher resolves `>` paths as descendant selectors
The Html provider fetcher SHALL resolve each locator by matching `.class`, `#id` and `tag` segments in order, each at any depth below the previous match. OfferTextLocator and OfferPriceLocator SHALL be resolved relative to each offer element. The fetcher SHALL NOT execute regular expressions supplied through locators.

#### Scenario: Class and id path
- **WHEN** OfferLocator is `#mysushi > .menu-item`
- **THEN** every element with class `menu-item` anywhere inside the element with id `mysushi` is one offer.

#### Scenario: Offer node itself as text
- **WHEN** OfferTextLocator is empty or `.`
- **THEN** the offer element's normalized text content is used as the offer text.
