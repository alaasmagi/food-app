import { fireEvent, render, screen } from '@testing-library/react-native';

import { Select } from '@/components/design-system/forms/Select';

const OPTIONS = [
  { value: 'all', label: 'All environments' },
  { value: 'e1', label: 'Lunch' },
  { value: 'e2', label: 'Dinner' },
];

describe('Select', () => {
  it('shows the placeholder when nothing is selected', () => {
    render(<Select options={OPTIONS} placeholder="Choose one" />);
    expect(screen.getByText('Choose one')).toBeTruthy();
  });

  it('shows the selected option label', () => {
    render(<Select options={OPTIONS} value="e1" />);
    expect(screen.getByText('Lunch')).toBeTruthy();
  });

  it('opens and reports the chosen value via onChange', () => {
    const onChange = jest.fn();
    render(<Select options={OPTIONS} value="all" onChange={onChange} />);
    // Open the overlay by pressing the trigger (shows the current label).
    fireEvent.press(screen.getByText('All environments'));
    fireEvent.press(screen.getByText('Dinner'));
    expect(onChange).toHaveBeenCalledWith('e2');
  });

  it('does not open when disabled', () => {
    render(<Select options={OPTIONS} placeholder="Choose one" disabled />);
    fireEvent.press(screen.getByText('Choose one'));
    // The other options never render because the overlay stays closed.
    expect(screen.queryByText('Dinner')).toBeNull();
  });
});
