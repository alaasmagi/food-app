## Context

The backend already stores `AppUser`, `DiningEnvironment`, `EnvironmentRestaurant`, `Restaurant`, `OfferProvider`, and the short-lived SQLite offer cache. `OfferFetchService.GetDailyOffersAsync(restaurantId)` is the existing orchestration point for cache evaluation, provider fetching, normalization, and cache upsert.

Outbound RabbitMQ publishing is available through `alaasmagi.Base.Message.RabbitMQ`. This change adds a food-sourced email event, not a Keycloak-sourced identity event, so the payload must use food-app DTOs and fixed food/email contract fields.

`AppUser` currently has no notification preference. Opt-in will be modeled in this application because the daily lunch recommendation is product behavior, not a Keycloak identity action.

## Goals / Non-Goals

**Goals:**
- Publish one `daily.lunch.recommendation` email event per opted-in `AppUser` on a configurable morning schedule.
- Build recommendation rows from every restaurant in every one of the user's dining environments, flattened and deduplicated by `RestaurantId`.
- Include only restaurants with `HasOffers == true` and current offer data from a fresh cache row or a fetchable provider/cache refresh path.
- Preserve provider/cache offer price text exactly when mapping `DailyOfferItem.PriceText` to `offerPrice`.
- Use plain app deep links for restaurant rows and the user's wheel page.

**Non-Goals:**
- No Keycloak Admin API calls, action-token generation, or magic-login links.
- No per-environment separate emails.
- No offer price reformatting, currency symbol stripping, or normalization.
- No standalone scheduled offer prefetch job outside recommendation email assembly.
- No email rendering or delivery logic in this backend.

## Decisions

1. Opt-in is `AppUser.DailyLunchRecommendationsEnabled`.
   - New and existing users default to `false`; the service publishes only for users where the flag is `true`.
   - Keycloak user-created and user-updated event handling must preserve the preference. Identity events can update email, username, full name, and locale, but they must not reset the user's product notification choice.
   - Alternative considered: send to all users until a preference UI exists. That makes "opted-in" ambiguous and can email users who never asked for the recommendation.

2. Publish the fixed event envelope as a food DTO.
   - Add records under `DTO/Messaging`: `DailyLunchRecommendationEvent`, `DailyLunchRecommendationContent`, `RecommendationRow`, and `OfferLine`.
   - `DailyLunchRecommendationEvent` carries the fixed envelope values: `type = "email"`, `source = "food"`, `action = "daily.lunch.recommendation"`, `timestamp`, and `content`.
   - Add local constants, for example `AppMessageTypes.Email`, `AppMessageSources.Food`, and `AppMessageActions.DailyLunchRecommendation`, following the naming style of `DefaultMessageActions`.
   - `DailyRecommendationNotificationService` should publish the event through `IBaseEventPublisher` with the local action as the routing key/action. This keeps the contract exact and avoids relying on Keycloak event DTOs or identity-source conventions.
   - Alternative considered: reuse `Base.Keycloak.Events` content records. Those DTOs are identity-sourced and do not match the food email hub contract.

3. Add focused repository queries for notification assembly.
   - Add `IAppUserRepository.GetDailyLunchRecommendationSubscribersAsync(ct)` to return users with `DailyLunchRecommendationsEnabled == true`.
   - Add an environment membership query, such as `IEnvironmentRestaurantRepository.GetDailyRecommendationRestaurantCandidatesAsync(userId, ct)`, that joins the user's environment memberships to `Restaurant` and `OfferProvider`, filters `Restaurant.HasOffers == true`, deduplicates by `RestaurantId`, and returns only the fields the notification service needs.
   - The candidate projection should include whether the restaurant is provider-fetchable, so stale manual or non-provider cache rows can be excluded unless the cache row is fresh.
   - Alternative considered: load all user environments and memberships through generic CRUD repository methods. That would require extra round trips and application-side joins for a read model that is naturally expressed as one scoped query.

4. Treat offer fetching as part of email assembly, not as a new prefetch subsystem.
   - For each candidate restaurant, the notification service first checks `IOfferCacheRepository` for a fresh row using the same UTC business-date and TTL rule as `OfferFetchService`.
   - If the cache row is fresh, deserialize its `OffersJson`.
   - If the cache row is missing or stale and the restaurant is fetchable, call `IOfferFetchService.GetDailyOffersAsync(restaurantId)` and deserialize the successful result.
   - If the restaurant is not fetchable, the fetch fails, the JSON cannot be deserialized, or the offer list is empty, exclude that restaurant row and continue with the rest of the user.
   - This modifies the existing "no scheduled fetch" rule narrowly: the scheduled recommendation flow may request current offers for opted-in users, but there is still no standalone scheduled job that refreshes every restaurant's cache.

5. Map content without changing provider text.
   - `DailyOfferItem.Text` maps to `OfferLine.offerText`.
   - `DailyOfferItem.PriceText` maps to `OfferLine.offerPrice` exactly, including null, empty strings, whitespace, symbols, and locale-specific formatting.
   - `Restaurant.Name` maps to `restaurantName`, and `Restaurant.OfferTimeText` maps to `offerTimes`.
   - `DailyLunchRecommendationContent.currency` is an option with default `EUR`; it describes the app/email context and must not be used to rewrite `offerPrice`.

6. Build deep links from notification options.
   - Add options for `AppBaseUrl`, `RestaurantPathTemplate`, and `WheelPath`, with defaults such as `/restaurants/{restaurantId}` and `/wheel`.
   - `RecommendationRow.link` is the restaurant deep link. `linkToUserWheel` is the wheel page deep link.
   - The service must not call Keycloak Admin APIs, create action tokens, or embed login bypass links. Existing Keycloak OIDC middleware handles authentication when the user follows the link.

7. Schedule the job with configurable morning options.
   - Add `DailyRecommendationScheduleOptions` with default run time `08:00` and time zone `Europe/Tallinn`.
   - The hosted service computes the next occurrence from options and creates a scoped `IDailyRecommendationNotificationService` when the timer fires.
   - The trigger time and timezone must come from configuration or defaults, not inline literals in the hosted service loop.
   - Alternative considered: cron package dependency. A small daily timer is enough for one daily job and avoids adding a scheduler dependency.

## Risks / Trade-offs

- Duplicate emails after process restart near the scheduled time -> Keep the hosted service idempotent per process and log each run; add distributed once-per-day locking only if multiple backend replicas run this service.
- Many opted-in users can fan out into many provider fetches -> Deduplicate restaurants per user and reuse the offer cache; later optimization can deduplicate across users in one run if needed.
- Provider fetch failures can leave a sparse email -> Skip only the failed restaurant row and continue; log failures with restaurant and user identifiers.
- Unknown frontend route shape can produce stale links -> Keep path templates configurable so route changes do not require code changes.
- Existing users are not subscribed by default -> This respects opt-in semantics but requires a UI/API path or data migration to enable the preference for users who request it.

## Migration Plan

1. Add `DailyLunchRecommendationsEnabled` to Domain, DataAccess entity, Web DTO, and both AppUser mappers.
2. Add an AppDb migration with a non-null boolean column defaulting to `false` for existing rows.
3. Update identity-event upsert code so it sets the default only on insert and preserves the existing preference on updates.
4. Deploy code and migration together.
5. Configure `AppBaseUrl`, schedule time, schedule timezone, and currency for the environment.
6. Rollback by stopping the hosted service registration first, then reverting the migration if the column is no longer needed.

## Open Questions

None. "Opted-in" means `AppUser.DailyLunchRecommendationsEnabled == true`.
