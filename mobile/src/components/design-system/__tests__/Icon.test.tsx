import { render } from '@testing-library/react-native';

import { Icon, IconName } from '@/components/design-system/icons/Icon';

const NAMES: IconName[] = [
  'chevron-down',
  'check',
  'x',
  'search',
  'lock',
  'account-settings',
  'work',
  'arrow-right',
  'spinner',
];

describe('Icon', () => {
  it.each(NAMES)('renders "%s" without crashing', (name) => {
    const { toJSON } = render(<Icon name={name} />);
    expect(toJSON()).toBeTruthy();
  });

  it('renders at a custom size and color', () => {
    const { toJSON } = render(<Icon name="check" size={32} color="#FF0000" />);
    expect(toJSON()).toBeTruthy();
  });
});
