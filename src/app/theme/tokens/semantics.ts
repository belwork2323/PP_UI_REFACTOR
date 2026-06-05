// src/app/theme/tokens/semantics.ts
//
// Semantic token layer — single source of truth for mode-aware design tokens.
// Every feature theme should derive its surface/text/border values from here
// instead of re-computing them from colors.dashboard[mode].
//
// Usage:
//   import { getTokens } from '../tokens';
//   const s = getTokens(mode);  // s.textPrimary, s.cardBg, ...

export type ThemeMode = "light" | "dark";

export interface SemanticTokens {
  /* ── Text ─────────────────────────────────────────────────── */
  textPrimary:    string;
  textSecondary:  string;
  textDisabled:   string;
  textSuccess:    string;
  textDanger:     string;
  textWarning:    string;

  /* ── Surfaces ─────────────────────────────────────────────── */
  pageBg:         string;   // outermost page background
  cardBg:         string;   // card / panel face
  surfaceEl:      string;   // inner element (table header, inner well, sunken tile)
  cardShadow:     string;
  cardBorder:     string;

  /* ── Borders ──────────────────────────────────────────────── */
  borderDefault:  string;   // standard dividers, card borders
  borderSubtle:   string;   // very faint separators
  borderStrong:   string;   // hover / focus borders

  /* ── Interactive ──────────────────────────────────────────── */
  rowHover:       string;   // table/list row hover background
  progressTrack:  string;   // progress bar track background

  /* ── Semantic state accents (shared, vivid) ───────────────── */
  stateSuccess:   string;
  stateError:     string;
  stateWarning:   string;
  stateInfo:      string;

  /* ── Chart / header gradients ─────────────────────────────── */
  chartHeaderBar:  string;
  chartHeaderLine: string;
  chartHeaderArea: string;
}

const light: SemanticTokens = {
  textPrimary:   "#111111",
  textSecondary: "rgba(0,0,0,0.50)",
  textDisabled:  "rgba(0,0,0,0.30)",
  textSuccess:   "#2e7d32",
  textDanger:    "#c62828",
  textWarning:   "#e65100",

  pageBg:        "#f5f6fa",
  cardBg:        "#ffffff",
  surfaceEl:     "#f5f6fa",
  cardShadow:    "0 2px 12px rgba(0,0,0,0.08)",
  cardBorder:    "rgba(0,0,0,0.06)",

  borderDefault: "rgba(0,0,0,0.08)",
  borderSubtle:  "rgba(0,0,0,0.045)",
  borderStrong:  "rgba(0,0,0,0.16)",

  rowHover:      "rgba(0,0,0,0.025)",
  progressTrack: "rgba(0,0,0,0.08)",

  stateSuccess:  "#16a34a",
  stateError:    "#dc2626",
  stateWarning:  "#d97706",
  stateInfo:     "#2563eb",

  chartHeaderBar:  "linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)",
  chartHeaderLine: "linear-gradient(135deg, #388e3c 0%, #81c784 100%)",
  chartHeaderArea: "linear-gradient(135deg, #212121 0%, #616161 100%)",
};

const dark: SemanticTokens = {
  textPrimary:   "#f0f2f8",
  textSecondary: "rgba(240,242,248,0.55)",
  textDisabled:  "rgba(240,242,248,0.30)",
  textSuccess:   "#66bb6a",
  textDanger:    "#f87171",
  textWarning:   "#ffa726",

  pageBg:        "#0f1117",
  cardBg:        "#1a1d27",
  surfaceEl:     "#1a2235",
  cardShadow:    "0 2px 16px rgba(0,0,0,0.45)",
  cardBorder:    "rgba(255,255,255,0.07)",

  borderDefault: "rgba(255,255,255,0.08)",
  borderSubtle:  "rgba(255,255,255,0.05)",
  borderStrong:  "rgba(255,255,255,0.14)",

  rowHover:      "rgba(255,255,255,0.04)",
  progressTrack: "rgba(255,255,255,0.10)",

  stateSuccess:  "#22c55e",
  stateError:    "#ef4444",
  stateWarning:  "#f59e0b",
  stateInfo:     "#3b82f6",

  chartHeaderBar:  "linear-gradient(135deg, #0d47a1 0%, #1565c0 100%)",
  chartHeaderLine: "linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%)",
  chartHeaderArea: "linear-gradient(135deg, #111111 0%, #2c2c2c 100%)",
};

const tokens: Record<ThemeMode, SemanticTokens> = { light, dark };

/** Returns the full semantic token set for the given mode */
export const getTokens = (mode: ThemeMode = "dark"): SemanticTokens => tokens[mode];

export default tokens;
