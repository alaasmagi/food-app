using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;

namespace Web.Configuration;

// Pins a Web API controller to the Keycloak JWT bearer scheme so unauthenticated calls return 401
// instead of the OIDC cookie challenge (which would redirect a browser). MVC controllers keep the
// cookie FallbackPolicy. Action-level [Authorize(Policy = Admin)] still applies and resolves roles
// from the bearer token.
public sealed class ApiBearerAuthorizeAttribute : AuthorizeAttribute
{
    public ApiBearerAuthorizeAttribute()
    {
        AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme;
    }
}
