## 1. Shared frontend-origin allow-list

- [x] 1.1 Add a small DI-registered type in `Web/Configuration` (e.g. `FrontendOriginProvider`) constructed from `RequiredConfiguration.FrontendOrigin()`, exposing the origin plus an `IsAllowedReturnUrl(string? returnUrl, LinkGenerator/IUrlHelper-free)` check.
- [x] 1.2 Implement `IsAllowedReturnUrl`: return true when the caller-provided local check passes, or when the value parses as an absolute `http(s)` `Uri` whose scheme+host+port equal the configured frontend origin (ordinal-ignore-case host); false (unparseable/foreign) otherwise. Do NOT use `StartsWith`.
- [x] 1.3 Register the provider in `ServiceConfiguration` and make `AddApplicationCors` read its origin value, so CORS and redirect validation share one source.

## 2. Login/logout redirect wiring

- [x] 2.1 Inject the provider into `Web/MVC/Controllers/AccountController` and replace `Login`'s `Url.IsLocalUrl(returnUrl)`-only branch with the local-or-frontend-origin validation, falling back to `Home/Index`.
- [x] 2.2 Add a `returnUrl` parameter to `Logout`, validate it the same way, and use the validated value as the post-`SignOut` `RedirectUri` (fallback `Home/Index`); keep `[HttpPost]` + `[ValidateAntiForgeryToken]` and the dual cookie/OIDC sign-out unchanged.

## 3. Tests

- [x] 3.1 Unit-test `IsAllowedReturnUrl`: local url accepted, exact frontend origin accepted, foreign origin rejected, prefix-lookalike host rejected, null/garbage rejected.
- [x] 3.2 Test `Login` uses the returnUrl for local and matching-frontend-origin values and falls back for foreign values.
- [x] 3.3 Test `Logout` honors a valid returnUrl and falls back to `Home/Index` for missing/foreign values.

## 4. Verify

- [x] 4.1 Build and run the test suite; confirm the new scenarios pass and no existing `bff-authentication` behavior regressed.
