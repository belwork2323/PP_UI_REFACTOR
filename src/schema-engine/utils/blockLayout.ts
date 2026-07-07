import type { SxProps, Theme } from "@mui/material";
import type { SchemaColSpan, SchemaUiConfig } from "../types";

const colSpanPercent = (span: number) => `${(span / 12) * 100}%`;

const colSpanSx = (colSpan?: SchemaColSpan): SxProps<Theme> => {
  if (!colSpan) return {};

  const breakpoints: Array<keyof SchemaColSpan> = ["xs", "sm", "md", "lg"];
  const flexBasis: Record<string, string> = {};
  const maxWidth: Record<string, string> = {};

  breakpoints.forEach((bp) => {
    const span = colSpan[bp];
    if (span !== undefined) {
      flexBasis[bp] = colSpanPercent(span);
      maxWidth[bp] = colSpanPercent(span);
    }
  });

  const sx: Record<string, unknown> = {};
  if (Object.keys(flexBasis).length > 0) {
    sx.flexBasis = flexBasis;
    sx.maxWidth = maxWidth;
    sx.flexGrow = 0;
    sx.flexShrink = 0;
  }
  return sx as SxProps<Theme>;
};

export const resolveBlockLayoutSx = (ui?: SchemaUiConfig): SxProps<Theme> => {
  const sx: Record<string, unknown> = { mb: ui?.density === "compact" ? 0.75 : 1, minWidth: 0 };

  if (!ui) return sx as SxProps<Theme>;

  Object.assign(sx, colSpanSx(ui.colSpan));

  if (ui.width) sx.width = ui.width;
  if (ui.minWidth) sx.minWidth = ui.minWidth;
  if (ui.maxWidth) sx.maxWidth = ui.maxWidth;
  if (ui.flex) sx.flex = ui.flex;
  if (ui.sx) Object.assign(sx, ui.sx);

  return sx as SxProps<Theme>;
};

/** Tables/matrices default to a full row inside horizontal flex groups. */
export const resolveFullWidthBlockLayoutSx = (ui?: SchemaUiConfig): SxProps<Theme> => ({
  flex: "1 1 100%",
  width: "100%",
  maxWidth: "100%",
  alignSelf: "stretch",
  ...resolveBlockLayoutSx(ui),
});

export const resolveGridGap = (gap?: string): number => {
  const map: Record<string, number> = { xs: 0.5, sm: 1, md: 1.5, lg: 2, xl: 3 };
  return map[gap ?? ""] ?? 1.5;
};

export const resolveSpacingToken = (token?: string, fallback = 1.5): number => {
  const map: Record<string, number> = { xs: 0.5, sm: 1, md: 1.5, lg: 2, xl: 3 };
  return map[token ?? ""] ?? fallback;
};

export const resolveSectionDetailsPadding = (ui?: SchemaUiConfig) => {
  const compact = String(ui?.density ?? "").toLowerCase() === "compact";
  const padding = resolveSpacingToken(ui?.padding, compact ? 1 : 1.5);

  return {
    pt: compact ? 0.25 : 0.5,
    px: padding,
    pb: compact ? 0 : padding,
  };
};
