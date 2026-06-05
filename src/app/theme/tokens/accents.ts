// src/app/theme/tokens/accents.ts
//
// Vivid accent palette — mode-aware, consistent across Admin and System Manager.
// These were previously duplicated inline inside sysDashboard_theme.ts.
//
// Usage:
//   import { getAccents } from '../tokens';
//   const accent = getAccents(mode);  // accent.blue, accent.blueDim, ...

import type { ThemeMode } from "./semantics";

export interface AccentTokens {
  blue:      string;
  blueDim:   string;
  amber:     string;
  amberDim:  string;
  green:     string;
  greenDim:  string;
  red:       string;
  redDim:    string;
  purple:    string;
  purpleDim: string;
  cyan:      string;
  cyanDim:   string;
}

const light: AccentTokens = {
  blue:      "#2563eb",
  blueDim:   "rgba(37,99,235,0.12)",
  amber:     "#d97706",
  amberDim:  "rgba(217,119,6,0.12)",
  green:     "#16a34a",
  greenDim:  "rgba(22,163,74,0.12)",
  red:       "#dc2626",
  redDim:    "rgba(220,38,38,0.10)",
  purple:    "#7c3aed",
  purpleDim: "rgba(124,58,237,0.10)",
  cyan:      "#0891b2",
  cyanDim:   "rgba(8,145,178,0.10)",
};

const dark: AccentTokens = {
  blue:      "#3b82f6",
  blueDim:   "rgba(59,130,246,0.15)",
  amber:     "#f59e0b",
  amberDim:  "rgba(245,158,11,0.15)",
  green:     "#22c55e",
  greenDim:  "rgba(34,197,94,0.12)",
  red:       "#ef4444",
  redDim:    "rgba(239,68,68,0.12)",
  purple:    "#a78bfa",
  purpleDim: "rgba(167,139,250,0.12)",
  cyan:      "#06b6d4",
  cyanDim:   "rgba(6,182,212,0.12)",
};

const accents: Record<ThemeMode, AccentTokens> = { light, dark };

/** Returns the vivid accent palette for the given mode */
export const getAccents = (mode: ThemeMode = "dark"): AccentTokens => accents[mode];

export default accents;
