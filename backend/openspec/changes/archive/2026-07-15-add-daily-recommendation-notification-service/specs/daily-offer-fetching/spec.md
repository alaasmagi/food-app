## MODIFIED Requirements

### Requirement: Daily offers are fetched lazily
The system SHALL fetch daily restaurant offers only when `GetDailyOffersAsync`, the daily offers API endpoint, or the scheduled daily recommendation notification assembly requests current offers.

#### Scenario: User requests offers
- **WHEN** an authenticated caller requests daily offers for a restaurant
- **THEN** the system evaluates the cache and fetches from an external provider only if the restaurant cache row is missing or stale.

#### Scenario: Scheduled recommendation requests current offers
- **WHEN** the scheduled daily recommendation notification flow needs current offers for an opted-in user's fetchable restaurant
- **THEN** the system may evaluate the cache and fetch from an external provider only if that restaurant cache row is missing or stale.

#### Scenario: No standalone scheduled prefetch
- **WHEN** the application starts or runs background services outside the daily recommendation notification flow
- **THEN** the system does not proactively fetch daily offers for restaurants on a schedule.
