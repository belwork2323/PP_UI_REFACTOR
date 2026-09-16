import { alpha } from "@mui/material";
import colors from "@app/theme/colors";
import fonts from "@app/theme/fonts";
import general from "@app/theme/custom_themes/common/common_css_theme";
import layout from "@app/theme/layout";
import { getSharedTheme } from "@app/theme/custom_themes/shared/shared_theme";
import { getAdminCommonTheme } from "@app/theme/custom_themes/admin/admin_common_theme";

const getExploreBlockchainTheme = (mode: "light" | "dark" = "light") => {
  const shared = getSharedTheme(mode);
  const adminTheme = getAdminCommonTheme(mode);
  const d = colors.dashboard[mode as "light" | "dark"];

  const isDark = mode === "dark";
  const skeletonBase = shared.skeletonBase;

  return {
    general,

    page: shared.page,

    pageHeader: {
      ...adminTheme.pageHeader,
      title: { ...adminTheme.pageHeader.title, ...fonts.typography.display },
      subtitle: { ...adminTheme.pageHeader.subtitle, ...fonts.typography.subtitle },
    },

      statsGrid: {
      ...adminTheme.statsGrid,
      colors: {
        // reuse the same structure that AdminManagementStatsGrid expects
        blocks: {
          accent: "#2563eb",
          iconBg: "rgba(37, 99, 235, 0.12)",
          iconBorder: "rgba(37, 99, 235, 0.25)",
          iconColor: "#2563eb",
          value: "#2563eb",
        },
        transactions: {
          accent: "#8b5cf6",
          iconBg: "rgba(139, 92, 246, 0.12)",
          iconBorder: "rgba(139, 92, 246, 0.25)",
          iconColor: "#8b5cf6",
          value: "#8b5cf6",
        },
        nodes: {
          accent: "#22c55e",
          iconBg: "rgba(34, 197, 94, 0.12)",
          iconBorder: "rgba(34, 197, 94, 0.25)",
          iconColor: "#22c55e",
          value: "#22c55e",
        },
        chaincodes: {
          accent: "#f59e0b",
          iconBg: "rgba(245, 158, 11, 0.12)",
          iconBorder: "rgba(245, 158, 11, 0.25)",
          iconColor: "#f59e0b",
          value: "#f59e0b",
        },
      },
      innerGrid: {
        ...adminTheme.statsGrid.innerGrid,
        display: "grid",
        gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
        width: "100%",
      },
    },

    toolbar: adminTheme.toolbar,
    input: adminTheme.input,
    menuPaper: adminTheme.menuPaper,

    channelSelect: {
      minWidth: 260,
      ...adminTheme.input,
    },

    sectionCard: {
      height: "100%",
      bgcolor: d.cardBg,
      borderRadius: layout.cardBorderRadius,
      border: `1px solid ${d.cardBorder}`,
      boxShadow: isDark ? "0 8px 24px rgba(0,0,0,0.35)" : colors.shadow?.card,
    },

    sectionTitle: {
      ...fonts.typography.subtitle,
      fontWeight: 700,
      mb: 2,
      color: d.textPrimary,
    },

    table: {
      ...adminTheme.table,
      skeletonRow: skeletonBase,
    },

    chartTabs: {
      container: {
        display: "flex",
        gap: 3,
        mb: 2,
        borderBottom: `1px solid ${d.cardBorder}`,
      },
      tab: (active: boolean) => ({
        cursor: "pointer",
        pb: 1,
        fontWeight: active ? 700 : 500,
        color: active ? "#3b82f6" : d.textSecondary ?? "text.secondary",
        borderBottom: active ? "2px solid #3b82f6" : "none",
      }),
    },

    chartContainer: {
      height: 300,
    },

    pieContainer: {
      height: 260,
    },

    statusDot: (up: boolean) => ({
      width: 10,
      height: 10,
      borderRadius: "50%",
      bgcolor: up ? "success.main" : "error.main",
      display: "inline-block",
    }),
  };
};

export default getExploreBlockchainTheme;
