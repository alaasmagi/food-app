import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  createWheel,
  deleteWheel,
  updateWheel,
  type WheelInput,
} from '@/api/wheels';
import { wheelsQueryKey } from '@/hooks/useWheels';

/**
 * Mutation hooks for saved wheels. Each invalidates the wheels query on success
 * so the list stays in sync and the refreshed concurrency token is picked up.
 * Update and delete pass the wheel's token as `If-Match`.
 */

export function useCreateWheel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: WheelInput) => createWheel(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: wheelsQueryKey }),
  });
}

export function useUpdateWheel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; input: WheelInput; concurrencyToken: string }) =>
      updateWheel(vars.id, vars.input, vars.concurrencyToken),
    onSuccess: () => qc.invalidateQueries({ queryKey: wheelsQueryKey }),
  });
}

export function useDeleteWheel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; concurrencyToken: string }) =>
      deleteWheel(vars.id, vars.concurrencyToken),
    onSuccess: () => qc.invalidateQueries({ queryKey: wheelsQueryKey }),
  });
}
