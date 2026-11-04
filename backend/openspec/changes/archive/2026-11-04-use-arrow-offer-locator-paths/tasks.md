## 1. Domain validation

- [x] 1.1 Add locator validation to `Domain/OfferProvider.cs` per the grammar in design.md (Api and Html only; Manual skipped), returning an error message or null
- [x] 1.2 Call the validation from `Application/OfferProviderService.cs` before add and update; return an `IMethodResponse` failure on error
- [x] 1.3 Unit tests: valid Api/Html paths, empty OfferLocator, empty segment (`a > > b`), invalid Html segment, raw CSS and `regex:` rejected, Manual skipped, `.`/empty text and price locators allowed

## 2. Api fetcher

- [x] 2.1 Replace JSONPath in `External/Offers/ApiOfferProviderFetcher.cs` with a `>` key walk that flattens arrays
- [x] 2.2 Unit tests with a fake `HttpMessageHandler`: nested path, array in the middle, missing key, `.` text locator, HTTP failure, invalid JSON

## 3. Html fetcher

- [x] 3.1 Translate validated `>` paths to descendant CSS selectors in `External/Offers/HtmlOfferProviderFetcher.cs`; remove `regex:` support
- [x] 3.2 Unit tests with a fake `HttpMessageHandler`: class/id/tag paths, nested text and price, `.` text locator, no matches, HTTP failure

## 4. Verify

- [x] 4.1 `dotnet build food-app-backend.sln` and `dotnet test food-app-backend.sln` pass
- [x] 4.2 Remove macOS backslash build artifacts
