## 1. Domain and contracts

- [x] 1.1 Move `DailyOfferItem` from `Contracts/External` to `Domain` and update usings
- [x] 1.2 Change `IOfferFetchService.GetDailyOffersAsync` to return `IMethodResponse<IReadOnlyCollection<DailyOfferItem>>`

## 2. Application

- [x] 2.1 `OfferFetchService` returns offer items (deserializing cached `OffersJson`, returning fetched items directly); the cache still stores `text` / `priceText`
- [x] 2.2 `DailyRecommendationNotificationService` uses the returned items on the fetch path

## 3. Web

- [x] 3.1 Add `DTO/Web/DailyOfferDto` and `DTO/Web/Mappers/DailyOfferDtoMapper`, register the mapper in `ServiceConfiguration`
- [x] 3.2 `RestaurantsController.GetDailyOffers` returns mapped `DailyOfferDto` items

## 4. Tests and verify

- [x] 4.1 Update `FakeOfferFetchService` and recommendation tests to the new return type
- [x] 4.2 Unit tests for `DailyOfferDtoMapper` (field mapping, null price, JSON property names `offerText` / `offerPrice`)
- [x] 4.3 `dotnet build` and `dotnet test` pass; remove macOS backslash build artifacts
