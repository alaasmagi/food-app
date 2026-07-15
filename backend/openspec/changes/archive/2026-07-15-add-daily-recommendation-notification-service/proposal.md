## Why

Users should receive a morning email summarizing today's lunch offers across the restaurants they have organized in the app. This lets the backend publish a food-sourced notification event for the email hub while keeping login and action-token concerns on the existing Keycloak OIDC and identity/email-hub side.

## What Changes

- Add food-app-specific messaging DTOs for the fixed daily lunch recommendation email contract: `DailyLunchRecommendationEvent`, `DailyLunchRecommendationContent`, `RecommendationRow`, and `OfferLine`.
- Define a local `daily.lunch.recommendation` action constant following the same naming convention as `DefaultMessageActions`.
- Add a `DailyRecommendationNotificationService` that publishes one daily recommendation email event per opted-in `AppUser`.
- Aggregate all restaurants from all of a user's `DiningEnvironment` memberships into one flat recommendation list, deduplicated by `RestaurantId`.
- Include only restaurants where `Restaurant.HasOffers == true` and a fresh or fetchable offer cache result yields current offers.
- Pass each offer price through exactly as received from the offer provider/cache source, without reformatting or normalization.
- Use plain deep links for restaurant rows and the user's wheel link; do not generate Keycloak action-token or magic-login links.
- Add a scheduled morning trigger whose exact run time is configurable rather than hardcoded.
- Add an explicit AppUser email preference for daily lunch recommendations so "opted-in" is modeled in application data.

## Capabilities

### New Capabilities
- `daily-recommendation-notifications`: Publishes scheduled daily lunch recommendation email events for opted-in users based on their environment restaurants and current offers.

### Modified Capabilities
- `daily-offer-fetching`: Allow the scheduled recommendation notification flow to request current offers while assembling opted-in users' emails, without introducing a standalone scheduled prefetch job.

## Impact

- Affects DTO messaging contracts, application service contracts and implementation, RabbitMQ outbound publishing, scheduling/hosted-service configuration, AppUser domain/data/web DTO mappings, and AppDbContext persistence/migration.
- Reuses the existing offer cache and `OfferFetchService` instead of introducing scheduled offer prefetching.
- Does not change Keycloak action-token generation, email rendering, per-environment email grouping, or offer price normalization.
