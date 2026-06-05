import type { SchemaThemeTokens } from "../models/schema.types";
import { DEFAULT_SCHEMA_THEME } from "../models/schema.types";

export const buildInputSx = (brand: SchemaThemeTokens, width: number | string = 140) => ({
  width,
  "& .MuiOutlinedInput-root": {
    borderRadius: 7,
    background: brand.surface,
    fontSize: "0.8rem",
    transition: "all 0.18s",
    "& fieldset": { borderColor: brand.border },
    "&:hover fieldset": { borderColor: brand.primaryLight ?? brand.primary },
    "&.Mui-focused fieldset": { borderColor: brand.primary, borderWidth: 2 },
  },
  "& .MuiInputBase-input": {
    fontWeight: 500,
    color: brand.text,
    padding: "6px 10px",
    fontSize: "0.8rem",
  },
});

export const resolveTheme = (tokens?: Partial<SchemaThemeTokens>): SchemaThemeTokens => ({
  ...DEFAULT_SCHEMA_THEME,
  ...tokens,
});
