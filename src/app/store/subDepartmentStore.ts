import { create } from "zustand";
import { persist } from "zustand/middleware";

export type SubDepartmentSelectionState = {
  activeSubDept: unknown;
  setSubDept: (subDept: unknown) => void;
};

export const useSubdepartmentSelection = create<SubDepartmentSelectionState>()(
  persist(
    (set) => ({
      activeSubDept: null, // ← null until user logs in and selects a subdept
      setSubDept: (subDept) => set({ activeSubDept: subDept }),
    }),
    { name: "subdepartment-selection-storage" },
  ),
);
