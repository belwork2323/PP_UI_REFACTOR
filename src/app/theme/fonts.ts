/**
 * fonts.ts
 * ─────────────────────────────────────────────────────────────
 * Global typography scale — family, size, weight, line-height,
 * semantic presets, and responsive clamp helpers.
 * Theme files should use fonts.size.* and fonts.typography.*
 * instead of raw rem values.
 * ─────────────────────────────────────────────────────────────
 */

const size = {
  /** Micro badges, filter count pills */
  "3xs": "0.58rem",
  /** Tiny chips, event labels */
  "2xs": "0.62rem",
  /** Small chips, compact captions */
  micro: "0.65rem",
  /** Compact UI: filters, dense chips */
  compact: "0.72rem",
  /** Timestamps, avatar initials */
  tight: "0.7rem",
  /** Standard caption / label */
  xs: "0.75rem",
  /** Muted table text, secondary lines */
  dense: "0.78rem",
  /** Monospace ids, secondary emphasis */
  base: "0.8rem",
  /** Form inputs, table body (login clamp max) */
  input: "0.9rem",
  /** Default body */
  sm: "0.875rem",
  /** Table cells, dashboard body */
  table: "0.76rem",
  tableSm: "0.74rem",
  tableXs: "0.67rem",
  md: "1rem",
  lg: "1.25rem",
  xl: "1.5rem",
  "2xl": "1.8rem",
  "3xl": "2.2rem",
  "4xl": "2.8rem",
  "5xl": "3.2rem",
} as const;

const weight = {
  light: 300,
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,
} as const;

const lineHeight = {
  tight: 1.2,
  normal: 1.5,
  loose: 1.8,
} as const;

/** Semantic typography presets — compose size + weight + spacing */
const typography = {
  display: {
    fontSize: size["2xl"],
    fontWeight: weight.extrabold,
    lineHeight: lineHeight.tight,
    letterSpacing: "-0.02em",
  },
  title: {
    fontSize: size.xl,
    fontWeight: weight.bold,
    lineHeight: lineHeight.tight,
  },
  subtitle: {
    fontSize: size.sm,
    fontWeight: weight.regular,
    lineHeight: lineHeight.normal,
  },
  body: {
    fontSize: size.sm,
    fontWeight: weight.regular,
    lineHeight: lineHeight.normal,
  },
  bodyStrong: {
    fontSize: size.sm,
    fontWeight: weight.semibold,
    lineHeight: lineHeight.normal,
  },
  bodyMuted: {
    fontSize: size.dense,
    fontWeight: weight.regular,
    lineHeight: lineHeight.normal,
  },
  bodyCompact: {
    fontSize: size.base,
    fontWeight: weight.semibold,
    lineHeight: lineHeight.normal,
  },
  /** Uppercase section / table headers */
  overline: {
    fontSize: size.xs,
    fontWeight: weight.bold,
    letterSpacing: "0.07em",
    textTransform: "uppercase" as const,
  },
  overlineSm: {
    fontSize: size.xs,
    fontWeight: weight.bold,
    letterSpacing: "0.06em",
    textTransform: "uppercase" as const,
  },
  /** Filter panel labels, toggle text */
  label: {
    fontSize: size.compact,
    fontWeight: weight.bold,
    lineHeight: 1,
  },
  caption: {
    fontSize: size.xs,
    fontWeight: weight.medium,
    lineHeight: lineHeight.normal,
  },
  captionMuted: {
    fontSize: size.xs,
    fontWeight: weight.regular,
    lineHeight: lineHeight.normal,
  },
  captionSm: {
    fontSize: size["2xs"],
    fontWeight: weight.bold,
    lineHeight: lineHeight.normal,
  },
  chip: {
    fontSize: size.compact,
    fontWeight: weight.semibold,
  },
  chipSm: {
    fontSize: size.micro,
    fontWeight: weight.semibold,
  },
  input: {
    fontSize: size.sm,
    fontWeight: weight.regular,
  },
  stat: {
    fontSize: size.xl,
    fontWeight: weight.extrabold,
    lineHeight: lineHeight.tight,
  },
  meta: {
    fontSize: size.xs,
    fontWeight: weight.semibold,
    lineHeight: lineHeight.normal,
  },
  badge: {
    fontSize: size["3xs"],
    fontWeight: weight.bold,
    lineHeight: 1,
  },
  table: {
    fontSize: size.table,
    fontWeight: weight.regular,
    lineHeight: lineHeight.normal,
  },
  tableMuted: {
    fontSize: size.tableSm,
    fontWeight: weight.regular,
    lineHeight: lineHeight.normal,
  },
  tableHeader: {
    fontSize: size.tableXs,
    fontWeight: weight.extrabold,
    letterSpacing: "0.07em",
    textTransform: "uppercase" as const,
  },
} as const;

/** Responsive clamp strings for login / fluid layouts */
const responsive = {
  input: `clamp(${size.base}, 1.6vh, ${size.input})`,
  inputLabel: `clamp(${size.base}, 1.6vh, ${size.input})`,
  button: `clamp(0.85rem, 1.6vh, 0.95rem)`,
  link: `clamp(${size.dense}, 1.5vh, ${size.sm})`,
  caption: `clamp(0.65rem, 1.2vh, ${size.xs})`,
  reload: `clamp(${size["2xs"]}, 1.2vh, ${size.xs})`,
  captchaError: `clamp(0.55rem, 1vh, 0.65rem)`,
  cardTitle: `clamp(${size.md}, 2vh, ${size.md})`,
  cardSubtitle: `clamp(${size.md}, 1.5vh, ${size.sm})`,
} as const;

const fonts = {
  family: {
    primary: "Roboto, Arial, sans-serif",
    monospace: "monospace",
  },

  size,
  weight,
  lineHeight,
  typography,
  responsive,

  /**
   * @deprecated Use fonts.typography.* — kept for gradual migration
   */
  admin: {
    pageTitle: typography.display,
    pageSubtitle: typography.subtitle,
    sectionLabel: typography.overline,
    tableHeader: typography.overlineSm,
    tableCell: typography.body,
    tableCellMuted: typography.bodyMuted,
    tableCellBold: typography.bodyStrong,
    chip: typography.chip,
    chipSmall: typography.chipSm,
    filterLabel: typography.label,
    filterInput: typography.input,
    statValue: typography.stat,
    statLabel: typography.caption,
    statSubLabel: typography.captionMuted,
    resultsText: typography.meta,
  },
};

export default fonts;
