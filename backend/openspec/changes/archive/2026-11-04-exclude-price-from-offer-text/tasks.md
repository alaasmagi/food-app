## 1. Html fetcher

- [x] 1.1 In `External/Offers/HtmlOfferProviderFetcher.cs`, build the offer text from the text element's text nodes, skipping those inside the price element when it is a descendant of the text element

## 2. Tests and verify

- [x] 2.1 Tests in `Tests/OfferProviderFetcherTests.cs`: price nested in the offer (text `.`), price nested in a separate text element, price outside the text element, both locators `.`
- [x] 2.2 `dotnet build` and `dotnet test` pass; remove macOS backslash build artifacts
