import { fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { Badge, BadgeTone } from '@/components/design-system/data-display/Badge';
import { Card } from '@/components/design-system/data-display/Card';
import { Tag } from '@/components/design-system/data-display/Tag';

const TONES: BadgeTone[] = ['neutral', 'accent', 'success', 'warning', 'danger'];

describe('Card', () => {
  it('renders children', () => {
    render(
      <Card>
        <Text>content</Text>
      </Card>,
    );
    expect(screen.getByText('content')).toBeTruthy();
  });

  it('fires onPress when pressable', () => {
    const onPress = jest.fn();
    render(
      <Card onPress={onPress}>
        <Text>tap card</Text>
      </Card>,
    );
    fireEvent.press(screen.getByText('tap card'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

describe('Badge', () => {
  it.each(TONES)('renders tone "%s"', (tone) => {
    render(<Badge tone={tone}>Status</Badge>);
    expect(screen.getByText('Status')).toBeTruthy();
  });

  it('renders with a leading icon', () => {
    const { toJSON } = render(
      <Badge tone="warning" icon="alert-triangle">
        Warn
      </Badge>,
    );
    expect(toJSON()).toBeTruthy();
  });
});

describe('Tag', () => {
  it('renders default and selected', () => {
    render(<Tag>Tallinn</Tag>);
    expect(screen.getByText('Tallinn')).toBeTruthy();
    render(<Tag selected>Active</Tag>);
    expect(screen.getByText('Active')).toBeTruthy();
  });

  it('calls onRemove when the x is pressed', () => {
    const onRemove = jest.fn();
    render(<Tag onRemove={onRemove}>Filter</Tag>);
    fireEvent.press(screen.getByLabelText('Remove'));
    expect(onRemove).toHaveBeenCalledTimes(1);
  });
});
