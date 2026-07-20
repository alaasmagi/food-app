import { act, renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

import * as api from '@/api/account';
import { currentUserQueryKey, useCurrentUser } from '@/hooks/useCurrentUser';
import { useUpdateNotificationPreferences } from '@/hooks/useUpdateNotificationPreferences';
import type { AppUser } from '@/types/appUser';

jest.mock('@/api/account');

const mockApi = api as jest.Mocked<typeof api>;

function user(overrides: Partial<AppUser> = {}): AppUser {
  return {
    id: 'u1',
    concurrencyToken: 't',
    email: 'a@b.c',
    username: 'a',
    fullName: 'A B',
    locale: 'en',
    sendNotifications: false,
    notificationEnvironmentId: null,
    ...overrides,
  };
}

function wrapper(client: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

describe('useCurrentUser', () => {
  beforeEach(() => jest.clearAllMocks());

  it('fetches the current user', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    mockApi.getCurrentUser.mockResolvedValue(user({ sendNotifications: true }));

    const { result } = renderHook(() => useCurrentUser(), { wrapper: wrapper(client) });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.sendNotifications).toBe(true);
  });
});

describe('useUpdateNotificationPreferences', () => {
  beforeEach(() => jest.clearAllMocks());

  it('writes the returned user into the current-user cache on success', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const updated = user({ sendNotifications: true, notificationEnvironmentId: 'e1' });
    mockApi.updateNotificationPreferences.mockResolvedValue(updated);

    const { result } = renderHook(() => useUpdateNotificationPreferences(), {
      wrapper: wrapper(client),
    });
    await act(async () => {
      await result.current.mutateAsync({ sendNotifications: true, notificationEnvironmentId: 'e1' });
    });

    expect(mockApi.updateNotificationPreferences).toHaveBeenCalledWith(true, 'e1');
    expect(client.getQueryData(currentUserQueryKey)).toEqual(updated);
  });
});
