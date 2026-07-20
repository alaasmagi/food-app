import { fireEvent, render, screen } from '@testing-library/react-native';

import { Button, ButtonProps } from '@/components/design-system/forms/Button';

const VARIANTS: NonNullable<ButtonProps['variant']>[] = ['primary', 'secondary', 'ghost', 'danger'];
const SIZES: NonNullable<ButtonProps['size']>[] = ['sm', 'md', 'lg'];

describe('Button', () => {
  it.each(VARIANTS)('renders variant "%s"', (variant) => {
    const { toJSON } = render(<Button variant={variant}>Tap</Button>);
    expect(toJSON()).toBeTruthy();
  });

  it.each(SIZES)('renders size "%s"', (size) => {
    const { toJSON } = render(<Button size={size}>Tap</Button>);
    expect(toJSON()).toBeTruthy();
  });

  it('fires onPress when enabled', () => {
    const onPress = jest.fn();
    render(
      <Button onPress={onPress} accessibilityLabel="go">
        Go
      </Button>,
    );
    fireEvent.press(screen.getByLabelText('go'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not fire onPress when disabled', () => {
    const onPress = jest.fn();
    render(
      <Button onPress={onPress} disabled accessibilityLabel="go">
        Go
      </Button>,
    );
    fireEvent.press(screen.getByLabelText('go'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('does not fire onPress while loading', () => {
    const onPress = jest.fn();
    render(
      <Button onPress={onPress} loading accessibilityLabel="go">
        Go
      </Button>,
    );
    fireEvent.press(screen.getByLabelText('go'));
    expect(onPress).not.toHaveBeenCalled();
  });
});
