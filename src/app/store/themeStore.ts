import { create } from "zustand";

export type ThemeMode = "light" | "dark";

export type ThemeState = {
  mode: ThemeMode;
  toggleMode: () => void;
  resetToLight: () => void;
  setTheme: (mode: ThemeMode) => void;
};

export const useThemeStore = create<ThemeState>()((set) => ({
  mode: "light",
  toggleMode: () =>
    set((s) => ({ mode: s.mode === "dark" ? "light" : "dark" })),
  resetToLight: () => set({ mode: "light" }),
  setTheme: (mode) => set({ mode }),
}));
