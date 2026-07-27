## Context

The mobile wheel editor (`mobile/src/components/wheel/WheelEditorDialog.tsx`) creates/edits a wheel
whose `restaurantNames` is a frozen snapshot of checked restaurant NAMES. It already renders a
searchable checkbox list over the cached restaurant catalog (`useRestaurants`) and tracks selection in
a `Set<string>` of names, seeded from the edited wheel on open.

The web frontend already ships this exact feature (spec `wheel-import-from-environment`,
`frontend/src/components/wheel/WheelEditorDialog.vue`). This change mirrors that behavior in the React
Native dialog. All the building blocks exist on mobile:

- `useEnvironments()` — cached list of `DiningEnvironment` (id, name, ...).
- `useEnvironmentRestaurants()` — cached membership join rows; `membershipMapForEnvironment(rows, envId)`
  derives `restaurantId -> { joinId, concurrencyToken }` for one environment.
- `useRestaurants()` — cached catalog providing `id -> name`.
- `Select` (`design-system/forms/Select.tsx`) — `options`/`value`/`onChange`, controlled.
- `useToast()` — `toast.push({ title, tone })` for non-blocking feedback.

## Goals / Non-Goals

**Goals:**
- Add an additive "Import from environment" `Select` to the mobile dialog that merges an environment's
  restaurant names into the current selection.
- Reuse only client-side React Query caches; no new fetch when data is already loaded.
- Preserve frozen-name semantics, de-duplication, and manual editing after import.
- Give clear count feedback via a toast.

**Non-Goals:**
- Live-linking a wheel to an environment (the wheel stores names, never a source-environment reference).
- Any backend endpoint or change to the wheel create/update contract.
- Paged restaurant loading — the mobile dialog already loads the full catalog into memory, unlike the
  web dialog's paged picker.

## Decisions

- **Resolve membership per chosen environment from the flat join-row cache.** Mobile has no
  `membershipByEnv` store (the web pattern); it has `useEnvironmentRestaurants()` returning all rows
  plus the pure `membershipMapForEnvironment(rows, envId)` helper. The import reads the cached rows
  once and computes the map for the picked env id. Alternative — a new per-env store — is unwarranted
  for a one-shot merge and duplicates existing derivation.

- **Track the picked environment in transient local state and import via effect/handler, then reset.**
  A `selectedImportEnvId` state drives the controlled `Select`; the merge runs when a non-empty value
  is chosen and the control resets to empty so the same environment can be imported again. This matches
  the web `importEnvId` watch pattern and the `Select`'s controlled contract.

- **Merge into the existing `Set<string>` of names, keyed by name.** For each membership id, look up
  its name via a `Map(id -> name)` built from the catalog; skip ids that do not resolve; skip names
  already in the set; count only newly added. This directly satisfies additive, de-duplicating, and
  skip-unresolved requirements, and keeps `handleSave`'s existing name-snapshot logic untouched.

- **Feedback via `useToast`.** Push a success toast: "Added N restaurants" / "Added 1 restaurant" /
  "No new restaurants added", mirroring the web copy and the design system's sentence-case, digit,
  no-emoji rules.

- **Empty-state instead of an empty select.** When the user has no environments, render a short hint
  line rather than an actionable-but-empty `Select`, matching the web dialog.

## Risks / Trade-offs

- **Membership cache not yet populated when the dialog opens** → `useEnvironments` and
  `useEnvironmentRestaurants` are ordinary queries; mounting the dialog subscribes to them and they
  fetch if cold. Until they resolve the import options/rows are simply empty; the manual list still
  works. No blocking behavior.
- **Name-based frozen semantics can drift from ids** → intentional and consistent with the existing
  wheel model; two restaurants sharing a name would collapse to one entry, which already holds for the
  manual checkbox flow, so the import introduces no new inconsistency.

## Open Questions

- None. Behavior and copy follow the established web `wheel-import-from-environment` spec.
