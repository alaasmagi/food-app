## 1. Wire up data sources in the dialog

- [x] 1.1 In `mobile/src/components/wheel/WheelEditorDialog.tsx`, add the hooks the import depends on:
  `useEnvironments()` for the list, `useEnvironmentRestaurants()` for membership join rows, and reuse
  the existing `useRestaurants()` catalog; add `useToast()` for feedback.
- [x] 1.2 Add transient local state `selectedImportEnvId` (string) driving the controlled import
  `Select`, reset to empty on dialog open alongside the existing name/isPublic/selected reset.

## 2. Import control UI

- [x] 2.1 Build `environmentOptions` as `{ value: id, label: name }` from `useEnvironments()` data.
- [x] 2.2 Render the "Import from environment" `Select` (from `design-system/forms/Select.tsx`) above
  the search input when the user has at least one environment, controlled by `selectedImportEnvId`.
- [x] 2.3 When the user has no environments, render a short hint line ("Create an environment to import
  its restaurants here.") instead of an empty select.

## 3. Merge logic

- [x] 3.1 Implement `importFromEnvironment(envId)`: reset `selectedImportEnvId` to empty, derive the
  env membership via `membershipMapForEnvironment(rows, envId)`, build a `Map(id -> name)` from the
  catalog, and merge resolvable, not-yet-selected names into the `selected` name set, counting only
  newly added.
- [x] 3.2 Skip membership ids that do not resolve to a current catalog restaurant, and skip names
  already selected (no duplicates).
- [x] 3.3 Trigger the merge when a non-empty environment is chosen in the `Select` (via its `onChange`
  or an effect on `selectedImportEnvId`).
- [x] 3.4 Push a toast reporting the count: "Added N restaurants" / "Added 1 restaurant" / "No new
  restaurants added", using sentence case and digits.

## 4. Preserve existing behavior

- [x] 4.1 Confirm manual check/uncheck still toggles names after an import, and that `handleSave`
  continues to snapshot `restaurantNames` from the merged `selected` set through the existing
  create/update mutation with no new backend call or environment reference.

## 5. Tests

- [x] 5.1 Add/extend a test under `mobile/src/components/wheel/__tests__/` covering: control lists the
  user's environments; import merges additively into an existing selection without duplicating.
- [x] 5.2 Cover skip-unresolved (a membership id not in the catalog is skipped) and the "all
  resolvable" case imports every name.
- [x] 5.3 Cover feedback: a toast reports the number added, and reports "no new restaurants added" when
  nothing new resolves/adds.
- [x] 5.4 Cover the no-environments empty state (hint shown, no actionable empty select).
- [x] 5.5 Run the mobile test suite and typecheck to confirm the dialog and its tests pass.
