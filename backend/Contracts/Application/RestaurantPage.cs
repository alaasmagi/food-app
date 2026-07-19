using Domain;

namespace Contracts.Application;

/// <summary>
/// One page of restaurants plus the total number of matches, so the client can render pagination.
/// </summary>
public record RestaurantPage(IReadOnlyList<Restaurant> Items, int Total, int Page, int PageSize);
