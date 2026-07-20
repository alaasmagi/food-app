import { fireEvent, render, screen } from '@testing-library/react-native';

import { RatingStars } from '@/components/favourite/RatingStars';

describe('RatingStars', () => {
  it('renders read-only without interactive stars', () => {
    render(<RatingStars value={3} />);
    // No editable "Rate n" buttons in read-only mode.
    expect(screen.queryByLabelText('Rate 1')).toBeNull();
    expect(screen.queryByLabelText('Rate 5')).toBeNull();
  });

  it('exposes 5 pressable stars in editable mode', () => {
    render(<RatingStars value={0} editable onChange={jest.fn()} />);
    for (const n of [1, 2, 3, 4, 5]) {
      expect(screen.getByLabelText(`Rate ${n}`)).toBeTruthy();
    }
  });

  it('reports the value n when the nth star is activated', () => {
    const onChange = jest.fn();
    render(<RatingStars value={0} editable onChange={onChange} />);
    fireEvent.press(screen.getByLabelText('Rate 4'));
    expect(onChange).toHaveBeenCalledWith(4);
  });
});
