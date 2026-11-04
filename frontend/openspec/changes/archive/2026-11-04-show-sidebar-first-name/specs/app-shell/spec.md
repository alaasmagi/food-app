## ADDED Requirements

### Requirement: Sidebar user row shows the first name

The app shell sidebar footer SHALL show the signed-in user's first name in the user row, to the left of the "Log out" button, on every shell-wrapped route. The first name SHALL be the first whitespace-separated word of the current user's `fullName`; when `fullName` is empty or whitespace only, the row SHALL show the user's `username`. When the current user has not been loaded yet, the shell SHALL load it through the auth store's `fetchCurrentUser()`. If loading fails, the row SHALL stay empty and the "Log out" button SHALL keep working.

#### Scenario: First name shown next to log out

- **WHEN** an authenticated user whose `fullName` is "Aleksander Example" views any shell-wrapped route
- **THEN** the sidebar user row shows "Aleksander" to the left of the "Log out" button

#### Scenario: Name shown without visiting Settings first

- **WHEN** the shell mounts and the auth store has no current user
- **THEN** the shell calls `fetchCurrentUser()` once and shows the first name after it resolves

#### Scenario: Already loaded user is not refetched

- **WHEN** the shell mounts and the auth store already has a current user
- **THEN** the shell does not call `fetchCurrentUser()` and shows that user's first name

#### Scenario: Fallback to username

- **WHEN** the current user's `fullName` is empty
- **THEN** the user row shows the user's `username`

#### Scenario: Loading the user fails

- **WHEN** `fetchCurrentUser()` rejects
- **THEN** the user row is empty and the "Log out" button still logs the user out
