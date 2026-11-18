import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type ThemeMode = "light" | "dark";

export type ThemeState = {
  mode: ThemeMode;
  toggleMode: () => void;
  resetToLight: () => void;
  setTheme: (mode: ThemeMode) => void;
};

const THEME_STORAGE_KEY = "theme-storage";

/** Sync read so hard refresh keeps dark/light before React hydrates. */
const readStoredMode = (): ThemeMode => {
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    if (!raw) return "light";
    const parsed = JSON.parse(raw) as { state?: { mode?: unknown } };
    return parsed?.state?.mode === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: readStoredMode(),
      toggleMode: () =>
        set((s) => ({ mode: s.mode === "dark" ? "light" : "dark" })),
      resetToLight: () => set({ mode: "light" }),
      setTheme: (mode) => set({ mode }),
    }),
    {
      name: THEME_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ mode: state.mode }),
    },
  ),
);
