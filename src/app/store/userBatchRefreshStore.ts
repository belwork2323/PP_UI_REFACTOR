import { create } from "zustand";

type UserBatchRefreshState = {
  version: number;
  bumpVersion: () => void;
};

export const useUserBatchRefreshStore = create<UserBatchRefreshState>()((set) => ({
  version: 0,
  bumpVersion: () => set((state) => ({ version: state.version + 1 })),
}));
