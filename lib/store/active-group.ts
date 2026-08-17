import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ActiveGroupState {
  activeGroupId: string | null;
  setActiveGroupId: (id: string | null) => void;
}

export const useActiveGroupStore = create<ActiveGroupState>()(
  persist(
    (set) => ({
      activeGroupId: null,
      setActiveGroupId: (id) => set({ activeGroupId: id }),
    }),
    {
      name: "maru-active-group",
    }
  )
);
