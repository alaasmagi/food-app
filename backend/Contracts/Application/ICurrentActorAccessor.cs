namespace Contracts.Application;

public interface ICurrentActorAccessor
{
    Guid? TryGetActorId();
}
