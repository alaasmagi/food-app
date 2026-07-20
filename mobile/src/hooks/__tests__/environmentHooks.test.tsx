import { act, renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

import * as api from '@/api/environments';
import {
  membershipMapForEnvironment,
  useEnvironmentRestaurants,
} from '@/hooks/useEnvironmentRestaurants';
import {
  filterRestaurantsByEnvironment,
  reconcileSelection,
} from '@/hooks/useEnvironmentFilteredRestaurants';
import {
  useAddRestaurantToEnvironment,
  useDeleteEnvironment,
} from '@/hooks/useEnvironmentMutations';
import { environmentRestaurantsQueryKey } from '@/hooks/useEnvironmentRestaurants';
import { environmentsQueryKey } from '@/hooks/useEnvironments';
import { useEnvironmentStore } from '@/stores/environmentStore';
import type { EnvironmentRestaurant } from '@/types/environment';
import type { Restaurant } from '@/types/restaurant';

jest.mock('@/api/environments');

const mockApi = api as jest.Mocked<typeof api>;

function membership(id: string, environmentId: string, restaurantId: string): EnvironmentRestaurant {
  return { id, concurrencyToken: `tok-${id}`, environmentId, restaurantId };
}

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

function wrapper(client: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

describe('membershipMapForEnvironment', () => {
  const rows = [
    membership('m1', 'e1', 'r1'),
    membership('m2', 'e1', 'r2'),
    membership('m3', 'e2', 'r1'),
  ];

  it('maps restaurantId to its join row for the given environment', () => {
    expect(membershipMapForEnvironment(rows, 'e1')).toEqual({
      r1: { joinId: 'm1', concurrencyToken: 'tok-m1' },
      r2: { joinId: 'm2', concurrencyToken: 'tok-m2' },
    });
  });

  it('is empty for the "All" selection (null)', () => {
    expect(membershipMapForEnvironment(rows, null)).toEqual({});
  });
});

describe('filterRestaurantsByEnvironment', () => {
  const restaurants = [restaurant('r1'), restaurant('r2'), restaurant('r3')];

  it('passes the full catalog through for "All"', () => {
    expect(filterRestaurantsByEnvironment(restaurants, null, {})).toHaveLength(3);
  });

  it('keeps only members of the selected environment', () => {
    const map = membershipMapForEnvironment([membership('m1', 'e1', 'r2')], 'e1');
    const result = filterRestaurantsByEnvironment(restaurants, 'e1', map);
    expect(result.map((r) => r.id)).toEqual(['r2']);
  });
});

describe('reconcileSelection', () => {
  const envs = [
    { id: 'e1', concurrencyToken: 't', name: 'Lunch', description: null },
    { id: 'e2', concurrencyToken: 't', name: 'Dinner', description: null },
  ];

  it('keeps a still-existing selection', () => {
    expect(reconcileSelection('e1', envs)).toBe('e1');
  });

  it('resets to null when the selected id is gone', () => {
    expect(reconcileSelection('e9', envs)).toBeNull();
  });

  it('leaves "All" as null', () => {
    expect(reconcileSelection(null, envs)).toBeNull();
  });
});

describe('environment mutation invalidations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useEnvironmentStore.setState({ selectedEnvironmentId: null });
  });

  it('add-membership invalidates the memberships query', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const spy = jest.spyOn(client, 'invalidateQueries');
    mockApi.addRestaurantToEnvironment.mockResolvedValue(membership('m1', 'e1', 'r1'));

    const { result } = renderHook(() => useAddRestaurantToEnvironment(), {
      wrapper: wrapper(client),
    });
    await act(async () => {
      await result.current.mutateAsync({ environmentId: 'e1', restaurantId: 'r1' });
    });

    expect(spy).toHaveBeenCalledWith({ queryKey: environmentRestaurantsQueryKey });
  });

  it('delete-environment invalidates both environments and memberships', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const spy = jest.spyOn(client, 'invalidateQueries');
    mockApi.deleteEnvironment.mockResolvedValue(undefined);

    const { result } = renderHook(() => useDeleteEnvironment(), { wrapper: wrapper(client) });
    await act(async () => {
      await result.current.mutateAsync({ id: 'e1', concurrencyToken: 'tok' });
    });

    expect(spy).toHaveBeenCalledWith({ queryKey: environmentsQueryKey });
    expect(spy).toHaveBeenCalledWith({ queryKey: environmentRestaurantsQueryKey });
  });
});

describe('useEnvironmentRestaurants', () => {
  it('fetches membership rows from the api', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    mockApi.getEnvironmentRestaurants.mockResolvedValue([membership('m1', 'e1', 'r1')]);

    const { result } = renderHook(() => useEnvironmentRestaurants(), { wrapper: wrapper(client) });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([membership('m1', 'e1', 'r1')]);
  });
});

describe('environmentStore', () => {
  it('sets and clears the selected environment', () => {
    useEnvironmentStore.setState({ selectedEnvironmentId: null });
    act(() => useEnvironmentStore.getState().setSelectedEnvironmentId('e1'));
    expect(useEnvironmentStore.getState().selectedEnvironmentId).toBe('e1');
    act(() => useEnvironmentStore.getState().setSelectedEnvironmentId(null));
    expect(useEnvironmentStore.getState().selectedEnvironmentId).toBeNull();
  });
});
