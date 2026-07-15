using Base.Domain;

namespace Domain;

public class DiningEnvironment : BaseEntityUserWithConcurrency
{
    public string Name { get; set; } = default!;
    public string? Description { get; set; }
}
