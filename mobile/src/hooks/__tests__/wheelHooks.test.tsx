import { act, renderHook } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Clipboard from 'expo-clipboard';
import React from 'react';

import * as api from '@/api/wheels';
import { useCreateWheel, useDeleteWheel, useUpdateWheel } from '@/hooks/useWheelMutations';
import { wheelsQueryKey } from '@/hooks/useWheels';
import { shareLinkFor, useShareWheelLink } from '@/hooks/useShareWheelLink';
import type { UserWheel } from '@/types/wheel';

jest.mock('@/api/wheels');
jest.mock('expo-clipboard', () => ({ setStringAsync: jest.fn() }));

const mockPush = jest.fn();
jest.mock('@/components/design-system/feedback/ToastProvider', () => ({
  useToast: () => ({ push: mockPush }),
}));

const mockApi = api as jest.Mocked<typeof api>;
const mockSetString = Clipboard.setStringAsync as jest.MockedFunction<
  typeof Clipboard.setStringAsync
>;

function wheel(id: string): UserWheel {
  return { id, concurrencyToken: `tok-${id}`, name: id, restaurantNames: ['A', 'B'], isPublic: true };
}

function wrapper(client: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

describe('wheel mutations', () => {
  beforeEach(() => jest.clearAllMocks());

  it('create invalidates the wheels query', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const spy = jest.spyOn(client, 'invalidateQueries');
    mockApi.createWheel.mockResolvedValue(wheel('w1'));

    const { result } = renderHook(() => useCreateWheel(), { wrapper: wrapper(client) });
    await act(async () => {
      await result.current.mutateAsync({ name: 'X', restaurantNames: ['A', 'B'], isPublic: false });
    });

    expect(spy).toHaveBeenCalledWith({ queryKey: wheelsQueryKey });
  });

  it('update passes If-Match token and invalidates', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    mockApi.updateWheel.mockResolvedValue(wheel('w1'));

    const { result } = renderHook(() => useUpdateWheel(), { wrapper: wrapper(client) });
    await act(async () => {
      await result.current.mutateAsync({
        id: 'w1',
        input: { name: 'X', restaurantNames: ['A'], isPublic: true },
        concurrencyToken: 'tok-w1',
      });
    });

    expect(mockApi.updateWheel).toHaveBeenCalledWith(
      'w1',
      { name: 'X', restaurantNames: ['A'], isPublic: true },
      'tok-w1',
    );
  });

  it('delete passes If-Match token', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    mockApi.deleteWheel.mockResolvedValue(undefined);

    const { result } = renderHook(() => useDeleteWheel(), { wrapper: wrapper(client) });
    await act(async () => {
      await result.current.mutateAsync({ id: 'w1', concurrencyToken: 'tok-w1' });
    });

    expect(mockApi.deleteWheel).toHaveBeenCalledWith('w1', 'tok-w1');
  });
});

describe('useShareWheelLink', () => {
  beforeEach(() => jest.clearAllMocks());

  it('builds the link from the configured web app base', () => {
    expect(shareLinkFor('w1')).toBe('https://app.alaasmagi.dev/w/w1');
  });

  it('copies the link and toasts success', async () => {
    mockSetString.mockResolvedValue(true as never);
    const { result } = renderHook(() => useShareWheelLink());
    await act(async () => {
      await result.current.copyShareLink('w1');
    });
    expect(mockSetString).toHaveBeenCalledWith('https://app.alaasmagi.dev/w/w1');
    expect(mockPush).toHaveBeenCalledWith({ title: 'Link copied', tone: 'success' });
  });

  it('toasts danger and does not throw on clipboard failure', async () => {
    mockSetString.mockRejectedValue(new Error('no clipboard'));
    const { result } = renderHook(() => useShareWheelLink());
    await act(async () => {
      await expect(result.current.copyShareLink('w1')).resolves.toBeUndefined();
    });
    expect(mockPush).toHaveBeenCalledWith({
      title: 'Could not copy link',
      description: 'Please try again.',
      tone: 'danger',
    });
  });
});
