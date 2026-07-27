## Why

The web wheel editor already lets a user seed a new wheel from a dining environment's restaurants in
one action, but the mobile wheel editor still forces the user to hunt each restaurant and check it by
hand. This closes that parity gap so mobile users can populate a wheel from an environment they have
already curated.

## What Changes

- Add an "Import from environment" `Select` to the mobile wheel editor dialog
  (`mobile/src/components/wheel/WheelEditorDialog.tsx`), listing the current user's dining
  environments by name, as additive UI alongside the existing manual checkbox list.
- Choosing an environment merges that environment's restaurant NAMES into the wheel's checked set,
  keeping the frozen-name semantics of `UserWheel.restaurantNames`. The merge is additive and
  de-duplicating; manual check/uncheck continues to work afterward, and further environments can be
  imported to merge more.
- Resolve each membership's restaurant id to a name through the already-cached restaurant catalog;
  skip silently any membership whose restaurant no longer resolves to a current catalog entry.
- Report the outcome with a short toast stating how many restaurants were newly added, so an import
  that adds nothing is not silently ambiguous.
- Ensure the datasets the import resolves against — environments, membership join rows, and the
  restaurant catalog — are loaded via the existing React Query hooks (`useEnvironments`,
  `useEnvironmentRestaurants`, `useRestaurants`); no dataset is re-fetched if already cached.
- No backend change. The wheel continues to save through the existing create/update mutation with the
  resulting `restaurantNames`.

## Capabilities

### New Capabilities
- `mobile-wheel-import-from-environment`: the mobile wheel editor's ability to populate a wheel's
  restaurant selection from a chosen dining environment, by name, additively and de-duplicating, from
  client-side cached data.

### Modified Capabilities
<!-- None. This mirrors the existing web wheel-import-from-environment behavior in the separate mobile
     app; no existing spec's requirements change. -->

## Impact

- Code: `mobile/src/components/wheel/WheelEditorDialog.tsx` (import control + merge logic); reuses
  existing `mobile/src/components/design-system/forms/Select.tsx`, the `useEnvironments`,
  `useEnvironmentRestaurants` (via `membershipMapForEnvironment`), and `useRestaurants` hooks, and the
  `useToast` provider. New/updated component tests under
  `mobile/src/components/wheel/__tests__/`.
- APIs: none. No new endpoint; no change to the wheel create/update contract.
- Dependencies: none added.
