import { alpha } from "@mui/material";

export type DataTableThemePalette = {
  primary?: string;
  primaryLight?: string;
  surface?: string;
  pageBg?: string;
  border?: string;
  text?: string;
  textSub?: string;
};

export type DataTableThemeOptions = {
  headerFontSize?: string;
  headerLetterSpacing?: string;
  headerTextTransform?: "none" | "uppercase";
  containerBorderRadius?: number | string;
  headerPaddingY?: number | string;
  headerPaddingX?: number | string;
  bodyFontSize?: string;
  bodyPaddingY?: number | string;
  bodyPaddingX?: number | string;
};

const DEFAULTS = {
  primary: "#1B4F72",
  primaryLight: "#2E86C1",
  surface: "#F4F6F8",
  pageBg: "#fff",
  border: "#D5D8DC",
  text: "#1C2833",
  textSub: "#5D6D7E",
} as const;

/** Vertical gradient — identical on every header cell (no left→right shade shift). */
export const dataTableHeaderBackground = (primary: string, primaryLight: string) =>
  `linear-gradient(180deg, ${primaryLight} 0%, ${primary} 100%)`;

/** White column divider on blue gradient headers. */
export const dataTableHeaderDivider = `1px solid ${alpha("#fff", 0.32)}`;

/**
 * Body cell grid line — solid (no alpha fade) so lines stay visible on striped rows.
 * Pair with `borderCollapse: "separate"` + `borderSpacing: 0` on the Table.
 */
export const dataTableBodyDivider = (border: string = DEFAULTS.border) =>
  `1px solid ${border}`;

/**
 * Drop-in header cell sx for any table (user + approver).
 * Uniform vertical gradient + borders on every cell.
 */
export const uniformTableHeaderCellSx = (
  primary: string = DEFAULTS.primary,
  primaryLight: string = DEFAULTS.primaryLight,
  options: DataTableThemeOptions = {},
) => ({
  background: dataTableHeaderBackground(primary, primaryLight),
  color: "#fff",
  fontWeight: 800,
  fontSize: options.headerFontSize ?? "0.68rem",
  letterSpacing: options.headerLetterSpacing ?? "0.06em",
  textTransform: options.headerTextTransform ?? ("uppercase" as const),
  py: options.headerPaddingY ?? 1.15,
  px: options.headerPaddingX ?? 1.5,
  // Right + bottom only avoids double lines with border-collapse: separate.
  borderTop: "none",
  borderLeft: "none",
  borderRight: dataTableHeaderDivider,
  borderBottom: dataTableHeaderDivider,
  whiteSpace: "nowrap" as const,
  lineHeight: 1.35,
  verticalAlign: "middle" as const,
  "&:first-of-type": {
    borderLeft: dataTableHeaderDivider,
  },
});

/**
 * Drop-in body cell sx — full grid borders on every data cell (visible on zebra stripes).
 */
export const uniformTableBodyCellSx = (
  palette: Pick<DataTableThemePalette, "border" | "text"> = {},
  options: DataTableThemeOptions = {},
) => {
  const border = palette.border ?? DEFAULTS.border;
  const text = palette.text ?? DEFAULTS.text;
  const divider = dataTableBodyDivider(border);

  return {
    fontSize: options.bodyFontSize ?? "0.82rem",
    fontWeight: 500,
    py: options.bodyPaddingY ?? 1.15,
    px: options.bodyPaddingX ?? 1.5,
    color: text,
    // Paint borders on the cell (not the row) so stripe backgrounds cannot cover them.
    borderTop: "none",
    borderLeft: "none",
    borderRight: divider,
    borderBottom: divider,
    verticalAlign: "middle" as const,
    "&:first-of-type": {
      borderLeft: divider,
    },
  };
};

export type DataTableThemeModeOptions = DataTableThemeOptions & {
  /** When dark, use deep blues for header fills (palette.primary* are light accents). */
  mode?: string;
};

/**
 * Shared data-table styles for form / details tables across the app.
 * `tableHeaderCell` still accepts an optional flag for call-site compatibility; it is ignored.
 */
export const createDataTableTheme = (
  palette: DataTableThemePalette = {},
  options: DataTableThemeModeOptions = {},
) => {
  const isDark = options.mode === "dark";
  const primary = isDark ? "#0d47a1" : (palette.primary ?? DEFAULTS.primary);
  const primaryLight = isDark ? "#1565c0" : (palette.primaryLight ?? DEFAULTS.primaryLight);
  const border = palette.border ?? DEFAULTS.border;
  const text = palette.text ?? DEFAULTS.text;
  const pageBg = palette.pageBg ?? DEFAULTS.pageBg;

  return {
    tableContainer: {
      borderRadius: options.containerBorderRadius ?? 2,
      border: `1px solid ${alpha(primary, 0.18)}`,
      overflow: "hidden",
      background: pageBg,
      boxShadow: `0 2px 10px ${alpha(primary, 0.06)}`,
    },
    tableHeaderCell: (_isLead?: boolean) =>
      uniformTableHeaderCellSx(primary, primaryLight, options),
    tableRow: (idx: number) => ({
      background: idx % 2 === 0 ? pageBg : alpha(primary, 0.035),
      transition: "background 0.14s ease",
      "&:hover": {
        background: alpha(primaryLight, 0.08),
      },
    }),
    tableCell: uniformTableBodyCellSx({ border, text }, options),
  };
};

export default createDataTableTheme;
