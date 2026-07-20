## 1. Remove the token-exchange endpoint

- [ ] 1.1 Remove the `Token()` action (and its cookie-scheme `[Authorize]` / `[EnableCors]`) from `Web/API/Controllers/AccountController.cs`, keeping `Me` and `UpdateNotificationPreferences`
- [ ] 1.2 Delete `DTO/Web/TokenResponseDto.cs` (used only by the removed action) and any now-unused `using`s
- [ ] 1.3 Remove token-exchange tests from `Tests/AccountControllerTests.cs`

## 2. Scope login/logout return-url validation to local urls

- [ ] 2.1 In `Web/MVC/Controllers/AccountController.cs`, change `ResolveRedirectUri` to allow only local urls (`Url.IsLocalUrl`) and fall back to `Home/Index` otherwise; stop calling `FrontendOriginProvider.IsAllowedReturnUrl`
- [ ] 2.2 Remove `IsAllowedReturnUrl` from `Web/Configuration/FrontendOriginProvider.cs`, keeping only `Origin` (still used for CORS); update the class comment
- [ ] 2.3 Remove the return-url cases from `Tests/FrontendOriginProviderTests.cs`; keep/adjust any `Origin` coverage. Add or adjust MVC login/logout tests asserting local-only redirect and safe-default fallback

## 3. Make the frontend CORS policy non-credentialed

- [ ] 3.1 In `Web/Configuration/ServiceConfiguration.cs` `AddApplicationCors`, remove `AllowCredentials()` from `CorsPolicies.Frontend`; keep `WithOrigins(frontendOriginProvider.Origin)`, `AllowAnyHeader`, `AllowAnyMethod`, and update the comment
- [ ] 3.2 Confirm `app.UseCors(CorsPolicies.Frontend)` in `Web/Program.cs` still runs before rate limiting and other middleware (no change expected)

## 4. Verify

- [ ] 4.1 Build the solution and run the test suite; fix fallout from the removed endpoint/DTO/provider method
- [ ] 4.2 Confirm the JWT bearer scheme, `ApiBearerAuthorize`, and cookie+bearer coexistence for the Admin console are untouched
- [ ] 4.3 Verify end-to-end: a bearer request from the frontend origin succeeds with CORS headers and no credentials; `GET /api/v1/account/token` now returns 404; the Admin console still logs in/out via the OIDC cookie
