## Why

The daily lunch recommendation email already ships, but it treats every opted-in user identically: it always combines restaurants from *all* of the user's dining environments, and the opt-in field is named for one specific product (`DailyLunchRecommendationsEnabled`). Users want to choose whether the morning email is scoped to a single environment (e.g. just "Work") or spans everything, and the opt-in flag should read as a general notification toggle so it can be reused as the product's notification surface grows.

## What Changes

- **BREAKING** Rename the opt-in flag `AppUser.DailyLunchRecommendationsEnabled` → `AppUser.SendNotifications` (bool, default false) across Domain, the DataAccess entity, the Web DTO/mapper, the subscriber repository query, tests, and the EF migration/column.
- Add `AppUser.NotificationEnvironmentId` (`Guid?`, nullable FK to `DiningEnvironment`) — an optional per-user scope for the daily email.
  - When set, the recommendation rows are sourced from **only** that environment's restaurants.
  - When null, rows are sourced from **all** of the user's dining environments combined into one flat, `RestaurantId`-deduplicated list (the current behavior).
- Validate ownership when `NotificationEnvironmentId` is set: the referenced `DiningEnvironment` must belong to the acting user, otherwise the write is rejected as forbidden.
- Clear `NotificationEnvironmentId` back to null when the referenced `DiningEnvironment` is deleted, so it never dangles or blocks the delete.
- Scope the daily-recommendation restaurant-candidate query by the chosen environment when one is set; leave the existing `HasOffers`/fetchable-cache filtering, raw price passthrough, plain deep links, one-event-per-user (even when empty), and the 08:00 Europe/Tallinn scheduler unchanged.

The event/DTO contract (`DailyLunchRecommendationEvent`, `DailyLunchRecommendationContent`, `RecommendationRow`, `OfferLine`, the local `daily.lunch.recommendation` action, `type: email` / `source: food`) already exists and matches the email hub contract exactly — this change keeps it as-is.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `daily-recommendation-notifications`: the opt-in is modeled as `AppUser.SendNotifications` instead of `AppUser.DailyLunchRecommendationsEnabled`; a new `AppUser.NotificationEnvironmentId` scopes recommendation rows to a single environment when set and to all environments when null; setting `NotificationEnvironmentId` requires ownership of the referenced environment.
- `dining-environment`: deleting a `DiningEnvironment` clears any `AppUser.NotificationEnvironmentId` that referenced it.

## Impact

- **Domain**: `Domain/AppUser.cs` (rename field, add `NotificationEnvironmentId`).
- **DTO**: `DTO/DataAccess/AppUserEntity.cs` + mapper, `DTO/Web/AppUserDto.cs` + mapper (rename field, add nullable FK field).
- **Contracts**: `IAppUserRepository.GetDailyLunchRecommendationSubscribersAsync` (query rename), `IEnvironmentRestaurantRepository.GetDailyRecommendationRestaurantCandidatesAsync` (optional environment-scope parameter).
- **DataAccess**: `AppDbContext` model config for the new `AppUser → DiningEnvironment` FK and its on-delete-set-null / clear-on-delete behavior; `AppUserRepository` and `EnvironmentRestaurantRepository` queries; a new EF migration for the rename + new column/FK (AppDbContext / PostgreSQL only).
- **Application**: `DailyRecommendationNotificationService` passes the user's `NotificationEnvironmentId` into candidate resolution; ownership validation for `NotificationEnvironmentId` on AppUser preference update; `DiningEnvironmentService` (or its delete path) clears referencing `NotificationEnvironmentId`.
- **Tests**: rename `DailyLunchRecommendationsEnabled` usages; add scoping, ownership-validation, and clear-on-delete coverage.
- No change to the RabbitMQ event contract, the offer cache, the scheduler, or any frontend (a settings UI for these fields is a later frontend change).
