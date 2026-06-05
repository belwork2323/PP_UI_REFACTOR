import { create } from "zustand";

type ApproverListRefreshState = {
  version: number;
  bumpVersion: () => void;
};

export const useApproverListRefreshStore = create<ApproverListRefreshState>()((set) => ({
  version: 0,
  bumpVersion: () => set((state) => ({ version: state.version + 1 })),
}));