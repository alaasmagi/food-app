## ADDED Requirements

### Requirement: Deleting a Restaurant cascades removal of its EnvironmentRestaurant memberships
The system SHALL delete all `EnvironmentRestaurant` rows referencing a `Restaurant`, across all users,
when that `Restaurant` is deleted. This delete behavior is intentionally not restricted, unlike the
`Restrict` behavior used for `Restaurant`'s reference to `OfferProvider`, because `EnvironmentRestaurant`
is private per-user grouping data rather than reference data depended on by other reference data.

#### Scenario: Admin deletes a restaurant with existing environment memberships
- **WHEN** an admin deletes a `Restaurant` that one or more users have added to a `DiningEnvironment`
- **THEN** the system deletes the `Restaurant` and all `EnvironmentRestaurant` rows that referenced it,
  without requiring those memberships to be removed first.
