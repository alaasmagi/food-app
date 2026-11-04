## MODIFIED Requirements

### Requirement: Html fetcher resolves `>` paths as descendant selectors
The Html provider fetcher SHALL resolve each locator by matching `.class`, `#id` and `tag` segments in order, each at any depth below the previous match. OfferTextLocator and OfferPriceLocator SHALL be resolved relative to each offer element. When the price element is a descendant of the text element, the offer text SHALL exclude the price element's text. The fetcher SHALL NOT execute regular expressions supplied through locators.

#### Scenario: Class and id path
- **WHEN** OfferLocator is `#mysushi > .menu-item`
- **THEN** every element with class `menu-item` anywhere inside the element with id `mysushi` is one offer.

#### Scenario: Offer node itself as text
- **WHEN** OfferTextLocator is empty or `.`
- **THEN** the offer element's normalized text content is used as the offer text.

#### Scenario: Price nested inside the text element
- **WHEN** the element matched by OfferPriceLocator is inside the element used for the offer text
- **THEN** the offer text is the text element's normalized content without the price element's text, and the price is still returned as `priceText`.

#### Scenario: Price outside the text element
- **WHEN** the price element is not inside the text element, or both locators resolve to the same element
- **THEN** the offer text is the text element's full normalized content.
