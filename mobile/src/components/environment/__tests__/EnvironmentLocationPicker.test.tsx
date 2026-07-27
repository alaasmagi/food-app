import { fireEvent, render, screen } from '@testing-library/react-native';

import {
  EnvironmentLocationPicker,
  validateOrigin,
  type LocationOrigin,
} from '@/components/environment/EnvironmentLocationPicker';

// Native map views don't render under Jest — mock to plain RN primitives that
// preserve the marker/circle and let us trigger the map's onPress.
jest.mock('react-native-maps', () => {
  const React = require('react');
  const { View, Pressable } = require('react-native');
  const MapView = React.forwardRef(({ children, onPress }: any, _ref: any) => (
    <View testID="map">
      <Pressable
        accessibilityLabel="map-press"
        onPress={() =>
          onPress?.({ nativeEvent: { coordinate: { latitude: 59.1, longitude: 24.1 } } })
        }
      />
      {children}
    </View>
  ));
  const Marker = ({ identifier }: any) => (
    <View testID="marker" accessibilityLabel={`marker-${identifier}`} />
  );
  const Circle = () => <View testID="circle" />;
  return { __esModule: true, default: MapView, Marker, Circle };
});

const EMPTY: LocationOrigin = { latitude: null, longitude: null, radiusMeters: null };
const LOCATED: LocationOrigin = { latitude: 59.4, longitude: 24.7, radiusMeters: null };

describe('validateOrigin', () => {
  it('accepts an empty origin and a full origin', () => {
    expect(validateOrigin(EMPTY)).toBeNull();
    expect(validateOrigin({ latitude: 1, longitude: 2, radiusMeters: 500 })).toBeNull();
  });

  it('rejects a single coordinate without its pair', () => {
    expect(validateOrigin({ latitude: 1, longitude: null, radiusMeters: null })).toMatch(
      /both coordinates/i,
    );
  });

  it('rejects a radius without a location', () => {
    expect(validateOrigin({ latitude: null, longitude: null, radiusMeters: 500 })).toMatch(
      /location/i,
    );
  });

  it('rejects an out-of-range radius', () => {
    expect(validateOrigin({ latitude: 1, longitude: 2, radiusMeters: 0 })).toMatch(/1 and 50000/);
    expect(validateOrigin({ latitude: 1, longitude: 2, radiusMeters: 50001 })).toMatch(
      /1 and 50000/,
    );
  });
});

describe('EnvironmentLocationPicker', () => {
  it('emits the coordinates when the map is pressed', () => {
    const onChange = jest.fn();
    render(<EnvironmentLocationPicker value={EMPTY} onChange={onChange} />);
    fireEvent.press(screen.getByLabelText('map-press'));
    expect(onChange).toHaveBeenCalledWith({
      latitude: 59.1,
      longitude: 24.1,
      radiusMeters: null,
    });
  });

  it('nulls all fields when the location is cleared', () => {
    const onChange = jest.fn();
    render(<EnvironmentLocationPicker value={LOCATED} onChange={onChange} />);
    fireEvent.press(screen.getByText('Clear location'));
    expect(onChange).toHaveBeenCalledWith({
      latitude: null,
      longitude: null,
      radiusMeters: null,
    });
  });

  it('hides the radius input and circle until a location is set', () => {
    const { rerender } = render(<EnvironmentLocationPicker value={EMPTY} onChange={jest.fn()} />);
    expect(screen.queryByTestId('circle')).toBeNull();
    expect(screen.queryByText('Radius (meters)')).toBeNull();
    expect(screen.getByText('Tap the map to set a location.')).toBeTruthy();

    rerender(<EnvironmentLocationPicker value={LOCATED} onChange={jest.fn()} />);
    expect(screen.getByTestId('circle')).toBeTruthy();
    expect(screen.getByText('Radius (meters)')).toBeTruthy();
  });

  it('shows the default-radius hint when a location is set with no radius', () => {
    render(<EnvironmentLocationPicker value={LOCATED} onChange={jest.fn()} />);
    expect(screen.getByText('Defaults to 500 m')).toBeTruthy();
  });
});
