import { create } from 'zustand';

/** Environment filter shared by Dashboard and Map; `null` means "All". */
interface EnvironmentState {
  selectedEnvironmentId: string | null;
  setSelectedEnvironmentId: (id: string | null) => void;
}

export const useEnvironmentStore = create<EnvironmentState>((set) => ({
  selectedEnvironmentId: null,
  setSelectedEnvironmentId: (id) => set({ selectedEnvironmentId: id }),
}));
