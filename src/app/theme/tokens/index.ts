// src/app/theme/tokens/index.ts
// Barrel — single import point for all design tokens.
//
// Usage:
//   import { getTokens, getAccents } from '../theme/tokens';

export { getTokens }    from "./semantics";
export { getAccents }   from "./accents";
export type { ThemeMode, SemanticTokens } from "./semantics";
export type { AccentTokens }             from "./accents";
