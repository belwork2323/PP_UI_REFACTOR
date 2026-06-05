// src/app/theme/custom_themes/admin/dashboard_theme.ts
//
// Admin Dashboard theme — consumes getSharedTheme() for all common tokens.
// Only defines tokens that are dashboard-specific: KPI cards, charts,
// timeline, layout grids, and the dashboard-unique active-batch table styles.

import colors  from "../../colors";
import fonts   from "../../fonts";
import general from "../common/common_css_theme";
import { getSharedTheme } from "../shared/shared_theme";

// ─── Static maps (mode-independent) ──────────────────────────────────────────
const KPI_AVATAR_COLORS = {
  users:     "#212121",
  batches:   "#1565c0",
  dispatch:  "#2e7d32",
  approvals: "#c62828",
};

const CHART_TOOLTIPS = {
  bar:  { background: "#1565c0", border: "none", color: "#fff", borderRadius: 8 },
  line: { background: "#2e7d32", border: "none", color: "#fff", borderRadius: 8 },
  area: { background: "#212121", border: "none", color: "#fff", borderRadius: 8 },
};

const STAGE_CHIP = {
  light: {
    Manufacturing:     { bg: "#e3f2fd", color: "#1565c0" },
    "Quality Control": { bg: "#f3e5f5", color: "#6a1b9a" },
    Sourcing:          { bg: "#e8f5e9", color: "#2e7d32" },
    Dispatch:          { bg: "#fff3e0", color: "#e65100" },
  },
  dark: {
    Manufacturing:     { bg: "rgba(21,101,192,0.22)",  color: "#90caf9" },
    "Quality Control": { bg: "rgba(106,27,154,0.22)", color: "#e1bee7" },
    Sourcing:          { bg: "rgba(46,125,50,0.22)",   color: "#a5d6a7" },
    Dispatch:          { bg: "rgba(230,81,0,0.22)",    color: "#ffcc80" },
  },
};

const TYPE_CHIP = {
  light: {
    MainScale: { bg: "#e3f2fd", color: "#1565c0" },
    SubScale:  { bg: "#f3e5f5", color: "#6a1b9a" },
  },
  dark: {
    MainScale: { bg: "rgba(21,101,192,0.22)", color: "#90caf9" },
    SubScale:  { bg: "rgba(106,27,154,0.22)", color: "#e1bee7" },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
const getDashboardTheme = (mode = "light") => {
  const shared  = getSharedTheme(mode);
  const s       = shared.tokens;
  const d       = colors.dashboard?.[mode] ?? colors.dashboard.light;
  const isDark  = mode === "dark";

  // ── Dashboard-local raw tokens — only values that have no equivalent in shared
  const raw = {
    // Aliases forwarded from semantic tokens (keep for backward compat with DashboardPage)
    cardBg:        s.cardBg,
    pageBg:        s.pageBg,
    border:        s.borderDefault,
    rowAlt:        isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.012)",
    rowHover:      s.rowHover,
    textPrimary:   s.textPrimary,
    textSecondary: s.textSecondary,
    textMuted:     s.textDisabled,
    textSuccess:   s.textSuccess,
    progressTrack: s.progressTrack,

    // Dashboard-only: table gradient header bg + text
    headerBg:        isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.025)",
    tableHeaderBg:   isDark
      ? "linear-gradient(90deg, rgba(25,118,210,0.34) 0%, rgba(46,125,50,0.28) 100%)"
      : "linear-gradient(90deg, rgba(25,118,210,0.14) 0%, rgba(46,125,50,0.12) 100%)",
    tableHeaderText: isDark ? "#e3f2fd" : "#0d47a1",

    // Dashboard-only: filter widget colours
    inputFocus:           isDark ? "#90caf9"                 : "#1976d2",
    filterActiveBg:       isDark ? "rgba(33,150,243,0.15)"  : "#e3f2fd",
    chipDefaultBg:        isDark ? "rgba(255,255,255,0.07)" : "#f0f0f0",
    chipDefaultColor:     isDark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.5)",
    filterBadgeBg:        "#1976d2",
    filterBadgeColor:     "#fff",
    datePicker:           isDark ? "invert(1) opacity(0.5)" : "none",

    // Dashboard-only: clear-filter chip
    clearBg:              isDark ? "rgba(244,67,54,0.12)"   : "#ffebee",
    clearColor:           isDark ? "#ef9a9a"                : "#c62828",
    clearBorder:          isDark ? "rgba(244,67,54,0.3)"    : "#ffcdd2",

    // Dashboard-only: "This Month" toggle chip
    thisMonthActiveBg:     isDark ? "rgba(33,150,243,0.25)" : "#bbdefb",
    thisMonthActiveColor:  isDark ? "#90caf9"               : "#1565c0",
    thisMonthActiveBorder: isDark ? "#90caf9"               : "#1976d2",

    // Dashboard-only: status chip (active/default) — different pattern to shared.statusChip
    statusActiveBg:     isDark ? "rgba(46,125,50,0.22)"    : "#e8f5e9",
    statusActiveColor:  isDark ? "#a5d6a7"                 : "#2e7d32",
    statusDefaultBg:    isDark ? "rgba(255,255,255,0.08)"  : "#eceff1",
    statusDefaultColor: isDark ? "rgba(255,255,255,0.78)"  : "#455a64",
  };

  const filterInputSx    = shared.filterInputSx;
  const filterMenuProps  = shared.filterMenuProps;
  const filterMenuItemSx = shared.filterMenuItemSx;
  const cardBase         = shared.card;

  return {
    // ── Expose raw + entire shared namespace for backward compat ──────────────
    raw,
    ...shared,
    sharedCharts: shared.dashboardCharts,
    stageChip:       STAGE_CHIP[isDark ? "dark" : "light"],
    typeChip:        TYPE_CHIP[isDark ? "dark" : "light"],
    filterInputSx,
    filterMenuProps,
    filterMenuItemSx,

    // ── Page wrapper ──────────────────────────────────────────────────────────
    page: {
      ...general.fullWidth,
      maxWidth:  "100%",
      p:         { xs: 2, md: 3 },
      bgcolor:   s.pageBg,
      minHeight: "100vh",
      overflowX: "hidden",
      ...general.boxSizingBorder,
    },

    // ── Loading states ────────────────────────────────────────────────────────
    loadingWrapper: {
      ...general.flexCenter,
      minHeight: 400,
    },
    loadingPage: {
      ...general.fullWidth,
      maxWidth:  "100%",
      p:         { xs: 2, md: 3 },
      bgcolor:   s.pageBg,
      minHeight: "100vh",
      overflowX: "hidden",
      ...general.boxSizingBorder,
      ...general.flexCenter,
    },

    card: cardBase,

    // ── KPI card ─────────────────────────────────────────────────────────────
    kpi: {
      card: cardBase,
      label: {
        variant: "body2" as const,
        sx: { mb: 0.5, color: s.textSecondary, fontSize: fonts.size?.sm ?? "0.875rem" },
      },
      value: {
        variant: "h4" as const,
        sx: { fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.1, color: s.textPrimary },
      },
      subRow:   (isPositive) => ({ color: isPositive ? s.textSuccess : s.textDisabled, fontSize: "0.75rem" }),
      avatarSx: (bg) => ({ bgcolor: bg, width: 52, height: 52, borderRadius: "12px" }),
      iconSx:       { fontSize: 26, color: "#fff" },
      trendIcon:    { fontSize: 12 },
      avatarColors: KPI_AVATAR_COLORS,
      skeleton: {
        label:    { backgroundColor: "#e0e0e0", width: "60%", mb: 1, borderRadius: "4px" },
        value:    { backgroundColor: "#e0e0e0", width: "80%", mb: 1, borderRadius: "4px" },
        sub:      { backgroundColor: "#e0e0e0", width: "50%", height: "16px", borderRadius: "4px" },
        avatarBg: "#e0e0e0",
        avatar:   { backgroundColor: "#f0f0f0" },
      },
    },

    // ── Charts ───────────────────────────────────────────────────────────────
    chart: {
      headers: {
        bar:  d.chartHeaderBar,
        line: d.chartHeaderLine,
        area: d.chartHeaderArea,
      },
      headerBox: (header) => ({
        background:   header,
        p:            2,
        borderRadius: "12px 12px 0 0",
      }),
      tooltip:   CHART_TOOLTIPS,
      title:     shared.sectionTitle,
      subtitle:  shared.sectionMeta,
      highlight: shared.sectionMetaBold,
      timestamp: { variant: "caption" as const, sx: { color: s.textDisabled } },
      divider:   shared.divider,
      iconColor: s.textDisabled,
      clockIcon: { fontSize: 13, color: s.textDisabled },
    },

    chartConfig: {
      dimensions: { width: "100%" as const, height: 140 },
      margins: {
        bar:  { top: 0, right: 0, left: -30, bottom: 0 },
        line: { top: 5, right: 5, left: -30, bottom: 0 },
        area: { top: 5, right: 5, left: -30, bottom: 0 },
      },
      bar:  { fill: "rgba(255,255,255,0.8)", radius: [3, 3, 0, 0] as [number, number, number, number] },
      line: { stroke: "rgba(255,255,255,0.9)", strokeWidth: 2.5, dot: { fill: "#fff", r: 3 } },
      area: { stroke: "rgba(255,255,255,0.8)", strokeWidth: 2.5, dot: { fill: "#fff", r: 3 } },
      axisTick: {
        bar:  { fill: "rgba(255,255,255,0.8)", fontSize: 11 },
        line: { fill: "rgba(255,255,255,0.8)", fontSize: 10 },
        area: { fill: "rgba(255,255,255,0.8)", fontSize: 10 },
      },
      gradient: {
        id:         "areaGrad",
        startColor: "rgba(255,255,255,0.4)",
        endColor:   "rgba(255,255,255,0.02)",
      },
    },

    // ── Active-batch table ────────────────────────────────────────────────────
    // Uses dashboard-specific gradient header + extended cell/chip variants.
    // Base row/header/empty reuse shared primitives directly.
    table: {
      // ── Filter bar widgets ──
      filterBtn: (active) => ({
        ...general.flexRow,
        alignItems:   "center",
        gap:          0.6,
        cursor:       "pointer",
        px:           1.2,
        py:           0.45,
        borderRadius: "8px",
        border:       `1px solid ${active ? raw.inputFocus : raw.border}`,
        bgcolor:      active ? raw.filterActiveBg : "transparent",
        color:        active ? raw.inputFocus : s.textSecondary,
        transition:   "all 0.15s",
        userSelect:   "none",
        "&:hover": {
          bgcolor:     raw.filterActiveBg,
          borderColor: raw.inputFocus,
          color:       raw.inputFocus,
        },
      }),
      filterBtnText:    { fontSize: "0.72rem", fontWeight: 700, lineHeight: 1 },
      filterBtnIcon:    { fontSize: 14 },
      filterBtnChevron: { fontSize: 14, ml: 0.2 },

      // ── Filter count badges ──
      filterBadgePill: {
        ...general.flexCenter,
        bgcolor:      raw.filterBadgeBg,
        color:        raw.filterBadgeColor,
        borderRadius: "50%",
        width:        16,
        height:       16,
        fontSize:     "0.58rem",
        fontWeight:   700,
      },
      filterBadge: {
        ...general.flexCenter,
        bgcolor:      raw.filterBadgeBg,
        color:        raw.filterBadgeColor,
        borderRadius: "50%",
        width:        18,
        height:       18,
        fontSize:     "0.6rem",
        fontWeight:   700,
      },
      filterBadgeSmall: { width: 16, height: 16, fontSize: "0.58rem" },

      // ── Filter panel (dashboard has a gradient header bg, not the shared surfaceEl) ──
      filterPanel: {
        borderTop:    `1px solid ${raw.border}`,
        borderBottom: `1px solid ${raw.border}`,
        bgcolor:      raw.headerBg,
        px: 2.5, pt: 2, pb: 2.5,
      },
      filterPanelHeader: { mb: 1.8 },

      // ── Reuse from shared ──
      filterLabel:   shared.filterLabel,
      filterMetaText: { fontSize: "0.72rem", color: s.textDisabled, ml: 0.5 },
      filterRow:      { direction: "row", gap: 1.5, flexWrap: "wrap", mb: 2 },
      filterDateRow:  { direction: "row", gap: 1.5, alignItems: "center", flexWrap: "wrap" },
      filterDateSeparator: { fontSize: "0.75rem", color: s.textDisabled },
      calendarIcon:   { fontSize: 15, color: s.textDisabled },
      searchIcon:     { fontSize: 15, color: s.textDisabled },
      clearIconBtn:   { p: 0.2,       color: s.textDisabled },
      clearIcon:      { fontSize: 13 },

      // ── Filter inputs ──
      searchInput:  { flex: "1 1 200px",  ...filterInputSx },
      stageSelect:  { flex: "1 1 130px",  ...filterInputSx },
      typeSelect:   { flex: "1 1 120px",  ...filterInputSx },
      statusSelect: { flex: "1 1 140px",  ...filterInputSx },
      datePicker: (disabled) => ({
        width:   148,
        opacity: disabled ? 0.5 : 1,
        ...filterInputSx,
        "& .MuiInputBase-input::-webkit-calendar-picker-indicator": {
          filter: raw.datePicker,
        },
      }),
      dateInputProps: { style: { fontSize: "0.78rem", color: s.textPrimary } },

      // ── Action chips ──
      clearChip: {
        fontSize: "0.72rem", fontWeight: 600, height: 26, borderRadius: "8px",
        bgcolor:  raw.clearBg,
        color:    raw.clearColor,
        border:   `1px solid ${raw.clearBorder}`,
      },
      thisMonthChip: (active) => ({
        fontSize: "0.72rem", fontWeight: 700, height: 28, borderRadius: "8px",
        bgcolor:  active ? raw.thisMonthActiveBg    : raw.chipDefaultBg,
        color:    active ? raw.thisMonthActiveColor : raw.chipDefaultColor,
        border:   `1px solid ${active ? raw.thisMonthActiveBorder : raw.border}`,
      }),

      // ── Table header (gradient row — dashboard-specific) ──
      headerRow: {
        background: raw.tableHeaderBg,
        "& th":     { py: 1.4 },
      },
      header: {
        fontSize:      "0.67rem",
        fontWeight:    800,
        letterSpacing: "0.07em",
        textTransform: "uppercase",
        color:         raw.tableHeaderText,
        borderBottom:  `2px solid ${raw.border}`,
        whiteSpace:    "nowrap",
        bgcolor:       "transparent",
        cursor:        "pointer",
        userSelect:    "none",
        "&:hover":     { opacity: 0.85 },
      },
      headerSortIcon: (active: boolean) => ({
        fontSize:  13,
        ml:        0.5,
        flexShrink: 0,
        color:     active ? raw.tableHeaderText : `${raw.tableHeaderText}55`,
        transition: "color 0.15s",
      }),

      // ── Row styles — delegate to shared ──
      rowHover:  shared.tableRow(false),
      rowAlt:    raw.rowAlt,
      tableRow:  shared.tableRow,
      emptyCell: shared.tableEmptyCell,

      // ── Cells ──
      cell:          { py: 1.2 },
      cellTruncated: { py: 1.2, maxWidth: 200 },
      cellDate:      { py: 1.2, whiteSpace: "nowrap" },
      cellNarrow:    { py: 1.2, whiteSpace: "nowrap" },
      cellProgress:  { py: 1.2, minWidth: 130 },

      // ── Cell text variants ──
      textBatchId: (color) => ({ fontWeight: 700, fontSize: "0.78rem", letterSpacing: "0.01em", color }),
      textBase:          { fontSize: "0.76rem", color: s.textSecondary },
      textTruncated:     { fontSize: "0.76rem", color: s.textSecondary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
      textSmall:         { fontSize: "0.74rem", color: s.textSecondary },
      textMuted:         { fontSize: "0.72rem", color: s.textDisabled },
      textPrimaryStrong: { fontSize: "0.76rem", color: s.textPrimary, fontWeight: 700 },
      subTextMuted:      { fontSize: "0.68rem", color: s.textDisabled, mt: 0.35 },

      // ── Chip factories — delegate to shared where possible ──
      chipSx:       shared.chip,
      statusChipSx: (status) => {
        const isActive = String(status).toLowerCase() === "active";
        return {
          fontSize: "0.62rem", height: 22, borderRadius: "999px", fontWeight: 800,
          bgcolor:  isActive ? raw.statusActiveBg    : raw.statusDefaultBg,
          color:    isActive ? raw.statusActiveColor : raw.statusDefaultColor,
          border:   `1px solid ${isActive ? raw.statusActiveColor : raw.border}`,
        };
      },

      // ── Progress ──
      progressTrack:      shared.progressTrack,
      progressValueColor: shared.progressValueColor,

      // ── Section header — delegate to shared ──
      sectionTitle:     shared.sectionTitle,
      sectionMetaRow:   { spacing: 0.5 },
      sectionMetaIcon:  { fontSize: 14, color: s.textSuccess },
      sectionMetaBold:  shared.sectionMetaBold,
      sectionMetaMuted: shared.sectionMeta,
    },

    // ── Blockchain events timeline ────────────────────────────────────────────
    timeline: {
      container: { px: 2, pb: 2, flexWrap: "wrap", gap: 2 },
      item: (isNotLast) => ({
        flex: "1 1 220px", minWidth: 200, ...general.positionRelative,
        pr: isNotLast ? 2 : 0,
        "&:not(:last-child)::after": {
          content: '""', ...general.positionAbsolute,
          right: 0, top: 0, width: 1, height: "100%", bgcolor: s.borderDefault,
        },
      }),
      batchId:   { variant: "body2" as const,   sx: { fontWeight: 600, color: s.textPrimary } },
      label:     { variant: "caption" as const, sx: { color: s.textSecondary } },
      timestamp: { variant: "caption" as const, sx: { color: s.textDisabled } },
      iconColor: s.textDisabled,
      clockIcon: { fontSize: 11, color: s.textDisabled },
      sectionTitle:     shared.sectionTitle,
      sectionMetaRow:   { spacing: 0.5 },
      sectionMetaIcon:  { fontSize: 14, color: s.textSuccess },
      sectionMetaBold:  shared.sectionMetaBold,
      sectionMetaMuted: shared.sectionMeta,
      avatarSx: (color) => ({
        width: 32, height: 32, fontSize: "0.75rem", fontWeight: 700,
        flexShrink: 0, zIndex: 1, bgcolor: color,
      }),
      loadingOverlay: {
        ...general.positionAbsolute,
        top: 0, left: 0, right: 0, bottom: 0,
        ...general.flexCenter,
        bgcolor: "rgba(255,255,255,0.7)",
        zIndex:  1,
      },
      eventChip: { ml: 1, fontSize: "0.65rem", height: 20 },
      deptLabel: { fontSize: "0.7rem", color: s.textSecondary },
    },

    // ── Dashboard layout grids ────────────────────────────────────────────────
    dashboard: {
      adminWrapper: {
        ...general.fullWidth,
        minHeight: "100vh",
        overflowX: "hidden",
        bgcolor:   isDark ? "#0f1117" : colors.grey[100],
      },
      pageHeader: {
        wrapper: {
          ...general.flexRow,
          alignItems: "center",
          justifyContent: "space-between",
          mb: 2.5,
        },
        eyebrow: {
          fontFamily: fonts.family.monospace,
          fontSize: "0.7rem",
          letterSpacing: "0.15em",
          color: s.textSecondary,
          textTransform: "uppercase",
          mb: 0.5,
        },
        title: {
          fontSize: "1.45rem",
          fontWeight: 800,
          letterSpacing: "-0.02em",
          color: s.textPrimary,
          lineHeight: 1.15,
        },
        notifBox: {
          bgcolor: s.surfaceEl,
          border: `1px solid ${s.cardBorder}`,
          borderRadius: "10px",
          p: 0.85,
          display: "flex",
          cursor: "pointer",
          transition: "all 0.15s",
          "&:hover": {
            borderColor: raw.inputFocus,
          },
        },
        notifIcon: {
          fontSize: 18,
          color: s.textSecondary,
        },
      },
      headerBox: {},
      dateRangeBar: {
        display: "flex",
        gap: 1.5,
        alignItems: "center",
        mb: 3,
        p: 1.5,
        bgcolor: s.cardBg,
        border: `1px solid ${s.cardBorder}`,
        borderRadius: "10px",
        boxShadow: s.cardShadow,
        flexWrap: "wrap",
      },
      kpiGrid: {
        display:             "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: 2.5, mb: 3,
      },
      chartsGrid: {
        display:             "grid",
        gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr" },
        gap: 2.5, mb: 3,
      },
      tableSection:  { mb: 3 },
      chartContent:  { p: "16px !important" },
      // Blockchain events card is a standard card + top margin
      blockchainCard: { ...cardBase, mt: 3 },
    },
  };
};

export default getDashboardTheme;