import { alpha } from "@mui/material";
import colors from "@app/theme/colors";
import fonts from "@app/theme/fonts";
import general from "@app/theme/custom_themes/common/common_css_theme";
import { getSharedTheme } from "@app/theme/custom_themes/shared/shared_theme";
import {
  getAdminCommonTheme,
  getAdminManagementTableCellActions,
  getAdminManagementTableTheme,
} from "@app/theme/custom_themes/admin/admin_common_theme";
import { createDataTableTheme } from "@app/theme/custom_themes/shared/data_table_theme";

const getMotorManagementTheme = (mode: "light" | "dark" = "light") => {
  const shared = getSharedTheme(mode);
  const adminTheme = getAdminCommonTheme(mode);
  const d = colors.dashboard[mode as "light" | "dark"];
  const isDark = mode === "dark";

  const skeletonBase = shared.skeletonBase;
  const accentBlue = adminTheme.accentBlue;
  const accentBlueDark = adminTheme.accentBlueDark;
  const accentBlueMuted = adminTheme.accentBlueMuted;

  const table = getAdminManagementTableTheme({
    mode,
    accentBlue,
    accentBlueDark,
    cardBg: d.cardBg,
    textPrimary: d.textPrimary,
    textSecondary: d.textSecondary,
    textDisabled: d.textDisabled,
    skeletonBase,
  });

  const detailsDataTable = createDataTableTheme({
    primary: accentBlue,
    border: isDark ? "rgba(255,255,255,0.10)" : "#E5E7EB",
    text: d.textPrimary,
    textSub: d.textSecondary,
    surface: isDark ? "rgba(255,255,255,0.04)" : "#F4F6F8",
    pageBg: d.cardBg,
  });

  return {
    general,

    page: shared.page,

    pageHeader: {
      ...adminTheme.pageHeader,
      title: { ...adminTheme.pageHeader.title, ...fonts.typography.display },
      subtitle: { ...adminTheme.pageHeader.subtitle, ...fonts.typography.subtitle },
    },

    batchListShell: adminTheme.batchListShell,
    filterToggle: adminTheme.filterToggle,
    filterPanel: adminTheme.filterPanel,

    statsGrid: {
      ...adminTheme.statsGrid,
      colors: colors.admin.motorStats[mode as "light" | "dark"],
      innerGrid: {
        ...adminTheme.statsGrid.innerGrid,
        display: "grid",
        gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
        width: "100%",
        gap: 2,
      },
    },

    toolbar: adminTheme.toolbar,
    input: adminTheme.input,
    menuPaper: adminTheme.menuPaper,
    table,

    tableCell: {
      ...getAdminManagementTableCellActions(mode, accentBlue, accentBlueMuted),
      motorIdBox: { display: "flex", alignItems: "center", gap: 0.6 },
      motorIdIcon: { fontSize: 14, color: accentBlue, opacity: 0.7 },
      motorIdText: {
        fontSize: "0.85rem",
        fontWeight: 600,
        color: d.textPrimary,
        fontFamily: "monospace",
      },
      linkedBatchesBtn: {
        textTransform: "none",
        fontWeight: 600,
        fontSize: "0.78rem",
        color: accentBlue,
        px: 0.5,
        minWidth: 0,
        "&:hover": { bgcolor: accentBlueMuted },
      },
      projectBox: { display: "flex", flexDirection: "column" },
      projectId: {
        fontSize: "0.8rem",
        fontWeight: 500,
        color: d.textPrimary,
      },
    },

    details: {
      document: {
        borderRadius: 3,
        border: `1px solid ${d.cardBorder}`,
        boxShadow: `0 4px 24px ${alpha(accentBlue, 0.08)}`,
        overflow: "hidden",
        background: d.cardBg,
      },
      banner: {
        p: "18px 24px",
        background: `linear-gradient(135deg, ${accentBlueDark}, ${accentBlue})`,
        color: "#fff",
      },
      bannerIcon: { fontSize: 28, color: "#fff", opacity: 0.95 },
      bannerTitle: { fontWeight: 800, fontSize: "1.05rem", color: "#fff" },
      bannerSubtitle: { fontSize: "0.78rem", color: alpha("#fff", 0.78), mt: 0.35, fontFamily: "monospace" },
      body: {
        p: { xs: 2, sm: 3 },
        background: isDark ? d.pageBg : alpha(accentBlue, 0.03),
        overflowY: "auto",
        maxHeight: "calc(90vh - 100px)",
      },
      section: {
        mb: 3,
        p: 2,
        borderRadius: 2,
        border: `1px solid ${isDark ? "rgba(255,255,255,0.10)" : "#E5E7EB"}`,
        background: d.cardBg,
      },
      sectionTitle: {
        fontSize: "0.72rem",
        fontWeight: 800,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: accentBlue,
        mb: 1.5,
        display: "flex",
        alignItems: "center",
        gap: 0.75,
      },
      metaGrid: {
        display: "grid",
        gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(3, 1fr)" },
        gap: 1.5,
      },
      metaItem: {
        p: 1.25,
        borderRadius: 1.5,
        background: alpha(accentBlue, isDark ? 0.08 : 0.04),
        border: `1px solid ${alpha(accentBlue, isDark ? 0.2 : 0.12)}`,
        display: "flex",
        flexDirection: "column",
        gap: 0.35,
      },
      metaLabel: {
        fontSize: "0.62rem",
        fontWeight: 700,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        color: d.textSecondary,
      },
      metaValue: {
        fontSize: "0.88rem",
        fontWeight: 700,
        color: d.textPrimary,
        wordBreak: "break-word",
      },
      ...detailsDataTable,
      tableContainer: {
        ...detailsDataTable.tableContainer,
        overflow: "auto",
      },
      tableCell: {
        ...detailsDataTable.tableCell,
        whiteSpace: "nowrap",
      },
      emptyText: {
        fontSize: "0.85rem",
        color: d.textSecondary,
        textAlign: "center",
        py: 3,
      },
      loadingBox: {
        minHeight: 280,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 1.5,
      },
      statusChip: {
        fontWeight: 700,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        bgcolor: alpha("#fff", 0.18),
        color: "#fff",
        border: `1px solid ${alpha("#fff", 0.35)}`,
      },
      actions: {
        px: 3,
        py: 2,
        borderTop: `1px solid ${d.dividerColor}`,
        background: d.cardBg,
      },
    },
  };
};

export default getMotorManagementTheme;
