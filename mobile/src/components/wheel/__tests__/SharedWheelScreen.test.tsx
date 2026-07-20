import { render, screen } from '@testing-library/react-native';

// app/ is at the project root, outside the "@/" (src) alias — use a relative path.
import SharedWheelScreen from '../../../../app/w/[id]';
import { authRedirectTarget } from '@/auth/authGate';
import { usePublicWheel } from '@/hooks/usePublicWheel';

jest.mock('@/hooks/usePublicWheel', () => ({ usePublicWheel: jest.fn() }));
jest.mock('expo-router', () => ({ useLocalSearchParams: () => ({ id: 'w1' }) }));
jest.mock('@/components/wheel/WheelSpinner', () => ({
  WheelSpinner: ({ names }: { names: string[] }) => {
    const React = require('react');
    const { Text } = require('react-native');
    return <Text>spinner-{names.join(',')}</Text>;
  },
}));

const mockUsePublicWheel = usePublicWheel as jest.MockedFunction<typeof usePublicWheel>;

function mockWheel(partial: Partial<ReturnType<typeof usePublicWheel>>) {
  mockUsePublicWheel.mockReturnValue({
    data: undefined,
    isLoading: false,
    isError: false,
    ...partial,
  } as ReturnType<typeof usePublicWheel>);
}

describe('SharedWheelScreen', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shows the wheel name and spinner for a found wheel', () => {
    mockWheel({ data: { name: 'Friday lunch', restaurantNames: ['Sushi', 'Pizza'] } });
    render(<SharedWheelScreen />);
    expect(screen.getByText('Friday lunch')).toBeTruthy();
    expect(screen.getByText('spinner-Sushi,Pizza')).toBeTruthy();
  });

  it('shows a friendly message when the wheel is not found (null)', () => {
    mockWheel({ data: null });
    render(<SharedWheelScreen />);
    expect(screen.getByText("This wheel isn't available.")).toBeTruthy();
  });
});

describe('authRedirectTarget (gate exemption)', () => {
  it('does not redirect an unauthenticated visitor on the public w route', () => {
    expect(authRedirectTarget('unauthenticated', ['w', '[id]'])).toBeNull();
  });

  it('still redirects an unauthenticated user off a gated route', () => {
    expect(authRedirectTarget('unauthenticated', ['(tabs)'])).toBe('/(auth)/login');
  });

  it('redirects an authenticated user out of the auth group', () => {
    expect(authRedirectTarget('authenticated', ['(auth)'])).toBe('/(tabs)');
  });

  it('stays put while loading', () => {
    expect(authRedirectTarget('loading', ['(tabs)'])).toBeNull();
  });
});
