import { create } from 'zustand';

/**
 * Pure client state for environment filtering: which environment the Dashboard
 * and Map are currently filtered to. `null` means "All" (the full catalog).
 * This is not server data, so it lives in Zustand rather than React Query, and
 * both screens read the same value so a selection made on one is in effect on
 * the other.
 */
interface EnvironmentState {
  /** Selected environment id, or `null` for "All". */
  selectedEnvironmentId: string | null;
  /** Selects an environment; pass `null` to select "All". */
  setSelectedEnvironmentId: (id: string | null) => void;
}

export const useEnvironmentStore = create<EnvironmentState>((set) => ({
  selectedEnvironmentId: null,
  setSelectedEnvironmentId: (id) => set({ selectedEnvironmentId: id }),
}));
