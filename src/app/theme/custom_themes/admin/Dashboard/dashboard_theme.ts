// src/app/theme/custom_themes/admin/Dashboard/dashboard_theme.ts
//
// Admin Dashboard theme — consumes getSharedTheme() for all common tokens.
// Only defines tokens that are dashboard-specific: KPI cards, charts,
// timeline, layout grids, and the dashboard-unique active-batch table styles.

import colors  from "@app/theme/colors";
import fonts   from "@app/theme/fonts";
import general from "@app/theme/custom_themes/common/common_css_theme";
import { getSharedTheme } from "@app/theme/custom_themes/shared/shared_theme";
import getDashboardWidgetsTheme from "@app/theme/custom_themes/shared/dashboard_widgets_theme";
import { getAdminCommonTheme } from "@app/theme/custom_themes/admin/admin_common_theme";

const getDashboardTheme = (mode: "light" | "dark" = "light") => {
  const shared  = getSharedTheme(mode);
  const widgets = getDashboardWidgetsTheme(mode);
  const adminCommon = getAdminCommonTheme(mode);
  const s       = shared.tokens;
  const d       = colors.dashboard[mode];
  const f       = colors.admin.filters[mode];

  const raw = {
    cardBg:        s.cardBg,
    pageBg:        s.pageBg,
    border:        s.borderDefault,
    rowAlt:        f.rowAlt,
    rowHover:      s.rowHover,
    textPrimary:   s.textPrimary,
    textSecondary: s.textSecondary,
    textMuted:     s.textDisabled,
    textSuccess:   s.textSuccess,
    progressTrack: s.progressTrack,
    headerBg:        f.headerBg,
    tableHeaderBg:   f.tableHeaderBg,
    tableHeaderText: f.tableHeaderText,
    inputFocus:           f.inputFocus,
    filterActiveBg:       f.filterActiveBg,
    chipDefaultBg:        f.chipDefaultBg,
    chipDefaultColor:     f.chipDefaultColor,
    filterBadgeBg:        f.filterBadgeBg,
    filterBadgeColor:     f.filterBadgeColor,
    datePicker:           mode === "dark" ? "invert(1) opacity(0.5)" : "none",
    clearBg:              f.clearBg,
    clearColor:           f.clearColor,
    clearBorder:          f.clearBorder,
    thisMonthActiveBg:     f.thisMonthActiveBg,
    thisMonthActiveColor:  f.thisMonthActiveColor,
    thisMonthActiveBorder: f.thisMonthActiveBorder,
    statusActiveBg:     f.statusActiveBg,
    statusActiveColor:  f.statusActiveColor,
    statusDefaultBg:    f.statusDefaultBg,
    statusDefaultColor: f.statusDefaultColor,
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
    stageChip:       widgets.stageChip,
    typeChip:        widgets.typeChip,
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

    batchListShell: adminCommon.batchListShell,
    filterToggle: adminCommon.filterToggle,
    filterPanel: adminCommon.filterPanel,

    // ── KPI card ─────────────────────────────────────────────────────────────
    kpi: widgets.kpi,

    // ── Charts ───────────────────────────────────────────────────────────────
    chart: {
      ...widgets.chart,
      title:     shared.sectionTitle,
      subtitle:  shared.sectionMeta,
      highlight: shared.sectionMetaBold,
      divider:   shared.divider,
    },

    chartConfig: widgets.chartConfig,

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
      filterBtnText:    { ...fonts.typography.label },
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
        ...fonts.typography.badge,
      },
      filterBadge: {
        ...general.flexCenter,
        bgcolor:      raw.filterBadgeBg,
        color:        raw.filterBadgeColor,
        borderRadius: "50%",
        width:        18,
        height:       18,
        fontSize:     fonts.size["2xs"],
        fontWeight:   fonts.weight.bold,
      },
      filterBadgeSmall: { width: 16, height: 16, fontSize: fonts.size["3xs"] },

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
      filterMetaText: { ...fonts.typography.label, color: s.textDisabled, ml: 0.5 },
      filterRow:      { direction: "row", gap: 1.5, flexWrap: "wrap", mb: 2 },
      filterDateRow:  { direction: "row", gap: 1.5, alignItems: "center", flexWrap: "wrap" },
      filterDateSeparator: { fontSize: fonts.size.xs, color: s.textDisabled },
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
      dateInputProps: { style: { fontSize: fonts.size.dense, color: s.textPrimary } },

      // ── Action chips ──
      clearChip: {
        ...fonts.typography.label,
        fontWeight: fonts.weight.semibold,
        height: 26,
        borderRadius: "8px",
        bgcolor:  raw.clearBg,
        color:    raw.clearColor,
        border:   `1px solid ${raw.clearBorder}`,
      },
      thisMonthChip: (active) => ({
        ...fonts.typography.label,
        height: 28,
        borderRadius: "8px",
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
        ...fonts.typography.tableHeader,
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
      textBatchId: (color) => ({ fontWeight: fonts.weight.bold, fontSize: fonts.size.dense, letterSpacing: "0.01em", color }),
      textBase:          { ...fonts.typography.table, color: s.textSecondary },
      textTruncated:     { ...fonts.typography.table, color: s.textSecondary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
      textSmall:         { ...fonts.typography.tableMuted, color: s.textSecondary },
      textMuted:         { fontSize: fonts.size.compact, color: s.textDisabled },
      textPrimaryStrong: { ...fonts.typography.table, color: s.textPrimary, fontWeight: fonts.weight.bold },
      subTextMuted:      { fontSize: fonts.size.micro, color: s.textDisabled, mt: 0.35 },

      // ── Chip factories — delegate to shared where possible ──
      chipSx:       shared.chip,
      statusChipSx: (status) => {
        const isActive = String(status).toLowerCase() === "active";
        return {
          fontSize: fonts.size["2xs"], height: 22, borderRadius: "999px", fontWeight: fonts.weight.extrabold,
          bgcolor:  isActive ? raw.statusActiveBg    : raw.statusDefaultBg,
          color:    isActive ? raw.statusActiveColor : raw.statusDefaultColor,
          border:   `1px solid ${isActive ? raw.statusActiveColor : raw.border}`,
        };
      },

      // ── Progress ──
      progressTrack:      shared.progressTrack,
      progressValueColor: shared.progressValueColor,

      pagination: shared.adminManagement.table.pagination,
      divider:    shared.adminManagement.table.divider,

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
        width: 32, height: 32, fontSize: fonts.size.xs, fontWeight: fonts.weight.bold,
        flexShrink: 0, zIndex: 1, bgcolor: color,
      }),
      loadingOverlay: widgets.loadingOverlay,
      eventChip: { ml: 1, fontSize: fonts.size.micro, height: 20 },
      deptLabel: { fontSize: fonts.size.tight, color: s.textSecondary },
    },

    // ── Dashboard layout grids ────────────────────────────────────────────────
    dashboard: {
      adminWrapper: widgets.adminWrapper,
      pageHeader: {
        wrapper: {
          ...general.flexRow,
          alignItems: "center",
          justifyContent: "space-between",
          mb: 2.5,
        },
        eyebrow: {
          fontFamily: fonts.family.monospace,
          fontSize: fonts.size.tight,
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
      dateRangeBar: widgets.dateFilter.containerSx,
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