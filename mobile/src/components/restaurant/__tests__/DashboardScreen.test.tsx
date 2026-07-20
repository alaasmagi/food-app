import { render, screen } from '@testing-library/react-native';

// app/ is at the project root, outside the "@/" (src) alias — use a relative path.
import DashboardScreen from '../../../../app/(tabs)/index';
import { useEnvironmentFilteredRestaurants } from '@/hooks/useEnvironmentFilteredRestaurants';
import type { RestaurantCardProps } from '@/components/restaurant/RestaurantCard';
import type { Restaurant } from '@/types/restaurant';

jest.mock('@/hooks/useEnvironmentFilteredRestaurants', () => ({
  useEnvironmentFilteredRestaurants: jest.fn(),
}));
jest.mock('@/hooks/useFavourites', () => ({
  useFavourites: () => ({ favouriteMap: {}, favouriteFor: () => undefined }),
}));
jest.mock('@/components/environment/EnvironmentTabs', () => ({
  EnvironmentTabs: () => null,
}));
// Stub the card, echoing the environment-related props it receives.
jest.mock('@/components/restaurant/RestaurantCard', () => ({
  RestaurantCard: ({ restaurant, selectedEnvironmentId, membershipEntry }: RestaurantCardProps) => {
    const React = require('react');
    const { Text } = require('react-native');
    return (
      <Text>
        {restaurant.name}|env:{selectedEnvironmentId ?? 'all'}|member:{membershipEntry ? 'y' : 'n'}
      </Text>
    );
  },
}));

const mockFiltered = useEnvironmentFilteredRestaurants as jest.MockedFunction<
  typeof useEnvironmentFilteredRestaurants
>;

function restaurant(id: string, name: string): Restaurant {
  return {
    id,
    concurrencyToken: 't',
    name,
    city: 'Tallinn',
    latitude: 59.4,
    longitude: 24.7,
    offerTimeText: '',
    parkingInfo: '',
    openingInfo: '',
    hasOffers: true,
    isFastFood: false,
    offersResourceUrl: null,
    offerProviderId: null,
  };
}

type FilteredReturn = ReturnType<typeof useEnvironmentFilteredRestaurants>;

function mockScreen(overrides: Partial<FilteredReturn>) {
  mockFiltered.mockReturnValue({
    query: {
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
      isRefetching: false,
    } as unknown as FilteredReturn['query'],
    restaurants: [],
    membership: {},
    selectedEnvironmentId: null,
    ...overrides,
  });
}

describe('DashboardScreen', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders the environment-filtered restaurants', () => {
    mockScreen({ restaurants: [restaurant('r1', 'Sushi Place')] });
    render(<DashboardScreen />);
    expect(screen.getByText(/Sushi Place/)).toBeTruthy();
  });

  it('passes the selected environment and membership entry to each card', () => {
    mockScreen({
      restaurants: [restaurant('r1', 'Sushi Place')],
      selectedEnvironmentId: 'e1',
      membership: { r1: { joinId: 'm1', concurrencyToken: 'tok' } },
    });
    render(<DashboardScreen />);
    expect(screen.getByText('Sushi Place|env:e1|member:y')).toBeTruthy();
  });

  it('shows the empty-environment message when a selected environment has no members', () => {
    mockScreen({ restaurants: [], selectedEnvironmentId: 'e1' });
    render(<DashboardScreen />);
    expect(screen.getByText('No restaurants in this environment yet.')).toBeTruthy();
  });

  it('shows the catalog-empty message on "All"', () => {
    mockScreen({ restaurants: [], selectedEnvironmentId: null });
    render(<DashboardScreen />);
    expect(screen.getByText('No restaurants yet.')).toBeTruthy();
  });
});
