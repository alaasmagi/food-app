import { fireEvent, render, screen } from '@testing-library/react-native';

import { Checkbox } from '@/components/design-system/forms/Checkbox';
import { Switch } from '@/components/design-system/forms/Switch';

describe('Switch', () => {
  it('renders with a label', () => {
    render(<Switch label="Public" />);
    expect(screen.getByText('Public')).toBeTruthy();
  });

  it('reports the toggled value via onChange', () => {
    const onChange = jest.fn();
    render(<Switch label="Public" checked={false} onChange={onChange} />);
    fireEvent.press(screen.getByLabelText('Public'));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('does not fire onChange when disabled', () => {
    const onChange = jest.fn();
    render(<Switch label="Public" disabled onChange={onChange} />);
    fireEvent.press(screen.getByLabelText('Public'));
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('Checkbox', () => {
  it('renders with a label', () => {
    render(<Checkbox label="Sushi Place" />);
    expect(screen.getByText('Sushi Place')).toBeTruthy();
  });

  it('reports the toggled value via onChange', () => {
    const onChange = jest.fn();
    render(<Checkbox label="Sushi Place" checked={false} onChange={onChange} />);
    fireEvent.press(screen.getByLabelText('Sushi Place'));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('reports false when unchecking a checked box', () => {
    const onChange = jest.fn();
    render(<Checkbox label="Sushi Place" checked onChange={onChange} />);
    fireEvent.press(screen.getByLabelText('Sushi Place'));
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it('does not fire onChange when disabled', () => {
    const onChange = jest.fn();
    render(<Checkbox label="Sushi Place" disabled onChange={onChange} />);
    fireEvent.press(screen.getByLabelText('Sushi Place'));
    expect(onChange).not.toHaveBeenCalled();
  });
});
