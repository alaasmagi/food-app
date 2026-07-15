## ADDED Requirements

### Requirement: Deleting a Restaurant cascades removal of its Favourite records
The system SHALL delete all `Favourite` rows referencing a `Restaurant`, across all users, when that
`Restaurant` is deleted. This delete behavior is intentionally not restricted, unlike the `Restrict`
behavior used for `Restaurant`'s reference to `OfferProvider`, because `Favourite` is private per-user
data rather than reference data depended on by other reference data.

#### Scenario: Admin deletes a restaurant with existing favourites
- **WHEN** an admin deletes a `Restaurant` that one or more users have favourited
- **THEN** the system deletes the `Restaurant` and all `Favourite` rows that referenced it, without
  requiring those favourites to be removed first.
