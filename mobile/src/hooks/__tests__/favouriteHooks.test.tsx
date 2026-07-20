import { act, renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

import * as api from '@/api/favourites';
import { favouriteMap, favouritesQueryKey, useFavourites } from '@/hooks/useFavourites';
import { useUpsertFavourite } from '@/hooks/useUpsertFavourite';
import type { Favourite } from '@/types/favourite';

jest.mock('@/api/favourites');

const mockApi = api as jest.Mocked<typeof api>;

function favourite(id: string, restaurantId: string, rating = 4): Favourite {
  return { id, concurrencyToken: `tok-${id}`, restaurantId, rating, note: null };
}

function wrapper(client: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

describe('favouriteMap', () => {
  it('keys favourites by restaurantId', () => {
    const map = favouriteMap([favourite('f1', 'r1'), favourite('f2', 'r2')]);
    expect(map.r1.id).toBe('f1');
    expect(map.r2.id).toBe('f2');
  });
});

describe('useFavourites', () => {
  beforeEach(() => jest.clearAllMocks());

  it('fetches favourites and looks them up by restaurant', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    mockApi.getFavourites.mockResolvedValue([favourite('f1', 'r1', 5)]);

    const { result } = renderHook(() => useFavourites(), { wrapper: wrapper(client) });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.favouriteFor('r1')?.rating).toBe(5);
    expect(result.current.favouriteFor('r2')).toBeUndefined();
  });
});

describe('useUpsertFavourite', () => {
  beforeEach(() => jest.clearAllMocks());

  it('creates when the restaurant has no favourite yet', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    client.setQueryData(favouritesQueryKey, []);
    const spy = jest.spyOn(client, 'invalidateQueries');
    mockApi.createFavourite.mockResolvedValue(favourite('f1', 'r1'));

    const { result } = renderHook(() => useUpsertFavourite(), { wrapper: wrapper(client) });
    await act(async () => {
      await result.current.mutateAsync({ restaurantId: 'r1', rating: 4, note: null });
    });

    expect(mockApi.createFavourite).toHaveBeenCalledWith({
      restaurantId: 'r1',
      rating: 4,
      note: null,
    });
    expect(mockApi.updateFavourite).not.toHaveBeenCalled();
    expect(spy).toHaveBeenCalledWith({ queryKey: favouritesQueryKey });
  });

  it('updates with If-Match when a favourite already exists', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    client.setQueryData(favouritesQueryKey, [favourite('f1', 'r1', 3)]);
    mockApi.updateFavourite.mockResolvedValue(favourite('f1', 'r1', 5));

    const { result } = renderHook(() => useUpsertFavourite(), { wrapper: wrapper(client) });
    await act(async () => {
      await result.current.mutateAsync({ restaurantId: 'r1', rating: 5, note: 'great' });
    });

    expect(mockApi.updateFavourite).toHaveBeenCalledWith(
      'f1',
      { restaurantId: 'r1', rating: 5, note: 'great' },
      'tok-f1',
    );
    expect(mockApi.createFavourite).not.toHaveBeenCalled();
  });
});
