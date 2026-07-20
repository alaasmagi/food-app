import { fireEvent, render, screen } from '@testing-library/react-native';

// app/ is at the project root, outside the "@/" (src) alias — use a relative path.
import SettingsScreen from '../../../app/(tabs)/settings';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useEnvironments } from '@/hooks/useEnvironments';
import { useUpdateNotificationPreferences } from '@/hooks/useUpdateNotificationPreferences';
import type { AppUser } from '@/types/appUser';
import type { DiningEnvironment } from '@/types/environment';

const mockPush = jest.fn();
const mockLogout = jest.fn();
const saveMutate = jest.fn();

jest.mock('@/hooks/useCurrentUser', () => ({ useCurrentUser: jest.fn() }));
jest.mock('@/hooks/useEnvironments', () => ({ useEnvironments: jest.fn() }));
jest.mock('@/hooks/useUpdateNotificationPreferences', () => ({
  useUpdateNotificationPreferences: jest.fn(),
}));
jest.mock('@/components/design-system/feedback/ToastProvider', () => ({
  useToast: () => ({ push: mockPush }),
}));
jest.mock('@/auth/AuthContext', () => ({ useAuth: () => ({ logout: mockLogout }) }));

const mockUseCurrentUser = useCurrentUser as jest.MockedFunction<typeof useCurrentUser>;
const mockUseEnvironments = useEnvironments as jest.MockedFunction<typeof useEnvironments>;
const mockUseUpdate = useUpdateNotificationPreferences as jest.MockedFunction<
  typeof useUpdateNotificationPreferences
>;

function user(overrides: Partial<AppUser> = {}): AppUser {
  return {
    id: 'u1',
    concurrencyToken: 't',
    email: 'a@b.c',
    username: 'a',
    fullName: 'A B',
    locale: 'en',
    sendNotifications: true,
    notificationEnvironmentId: null,
    ...overrides,
  };
}

function env(id: string, name: string): DiningEnvironment {
  return { id, concurrencyToken: 't', name, description: null };
}

function setup(u: AppUser, environments: DiningEnvironment[] = []) {
  mockUseCurrentUser.mockReturnValue({ data: u, isLoading: false } as ReturnType<
    typeof useCurrentUser
  >);
  mockUseEnvironments.mockReturnValue({ data: environments } as ReturnType<typeof useEnvironments>);
}

beforeEach(() => {
  jest.clearAllMocks();
  mockUseUpdate.mockReturnValue({ mutate: saveMutate, isPending: false } as unknown as ReturnType<
    typeof useUpdateNotificationPreferences
  >);
});

describe('SettingsScreen', () => {
  it('prefills the switch and select from the current user', () => {
    setup(user({ sendNotifications: true, notificationEnvironmentId: 'e1' }), [env('e1', 'Lunch')]);
    render(<SettingsScreen />);
    // The select trigger shows the current environment's label.
    expect(screen.getByText('Lunch')).toBeTruthy();
  });

  it('saves the local values (null for "All environments") and toasts success', () => {
    setup(user({ sendNotifications: true, notificationEnvironmentId: null }));
    saveMutate.mockImplementation((_vars, opts) => opts.onSuccess?.());

    render(<SettingsScreen />);
    fireEvent.press(screen.getByText('Save'));

    expect(saveMutate).toHaveBeenCalledWith(
      { sendNotifications: true, notificationEnvironmentId: null },
      expect.any(Object),
    );
    expect(mockPush).toHaveBeenCalledWith({ title: 'Settings saved', tone: 'success' });
  });

  it('toasts danger on save failure', () => {
    setup(user());
    saveMutate.mockImplementation((_vars, opts) => opts.onError?.(new Error('boom')));

    render(<SettingsScreen />);
    fireEvent.press(screen.getByText('Save'));

    expect(mockPush).toHaveBeenCalledWith({
      title: 'Could not save settings',
      description: 'Please try again.',
      tone: 'danger',
    });
  });

  it('offers only "All environments" when the user has no environments', () => {
    setup(user({ sendNotifications: true }), []);
    render(<SettingsScreen />);

    // Opening the (enabled) select reveals the single option in the overlay,
    // so "All environments" now renders twice (trigger + option).
    fireEvent.press(screen.getByText('All environments'));
    expect(screen.getAllByText('All environments').length).toBe(2);
  });

  it('disables the environment select when notifications are off', () => {
    setup(user({ sendNotifications: false }), [env('e1', 'Lunch')]);
    render(<SettingsScreen />);

    // Pressing the disabled trigger does not open the overlay.
    fireEvent.press(screen.getByText('All environments'));
    expect(screen.getAllByText('All environments').length).toBe(1);
    expect(screen.queryByText('Lunch')).toBeNull();
  });

  it('logs out via the auth action', () => {
    setup(user());
    render(<SettingsScreen />);
    fireEvent.press(screen.getByLabelText('Log out'));
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });
});
