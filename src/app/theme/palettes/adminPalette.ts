/**
 * Admin-specific colour palettes — imported into colors.ts as colors.admin.
 * Custom theme files must reference colors.admin.*, never define literals here.
 */

const adminPalette = {
  kpiAvatar: {
    users: "#212121",
    batches: "#1565c0",
    dispatch: "#2e7d32",
    approvals: "#c62828",
  },

  chartTooltip: {
    bar: { background: "#1565c0", border: "none", color: "#ffffff", borderRadius: 8 },
    line: { background: "#2e7d32", border: "none", color: "#ffffff", borderRadius: 8 },
    area: { background: "#212121", border: "none", color: "#ffffff", borderRadius: 8 },
  },

  stageChip: {
    light: {
      Manufacturing: { bg: "#e3f2fd", color: "#1565c0" },
      "Quality Control": { bg: "#f3e5f5", color: "#6a1b9a" },
      Sourcing: { bg: "#e8f5e9", color: "#2e7d32" },
      Dispatch: { bg: "#fff3e0", color: "#e65100" },
    },
    dark: {
      Manufacturing: { bg: "rgba(21,101,192,0.22)", color: "#90caf9" },
      "Quality Control": { bg: "rgba(106,27,154,0.22)", color: "#e1bee7" },
      Sourcing: { bg: "rgba(46,125,50,0.22)", color: "#a5d6a7" },
      Dispatch: { bg: "rgba(230,81,0,0.22)", color: "#ffcc80" },
    },
  },

  batchTypeChip: {
    light: {
      MainScale: { bg: "#e3f2fd", color: "#1565c0" },
      SubScale: { bg: "#f3e5f5", color: "#6a1b9a" },
    },
    dark: {
      MainScale: { bg: "rgba(21,101,192,0.22)", color: "#90caf9" },
      SubScale: { bg: "rgba(106,27,154,0.22)", color: "#e1bee7" },
    },
  },

  filters: {
    light: {
      rowAlt: "rgba(0,0,0,0.012)",
      headerBg: "rgba(0,0,0,0.025)",
      tableHeaderBg: "linear-gradient(90deg, rgba(25,118,210,0.14) 0%, rgba(46,125,50,0.12) 100%)",
      tableHeaderText: "#0d47a1",
      inputFocus: "#1976d2",
      filterActiveBg: "#e3f2fd",
      chipDefaultBg: "#f0f0f0",
      chipDefaultColor: "rgba(0,0,0,0.5)",
      filterBadgeBg: "#1976d2",
      filterBadgeColor: "#ffffff",
      clearBg: "#ffebee",
      clearColor: "#c62828",
      clearBorder: "#ffcdd2",
      thisMonthActiveBg: "#bbdefb",
      thisMonthActiveColor: "#1565c0",
      thisMonthActiveBorder: "#1976d2",
      statusActiveBg: "#e8f5e9",
      statusActiveColor: "#2e7d32",
      statusDefaultBg: "#eceff1",
      statusDefaultColor: "#455a64",
      skeleton: "#e0e0e0",
      skeletonAvatar: "#f0f0f0",
      loadingOverlay: "rgba(255,255,255,0.7)",
      adminWrapperBg: "#f5f5f5",
    },
    dark: {
      rowAlt: "rgba(255,255,255,0.02)",
      headerBg: "rgba(255,255,255,0.04)",
      tableHeaderBg: "linear-gradient(90deg, rgba(25,118,210,0.34) 0%, rgba(46,125,50,0.28) 100%)",
      tableHeaderText: "#e3f2fd",
      inputFocus: "#90caf9",
      filterActiveBg: "rgba(33,150,243,0.15)",
      chipDefaultBg: "rgba(255,255,255,0.07)",
      chipDefaultColor: "rgba(255,255,255,0.55)",
      filterBadgeBg: "#1976d2",
      filterBadgeColor: "#ffffff",
      clearBg: "rgba(244,67,54,0.12)",
      clearColor: "#ef9a9a",
      clearBorder: "rgba(244,67,54,0.3)",
      thisMonthActiveBg: "rgba(33,150,243,0.25)",
      thisMonthActiveColor: "#90caf9",
      thisMonthActiveBorder: "#90caf9",
      statusActiveBg: "rgba(46,125,50,0.22)",
      statusActiveColor: "#a5d6a7",
      statusDefaultBg: "rgba(255,255,255,0.08)",
      statusDefaultColor: "rgba(255,255,255,0.78)",
      skeleton: "rgba(255,255,255,0.06)",
      skeletonAvatar: "rgba(255,255,255,0.04)",
      loadingOverlay: "rgba(0,0,0,0.45)",
      adminWrapperBg: "#0f1117",
    },
  },

  batchStats: {
    light: {
      total: { accent: "#1d4ed8", iconBg: "rgba(29,78,216,0.08)", iconBorder: "rgba(29,78,216,0.18)", iconColor: "#1d4ed8", value: "#1d4ed8" },
      inProgress: { accent: "#0369a1", iconBg: "rgba(3,105,161,0.08)", iconBorder: "rgba(3,105,161,0.18)", iconColor: "#0369a1", value: "#0369a1" },
      completed: { accent: "#15803d", iconBg: "rgba(21,128,61,0.08)", iconBorder: "rgba(21,128,61,0.18)", iconColor: "#15803d", value: "#15803d" },
      pending: { accent: "#4b5563", iconBg: "rgba(75,85,99,0.08)", iconBorder: "rgba(75,85,99,0.18)", iconColor: "#4b5563", value: "#4b5563" },
      rejected: { accent: "#dc2626", iconBg: "rgba(220,38,38,0.08)", iconBorder: "rgba(220,38,38,0.18)", iconColor: "#dc2626", value: "#dc2626" },
    },
      dark: {
      total: { accent: "#3b82f6", iconBg: "rgba(59,130,246,0.15)", iconBorder: "rgba(59,130,246,0.30)", iconColor: "#93c5fd", value: "#93c5fd" },
      inProgress: { accent: "#38bdf8", iconBg: "rgba(56,189,248,0.15)", iconBorder: "rgba(56,189,248,0.30)", iconColor: "#7dd3fc", value: "#7dd3fc" },
      completed: { accent: "#22c55e", iconBg: "rgba(34,197,94,0.15)", iconBorder: "rgba(34,197,94,0.30)", iconColor: "#86efac", value: "#86efac" },
      pending: { accent: "#a3a3a3", iconBg: "rgba(163,163,163,0.15)", iconBorder: "rgba(163,163,163,0.30)", iconColor: "#d4d4d4", value: "#d4d4d4" },
      rejected: { accent: "#f87171", iconBg: "rgba(248,113,113,0.15)", iconBorder: "rgba(248,113,113,0.30)", iconColor: "#fca5a5", value: "#fca5a5" },
    },
  },

  userStats: {
    light: {
      total: { accent: "#1d4ed8", iconBg: "rgba(29,78,216,0.08)", iconBorder: "rgba(29,78,216,0.18)", iconColor: "#1d4ed8", value: "#1d4ed8" },
      active: { accent: "#15803d", iconBg: "rgba(21,128,61,0.08)", iconBorder: "rgba(21,128,61,0.18)", iconColor: "#15803d", value: "#15803d" },
      inactive: { accent: "#dc2626", iconBg: "rgba(220,38,38,0.08)", iconBorder: "rgba(220,38,38,0.18)", iconColor: "#dc2626", value: "#dc2626" },
      reset: { accent: "#c2410c", iconBg: "rgba(194,65,12,0.08)", iconBorder: "rgba(194,65,12,0.18)", iconColor: "#c2410c", value: "#c2410c" },
    },
    dark: {
      total: { accent: "#3b82f6", iconBg: "rgba(59,130,246,0.15)", iconBorder: "rgba(59,130,246,0.30)", iconColor: "#93c5fd", value: "#93c5fd" },
      active: { accent: "#22c55e", iconBg: "rgba(34,197,94,0.15)", iconBorder: "rgba(34,197,94,0.30)", iconColor: "#86efac", value: "#86efac" },
      inactive: { accent: "#f87171", iconBg: "rgba(248,113,113,0.15)", iconBorder: "rgba(248,113,113,0.30)", iconColor: "#fca5a5", value: "#fca5a5" },
      reset: { accent: "#fb923c", iconBg: "rgba(251,146,60,0.15)", iconBorder: "rgba(251,146,60,0.30)", iconColor: "#fdba74", value: "#fdba74" },
    },
  },

  projectStats: {
    light: {
      total: { accent: "#1d4ed8", iconBg: "rgba(29,78,216,0.08)", iconBorder: "rgba(29,78,216,0.18)", iconColor: "#1d4ed8", value: "#1d4ed8" },
      today: { accent: "#15803d", iconBg: "rgba(21,128,61,0.08)", iconBorder: "rgba(21,128,61,0.18)", iconColor: "#15803d", value: "#15803d" },
      month: { accent: "#0369a1", iconBg: "rgba(3,105,161,0.08)", iconBorder: "rgba(3,105,161,0.18)", iconColor: "#0369a1", value: "#0369a1" },
      active: { accent: "#15803d", iconBg: "rgba(21,128,61,0.08)", iconBorder: "rgba(21,128,61,0.18)", iconColor: "#15803d", value: "#15803d" },
      idle: { accent: "#dc2626", iconBg: "rgba(220,38,38,0.08)", iconBorder: "rgba(220,38,38,0.18)", iconColor: "#dc2626", value: "#dc2626" },
    },
    dark: {
      total: { accent: "#3b82f6", iconBg: "rgba(59,130,246,0.15)", iconBorder: "rgba(59,130,246,0.30)", iconColor: "#93c5fd", value: "#93c5fd" },
      today: { accent: "#22c55e", iconBg: "rgba(34,197,94,0.15)", iconBorder: "rgba(34,197,94,0.30)", iconColor: "#86efac", value: "#86efac" },
      month: { accent: "#38bdf8", iconBg: "rgba(56,189,248,0.15)", iconBorder: "rgba(56,189,248,0.30)", iconColor: "#7dd3fc", value: "#7dd3fc" },
      active: { accent: "#22c55e", iconBg: "rgba(34,197,94,0.15)", iconBorder: "rgba(34,197,94,0.30)", iconColor: "#86efac", value: "#86efac" },
      idle: { accent: "#f87171", iconBg: "rgba(248,113,113,0.15)", iconBorder: "rgba(248,113,113,0.30)", iconColor: "#fca5a5", value: "#fca5a5" },
    },
  },

  chartSeries: {
    barFill: "rgba(255,255,255,0.8)",
    lineStroke: "rgba(255,255,255,0.9)",
    areaStroke: "rgba(255,255,255,0.8)",
    dotFill: "#ffffff",
    axisTick: "rgba(255,255,255,0.8)",
    gradientStart: "rgba(255,255,255,0.4)",
    gradientEnd: "rgba(255,255,255,0.02)",
  },
};

export default adminPalette;
