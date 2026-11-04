import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  addRestaurantToEnvironment,
  autoFillEnvironment,
  createEnvironment,
  deleteEnvironment,
  removeRestaurantFromEnvironment,
  updateEnvironment,
  type EnvironmentInput,
} from '@/api/environments';
import { environmentsQueryKey } from '@/hooks/useEnvironments';
import { environmentRestaurantsQueryKey } from '@/hooks/useEnvironmentRestaurants';

/**
 * Environment and membership mutations. Deleting an environment also invalidates
 * memberships because the backend cascades the join rows.
 */

export function useCreateEnvironment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: EnvironmentInput) => createEnvironment(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: environmentsQueryKey }),
  });
}

export function useUpdateEnvironment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; input: EnvironmentInput; concurrencyToken: string }) =>
      updateEnvironment(vars.id, vars.input, vars.concurrencyToken),
    onSuccess: () => qc.invalidateQueries({ queryKey: environmentsQueryKey }),
  });
}

export function useDeleteEnvironment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; concurrencyToken: string }) =>
      deleteEnvironment(vars.id, vars.concurrencyToken),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: environmentsQueryKey });
      qc.invalidateQueries({ queryKey: environmentRestaurantsQueryKey });
    },
  });
}

export function useAutoFillEnvironment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => autoFillEnvironment(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: environmentRestaurantsQueryKey }),
  });
}

export function useAddRestaurantToEnvironment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { environmentId: string; restaurantId: string }) =>
      addRestaurantToEnvironment(vars.environmentId, vars.restaurantId),
    onSuccess: () => qc.invalidateQueries({ queryKey: environmentRestaurantsQueryKey }),
  });
}

export function useRemoveRestaurantFromEnvironment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { joinId: string; concurrencyToken: string }) =>
      removeRestaurantFromEnvironment(vars.joinId, vars.concurrencyToken),
    onSuccess: () => qc.invalidateQueries({ queryKey: environmentRestaurantsQueryKey }),
  });
}
