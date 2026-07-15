## 1. AppUser Opt-In Model

- [x] 1.1 Add `DailyLunchRecommendationsEnabled` with default `false` to `Domain/AppUser.cs`, `DTO/DataAccess/AppUserEntity.cs`, and `DTO/Web/AppUserDto.cs`.
- [x] 1.2 Update `AppUserEntityMapper` and `AppUserDtoMapper` so the notification preference is never dropped during mapping.
- [x] 1.3 Update `AppUserRepository.UpsertFromIdentityEventAsync` so new identity-created users default to not subscribed and identity updates preserve the existing preference.
- [x] 1.4 Add an AppDb EF migration that creates a non-null `DailyLunchRecommendationsEnabled` column with default `false` for existing `AppUsers`.

## 2. Messaging Contract

- [x] 2.1 Add `DTO/Messaging` records for `DailyLunchRecommendationEvent`, `DailyLunchRecommendationContent`, `RecommendationRow`, and `OfferLine` with serialized property names matching the email hub contract.
- [x] 2.2 Add local message constants for `email`, `food`, and `daily.lunch.recommendation`, following the naming convention of `DefaultMessageActions`.
- [x] 2.3 Ensure `DailyLunchRecommendationEvent` sets fixed envelope values for type, source, and action while accepting timestamp and content values from the notification service.

## 3. Repository Read Models

- [x] 3.1 Add `IAppUserRepository.GetDailyLunchRecommendationSubscribersAsync(CancellationToken)` and implement it to return only users with `DailyLunchRecommendationsEnabled == true`.
- [x] 3.2 Add a daily recommendation restaurant candidate projection containing restaurant id, restaurant name, offer time text, and provider-fetchable status.
- [x] 3.3 Add `IEnvironmentRestaurantRepository.GetDailyRecommendationRestaurantCandidatesAsync(Guid userId, CancellationToken)` and implement the query across `EnvironmentRestaurants`, `Restaurants`, and `OfferProviders`.
- [x] 3.4 Ensure the candidate query filters `Restaurant.HasOffers == true`, scopes by user id, flattens all environments, and deduplicates by `RestaurantId`.

## 4. Notification Service

- [x] 4.1 Add notification options for app base URL, restaurant path template, wheel path, and currency with sensible defaults.
- [x] 4.2 Add `IDailyRecommendationNotificationService` with a method that runs one daily recommendation publishing pass.
- [x] 4.3 Implement `DailyRecommendationNotificationService` to load opted-in users, gather candidate restaurants, build recommendation rows, and publish through `IBaseEventPublisher`.
- [x] 4.4 Reuse `IOfferCacheRepository`, `OfferCacheOptions`, and `IOfferFetchService` so fresh cache rows are used directly and stale or missing fetchable rows can be refreshed.
- [x] 4.5 Exclude restaurants when they are not offer-capable, have no fresh cache and no fetchable provider, fail to fetch, produce invalid JSON, or produce an empty offer list.
- [x] 4.6 Map `DailyOfferItem.Text` to `offerText` and `DailyOfferItem.PriceText` to `offerPrice` without trimming, formatting, or currency normalization.
- [x] 4.7 Build restaurant and wheel links as plain app deep links from notification options, with no Keycloak Admin API or action-token generation.
- [x] 4.8 Publish one event per opted-in user per run, allowing an empty `recommendationRows` array when no restaurants have current offers.
- [x] 4.9 Log per-restaurant fetch/deserialization failures and continue processing the rest of the user's recommendation rows.

## 5. Scheduled Trigger and Wiring

- [x] 5.1 Add `DailyRecommendationScheduleOptions` with default run time `08:00` and time zone `Europe/Tallinn`, overridable from configuration.
- [x] 5.2 Implement a hosted service that computes the next configured occurrence, creates an application scope, and invokes `IDailyRecommendationNotificationService` once per occurrence.
- [x] 5.3 Register the notification service, options, hosted service, repository additions, and any serializers/link helpers in `Web/Configuration/ServiceConfiguration.cs`.
- [x] 5.4 Add configuration loading in `RequiredConfiguration` for schedule, link, and currency options without hardcoding those values in the hosted service loop.

## 6. Tests and Verification

- [x] 6.1 Add focused tests for opt-in filtering, identity-event preference preservation, and AppUser mapper persistence.
- [x] 6.2 Add focused tests for all-environment aggregation, `RestaurantId` deduplication, `HasOffers` filtering, and nonfetchable stale-cache exclusion.
- [x] 6.3 Add focused tests for event contract serialization, source/action/type constants, raw price passthrough, and plain deep-link construction.
- [x] 6.4 Add focused tests for the scheduler's next-run calculation and scoped service invocation.
- [x] 6.5 Run `dotnet build` and the relevant test command for the solution.
- [x] 6.6 Run `openspec status --change "add-daily-recommendation-notification-service"` and confirm the change is apply-ready.
