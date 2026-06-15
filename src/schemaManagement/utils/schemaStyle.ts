import type { SxProps, Theme } from "@mui/material";
import type { SchemaDesignSystem, SchemaNodeLayout, SchemaNodeStyle } from "../models/schema.v1.types";
import type { SchemaSection, SchemaNodeStyleRef, SchemaThemeTokens } from "../models/schema.types";
import { DEFAULT_SCHEMA_THEME } from "../models/schema.types";

const SPACING_FALLBACK: Record<string, number> = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
};

const RADIUS_FALLBACK: Record<string, number> = {
  sm: 7,
  md: 11,
  lg: 16,
};

const resolveToken = (
  token: string | undefined,
  map: Record<string, number | string> | undefined,
  fallbackMap: Record<string, number | string>,
): number | string | undefined => {
  if (!token) return undefined;
  const fromMap = map?.[token] ?? fallbackMap[token];
  return fromMap ?? token;
};

export const designSystemToThemeTokens = (
  designSystem?: SchemaDesignSystem,
): Partial<SchemaThemeTokens> => {
  if (!designSystem?.colors) return {};
  const colors = designSystem.colors;
  return {
    primary: colors.primary,
    primaryLight: colors.primaryLight,
    surface: colors.surface,
    border: colors.border,
    text: colors.text,
    textSub: colors.textSub,
    accent: colors.accent,
    warn: colors.warn,
  };
};

export const mergeSchemaTheme = (
  base: SchemaThemeTokens,
  designSystem?: SchemaDesignSystem,
  overrides?: Partial<SchemaThemeTokens>,
): SchemaThemeTokens => ({
  ...DEFAULT_SCHEMA_THEME,
  ...base,
  ...designSystemToThemeTokens(designSystem),
  ...overrides,
});

export const resolveSpacingPx = (
  token: string | undefined,
  designSystem?: SchemaDesignSystem,
): number | undefined => {
  const resolved = resolveToken(token, designSystem?.spacing, SPACING_FALLBACK);
  return typeof resolved === "number" ? resolved : undefined;
};

export const resolveRadiusPx = (
  token: string | undefined,
  designSystem?: SchemaDesignSystem,
): number | undefined => {
  const resolved = resolveToken(token, designSystem?.radius, RADIUS_FALLBACK);
  return typeof resolved === "number" ? resolved : undefined;
};

type SchemaSectionCardLayout = Pick<
  SchemaNodeLayout,
  "gap" | "sectionVariant" | "sectionBorderRadius"
> & {
  gap?: string;
  sectionVariant?: string;
  sectionBorderRadius?: string;
};

export const resolveSectionBorderRadiusToken = (
  style?: Pick<SchemaNodeStyle, "borderRadius"> | { borderRadius?: string },
  layout?: SchemaSectionCardLayout,
): string => style?.borderRadius ?? layout?.sectionBorderRadius ?? "md";

export const resolveColorToken = (
  token: string | undefined,
  theme: SchemaThemeTokens,
  designSystem?: SchemaDesignSystem,
): string | undefined => {
  if (!token) return undefined;
  const colors = designSystem?.colors ?? {};
  const colorMap: Record<string, string | undefined> = {
    primary: colors.primary ?? theme.primary,
    primaryLight: colors.primaryLight ?? theme.primaryLight,
    surface: colors.surface ?? theme.surface,
    border: colors.border ?? theme.border,
    text: colors.text ?? theme.text,
    textSub: colors.textSub ?? theme.textSub,
    danger: colors.danger,
    success: colors.success,
    warn: colors.warn ?? theme.warn,
    accent: colors.accent ?? theme.accent,
  };
  return colorMap[token] ?? (token.startsWith("#") ? token : undefined);
};

export const resolveSectionCardSx = (
  style: SchemaNodeStyle | SchemaNodeStyleRef | undefined,
  layout: SchemaSectionCardLayout | undefined,
  theme: SchemaThemeTokens,
  designSystem?: SchemaDesignSystem,
): SxProps<Theme> => {
  const padding = resolveSpacingPx(style?.padding ?? "md", designSystem) ?? 12;
  const gap = resolveSpacingPx(style?.gap ?? layout?.gap, designSystem);
  const radius =
    resolveRadiusPx(resolveSectionBorderRadiusToken(style, layout), designSystem) ?? 8;
  const borderColor = resolveColorToken(style?.borderColor ?? "border", theme, designSystem) ?? theme.border;
  const background =
    resolveColorToken(style?.background ?? "surface", theme, designSystem) ?? theme.surface;
  const variant = style?.variant ?? layout?.sectionVariant ?? "card";

  const base: Record<string, unknown> = {
    borderRadius: radius,
    p: padding / 8,
    ...(gap != null ? { mb: gap / 8 } : {}),
    ...(style?.sx ?? {}),
  };

  if (variant === "plain") {
    return { ...base, background: "transparent", border: "none" };
  }

  if (variant === "outlined" || style?.border !== false) {
    return {
      ...base,
      border: `1px solid ${borderColor}`,
      background,
    };
  }

  return {
    ...base,
    border: `1px solid ${borderColor}`,
    background,
  };
};

export const resolvePageStackSpacing = (
  layout?: SchemaSectionCardLayout,
  designSystem?: SchemaDesignSystem,
): number => resolveSpacingPx(layout?.gap ?? "md", designSystem) ?? 16;

export const resolveSectionStyle = (section: SchemaSection) => section.style;
