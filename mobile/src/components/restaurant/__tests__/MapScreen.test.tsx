import { fireEvent, render, screen } from '@testing-library/react-native';

// app/ is at the project root, outside the "@/" (src) alias — use a relative path.
import MapScreen from '../../../../app/(tabs)/map';
import { useEnvironmentFilteredRestaurants } from '@/hooks/useEnvironmentFilteredRestaurants';
import type { Restaurant } from '@/types/restaurant';
import type { RestaurantMapProps } from '@/components/restaurant/RestaurantMap';

jest.mock('@/hooks/useEnvironmentFilteredRestaurants', () => ({
  useEnvironmentFilteredRestaurants: jest.fn(),
}));
// The tab row has its own test; stub it so the screen test stays focused.
jest.mock('@/components/environment/EnvironmentTabs', () => ({
  EnvironmentTabs: () => null,
}));

// Stand in for the native map: expose a button that fires onSeeOffers and
// reports how many restaurants it was handed, so we can assert filtering.
jest.mock('@/components/restaurant/RestaurantMap', () => ({
  RestaurantMap: ({ restaurants, onSeeOffers }: RestaurantMapProps) => {
    const React = require('react');
    const { Pressable, Text } = require('react-native');
    return (
      <Pressable accessibilityLabel="see-offers-r1" onPress={() => onSeeOffers('r1')}>
        <Text>map-count-{restaurants.length}</Text>
      </Pressable>
    );
  },
}));

// Isolate the screen from the offers query.
jest.mock('@/components/restaurant/OfferList', () => ({
  OfferList: ({ restaurantId }: { restaurantId: string }) => {
    const React = require('react');
    const { Text } = require('react-native');
    return <Text>offers-for-{restaurantId}</Text>;
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

function mockScreen(restaurants: Restaurant[], selectedEnvironmentId: string | null = null) {
  mockFiltered.mockReturnValue({
    query: { isLoading: false, isError: false, error: null } as ReturnType<
      typeof useEnvironmentFilteredRestaurants
    >['query'],
    restaurants,
    membership: {},
    selectedEnvironmentId,
  });
}

describe('MapScreen', () => {
  beforeEach(() => jest.clearAllMocks());

  it('opens the offers sheet for the chosen restaurant on See offers', () => {
    mockScreen([restaurant('r1', 'Sushi Place')]);
    render(<MapScreen />);
    // Sheet not shown initially.
    expect(screen.queryByText('offers-for-r1')).toBeNull();

    fireEvent.press(screen.getByLabelText('see-offers-r1'));

    expect(screen.getByText('Sushi Place')).toBeTruthy();
    expect(screen.getByText('offers-for-r1')).toBeTruthy();
  });

  it('hands the map only the environment-filtered restaurants', () => {
    // Two in the catalog but the selected environment filtered it to one.
    mockScreen([restaurant('r1', 'Sushi Place')], 'e1');
    render(<MapScreen />);
    expect(screen.getByText('map-count-1')).toBeTruthy();
  });
});
