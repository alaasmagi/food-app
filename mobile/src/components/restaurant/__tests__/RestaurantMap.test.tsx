import { fireEvent, render, screen } from '@testing-library/react-native';

import { RestaurantMap } from '@/components/restaurant/RestaurantMap';
import type { Restaurant } from '@/types/restaurant';

// Native map views don't render under Jest — mock to plain RN primitives that
// preserve markers and let us trigger the callout action.
jest.mock('react-native-maps', () => {
  const React = require('react');
  const { View, Pressable } = require('react-native');
  const MapView = ({ children }: any) => <View testID="map">{children}</View>;
  const Marker = ({ children, identifier }: any) => (
    <View testID="marker" accessibilityLabel={`marker-${identifier}`}>
      {children}
    </View>
  );
  const Callout = ({ children, onPress }: any) => (
    <Pressable accessibilityLabel="callout" onPress={onPress}>
      {children}
    </Pressable>
  );
  return { __esModule: true, default: MapView, Marker, Callout };
});

function restaurant(overrides: Partial<Restaurant>): Restaurant {
  return {
    id: 'x',
    concurrencyToken: 't',
    name: 'X',
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
    ...overrides,
  };
}

describe('RestaurantMap', () => {
  it('renders one marker per coordinate-bearing restaurant and omits the rest', () => {
    const restaurants = [
      restaurant({ id: 'a', latitude: 59.1, longitude: 24.1 }),
      restaurant({ id: 'b', latitude: 59.2, longitude: 24.2 }),
      // omitted: (0,0), NaN, and a non-finite coordinate
      restaurant({ id: 'zero', latitude: 0, longitude: 0 }),
      restaurant({ id: 'nan', latitude: NaN, longitude: 24.3 }),
    ];
    render(<RestaurantMap restaurants={restaurants} onSeeOffers={jest.fn()} />);
    expect(screen.getAllByTestId('marker')).toHaveLength(2);
    expect(screen.getByLabelText('marker-a')).toBeTruthy();
    expect(screen.getByLabelText('marker-b')).toBeTruthy();
  });

  it('calls onSeeOffers with the restaurant id when the callout is pressed', () => {
    const onSeeOffers = jest.fn();
    render(
      <RestaurantMap
        restaurants={[restaurant({ id: 'a', latitude: 59.1, longitude: 24.1 })]}
        onSeeOffers={onSeeOffers}
      />,
    );
    fireEvent.press(screen.getByLabelText('callout'));
    expect(onSeeOffers).toHaveBeenCalledWith('a');
  });

  it('renders no markers when no restaurant has coordinates', () => {
    render(
      <RestaurantMap
        restaurants={[restaurant({ id: 'zero', latitude: 0, longitude: 0 })]}
        onSeeOffers={jest.fn()}
      />,
    );
    expect(screen.queryAllByTestId('marker')).toHaveLength(0);
  });
});
