import { act, renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

import { getRestaurants } from '@/api/restaurants';
import { getEnvironments, getEnvironmentRestaurants } from '@/api/environments';
import { useEnvironmentFilteredRestaurants } from '@/hooks/useEnvironmentFilteredRestaurants';
import { useEnvironmentStore } from '@/stores/environmentStore';
import type { DiningEnvironment, EnvironmentRestaurant } from '@/types/environment';
import type { Restaurant } from '@/types/restaurant';

jest.mock('@/api/restaurants', () => ({ getRestaurants: jest.fn() }));
jest.mock('@/api/environments', () => ({
  getEnvironments: jest.fn(),
  getEnvironmentRestaurants: jest.fn(),
}));

const mockGetRestaurants = getRestaurants as jest.MockedFunction<typeof getRestaurants>;
const mockGetEnvironments = getEnvironments as jest.MockedFunction<typeof getEnvironments>;
const mockGetMemberships = getEnvironmentRestaurants as jest.MockedFunction<
  typeof getEnvironmentRestaurants
>;

function restaurant(id: string): Restaurant {
  return {
    id,
    concurrencyToken: 't',
    name: id,
    city: 'Tallinn',
    latitude: 59.4,
    longitude: 24.7,
    offerTimeText: '',
    parkingInfo: '',
    openingInfo: '',
    hasOffers: true,
    isFastFood: false,
    offersResourceUrl: null,
    offerProviderId: null,
  };
}

const environment: DiningEnvironment = {
  id: 'e1',
  concurrencyToken: 't',
  name: 'Lunch',
  description: null,
};
const membership: EnvironmentRestaurant = {
  id: 'm1',
  concurrencyToken: 'tok-m1',
  environmentId: 'e1',
  restaurantId: 'r2',
};

function wrapper(client: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

describe('useEnvironmentFilteredRestaurants', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useEnvironmentStore.setState({ selectedEnvironmentId: null });
    mockGetRestaurants.mockResolvedValue([restaurant('r1'), restaurant('r2'), restaurant('r3')]);
    mockGetEnvironments.mockResolvedValue([environment]);
    mockGetMemberships.mockResolvedValue([membership]);
  });

  it('filters by the shared store selection without refetching restaurants', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { result } = renderHook(() => useEnvironmentFilteredRestaurants(), {
      wrapper: wrapper(client),
    });

    // "All" shows the whole cached catalog.
    await waitFor(() => expect(result.current.restaurants).toHaveLength(3));
    expect(mockGetRestaurants).toHaveBeenCalledTimes(1);

    // Selecting an environment on the shared store narrows the list client-side.
    act(() => useEnvironmentStore.getState().setSelectedEnvironmentId('e1'));
    await waitFor(() => expect(result.current.restaurants.map((r) => r.id)).toEqual(['r2']));

    // The membership map for the selection is exposed for the cards.
    expect(result.current.membership).toEqual({
      r2: { joinId: 'm1', concurrencyToken: 'tok-m1' },
    });
    // No extra restaurants request was issued by switching environments.
    expect(mockGetRestaurants).toHaveBeenCalledTimes(1);
  });

  it('falls back to "All" when the selected environment no longer exists', async () => {
    useEnvironmentStore.setState({ selectedEnvironmentId: 'gone' });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { result } = renderHook(() => useEnvironmentFilteredRestaurants(), {
      wrapper: wrapper(client),
    });

    await waitFor(() => expect(useEnvironmentStore.getState().selectedEnvironmentId).toBeNull());
    expect(result.current.restaurants).toHaveLength(3);
  });
});
