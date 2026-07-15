using System.Security.Claims;
using Contracts.Application;
using Microsoft.AspNetCore.Http;

namespace Application;

public class CurrentActorAccessor(IHttpContextAccessor httpContextAccessor) : ICurrentActorAccessor
{
    public Guid? TryGetActorId()
    {
        var user = httpContextAccessor.HttpContext?.User;
        var subjectClaim = user?.FindFirst(ClaimTypes.NameIdentifier) ?? user?.FindFirst("sub");

        return Guid.TryParse(subjectClaim?.Value, out var actorId) ? actorId : null;
    }
}
