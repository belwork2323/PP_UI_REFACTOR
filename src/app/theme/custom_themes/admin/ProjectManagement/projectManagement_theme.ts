import { alpha } from "@mui/material";
import colors from "@app/theme/colors";
import fonts from "@app/theme/fonts";
import general from "@app/theme/custom_themes/common/common_css_theme";
import layout from "@app/theme/layout";
import { getSharedTheme } from "@app/theme/custom_themes/shared/shared_theme";
import { getAdminCommonTheme } from "@app/theme/custom_themes/admin/admin_common_theme";

const getProjectManagementTheme = (mode: "light" | "dark" = "light") => {
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
      newProjectButton: adminTheme.primaryButton,
    },

    batchListShell: adminTheme.batchListShell,
    filterToggle: adminTheme.filterToggle,
    filterPanel: adminTheme.filterPanel,

    statsGrid: {
      ...adminTheme.statsGrid,
      colors: colors.admin.projectStats[mode as "light" | "dark"],

      innerGrid: {
        ...adminTheme.statsGrid.innerGrid,
        display: "grid",
        gridTemplateColumns: "repeat(5, minmax(0, 1fr))", // one row
        // gap: 2,
        width: "100%",
      },
    },

    toolbar: adminTheme.toolbar,

    input: adminTheme.input,

    menuPaper: adminTheme.menuPaper,

    table: {
      ...adminTheme.table,
      skeletonRow: skeletonBase,
      skeletonRowDefault: { ...skeletonBase, width: "80%" },
      skeletonRowAction: { ...skeletonBase, width: 60 },
    },

    modal: {
      ...adminTheme.modal,
      paper: {
        bgcolor: d.cardBg,
        borderRadius: layout.cardBorderRadius,
        border: `1px solid ${d.cardBorder}`,
        boxShadow: isDark ? "0 24px 80px rgba(0,0,0,0.70)" : colors.shadow.card,
      },
      content: { px: 3, pt: 3, pb: 2, flex: 1, overflowY: "auto" },
      actions: { px: 3, py: 2.5, gap: 2 },
      stackSpacing: 2.5,
      fieldRowSpacing: 2.5,
      headerGap: { mt: 3, mb: 2 },
    },

    modalTitle: {
      ...fonts.typography.display,
      fontSize: fonts.size.lg,
      color: d.textPrimary,
    },

    deleteDialog: adminTheme.deleteDialog,
  };
};

export default getProjectManagementTheme;
