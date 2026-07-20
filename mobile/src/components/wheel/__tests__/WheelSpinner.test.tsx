import { fireEvent, render, screen } from '@testing-library/react-native';
import { Animated } from 'react-native';

import { WheelSpinner } from '@/components/wheel/WheelSpinner';

// Make the spin animation resolve synchronously so the result callback fires.
beforeEach(() => {
  jest
    .spyOn(Animated, 'timing')
    .mockReturnValue({
      start: (cb?: (r: { finished: boolean }) => void) => cb?.({ finished: true }),
    } as unknown as Animated.CompositeAnimation);
});

afterEach(() => jest.restoreAllMocks());

describe('WheelSpinner', () => {
  it('renders a label per name', () => {
    const { toJSON } = render(<WheelSpinner names={['Sushi', 'Pizza', 'Tacos']} />);
    // Segment labels render inside react-native-svg <Text>, which getByText does
    // not traverse; assert against the serialized tree instead.
    const tree = JSON.stringify(toJSON());
    expect(tree).toContain('Sushi');
    expect(tree).toContain('Pizza');
    expect(tree).toContain('Tacos');
  });

  it('disables spin and shows a hint with fewer than 2 names', () => {
    render(<WheelSpinner names={['Solo']} />);
    expect(screen.getByText('Add at least 2 restaurants to spin.')).toBeTruthy();
    // Pressing does nothing (no winner appears).
    fireEvent.press(screen.getByText('Spin'));
    expect(screen.queryByText('Winner')).toBeNull();
  });

  it('reports one of the wheel names on spin', () => {
    const names = ['Sushi', 'Pizza', 'Tacos'];
    const onResult = jest.fn();
    render(<WheelSpinner names={names} onResult={onResult} />);

    fireEvent.press(screen.getByText('Spin'));

    expect(onResult).toHaveBeenCalledTimes(1);
    expect(names).toContain(onResult.mock.calls[0][0]);
    // The winner is also shown.
    expect(screen.getByText('Winner')).toBeTruthy();
  });

  it('lands on the mocked random selection', () => {
    const names = ['Sushi', 'Pizza', 'Tacos'];
    const onResult = jest.fn();
    // Math.random() -> index floor(0.5 * 3) = 1 -> 'Pizza'
    jest.spyOn(Math, 'random').mockReturnValue(0.5);
    render(<WheelSpinner names={names} onResult={onResult} />);

    fireEvent.press(screen.getByText('Spin'));

    expect(onResult).toHaveBeenCalledWith('Pizza');
  });
});
