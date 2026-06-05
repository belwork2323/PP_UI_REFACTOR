import { alpha }  from "@mui/material";
import { icons }  from "../../icons";
import colors      from "../../colors";
import fonts       from "../../fonts";
import spacing     from "../../spacing";
import layout      from "../../layout";
import general     from "../common/common_css_theme";
import { getSharedTheme } from "../shared/shared_theme";

const getUserManagementTheme = (mode = "light") => {
  const shared  = getSharedTheme(mode);
  const adminTheme = shared.adminManagement;
  const d = colors.dashboard[mode as "light" | "dark"];

  const isDark          = mode === "dark";
  const accentBlue      = adminTheme.accentBlue;
  const accentBlueDark  = adminTheme.accentBlueDark;
  const accentBlueMuted = adminTheme.accentBlueMuted;
  const inputBg         = adminTheme.inputBg;
  const inputBorder     = adminTheme.inputBorder;

  const skeletonBase = shared.skeletonBase;


  return {

    general,

    page: shared.page,

    pageHeader: {
      ...adminTheme.pageHeader,
      newUserButton: adminTheme.primaryButton,
    },

    statPills: {
      ...adminTheme.statPills,
      colors: {
        total: {
          color: accentBlue,
          bg:    accentBlueMuted,
        },
        active: {
          color: colors.success.main,
          bg:    alpha(colors.success.main, 0.10),
        },
        inactive: {
          color: colors.error.main,
          bg:    alpha(colors.error.main, 0.10),
        },
        showing: {
          color: d.textSecondary,
          bg:    isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
        },
      },
    },

    toolbar: adminTheme.toolbar,

    input: adminTheme.input,

    menuPaper: adminTheme.menuPaper,

    table: {
      ...adminTheme.table,
      cellSubDepts: {
        borderBottom: `1px solid ${d.dividerColor}`,
        py:           1.5,
        maxWidth:     240,
      },
      skeletonRow: skeletonBase,
      skeletonRowDefault: { ...skeletonBase, width: "80%" },
      skeletonRowAction:  { ...skeletonBase, width: 60 },
    },

    tableCell: {
      userBox:       { display: "flex", alignItems: "center", gap: 1.5 },
      usernameBox:   { display: "flex", alignItems: "center", gap: 0.6 },
      createdByBox:  { display: "flex", alignItems: "center", gap: 0.6, mb: 0.4 },
      actionsBox:    { display: "flex", gap: 0.5, justifyContent: "flex-end" },
      avatar: {
        width: 34, height: 34,
        fontSize: "0.78rem", fontWeight: fonts.weight.bold, flexShrink: 0,
      },
      userName: {
        fontSize: fonts.size.sm, fontWeight: fonts.weight.semibold,
        color: d.textPrimary, ...general.noWrap,
      },
      usernameIcon:  { fontSize: 13, color: d.textDisabled },
      usernameText: {
        fontSize: "0.8rem", fontWeight: fonts.weight.semibold,
        color: accentBlue, letterSpacing: "0.03em", fontFamily: fonts.family.monospace,
      },
      roleChip: (rc) => ({
        bgcolor: rc.bg, color: rc.color, fontWeight: fonts.weight.semibold,
        fontSize: "0.72rem", border: `1px solid ${alpha(rc.color, 0.25)}`,
        "& .MuiChip-icon": { color: rc.color }, height: 24,
      }),
      deptChip: (dc) => ({
        bgcolor: dc.bg, color: dc.color, fontWeight: fonts.weight.semibold,
        fontSize: "0.72rem", border: `1px solid ${alpha(dc.color, 0.25)}`, height: 24,
      }),
      subDeptChip: {
        height: 20, fontSize: "0.68rem", fontWeight: fonts.weight.semibold,
        color: isDark ? "rgba(240,242,248,0.75)" : "#475569",
        bgcolor: isDark ? "rgba(255,255,255,0.07)" : "rgba(71,85,105,0.08)",
        border: "1px solid rgba(71,85,105,0.25)",
        "& .MuiChip-label": { px: 1 },
      },
      statusChip: (sc) => ({
        bgcolor: sc.bg, color: sc.color, fontWeight: fonts.weight.semibold,
        fontSize: "0.72rem", border: `1px solid ${alpha(sc.color, 0.25)}`,
        "& .MuiChip-icon": { color: sc.color }, height: 24,
      }),
      createdOnDate:  { fontSize: "0.78rem", color: d.textSecondary, ...general.noWrap },
      createdOnTime:  { fontSize: "0.7rem",  color: d.textDisabled,  ...general.noWrap, mt: 0.2 },
      createdOnEmpty: { fontSize: "0.78rem", color: d.textDisabled },
      createdByIcon:     { fontSize: 12, color: d.textDisabled },
      createdByUsername: {
        fontSize: "0.75rem", fontWeight: fonts.weight.semibold,
        color: accentBlue, fontFamily: fonts.family.monospace, ...general.noWrap,
      },
      createdByChip: (rc) => ({
        height: 18, fontSize: "0.62rem", fontWeight: fonts.weight.bold,
        bgcolor: rc?.bg    ?? "rgba(71,85,105,0.10)",
        color:   rc?.color ?? "#475569",
        border:  `1px solid ${alpha(rc?.color ?? "#475569", 0.22)}`,
        "& .MuiChip-label": { px: 0.9 },
      }),
      createdByEmpty: { fontSize: "0.78rem", color: d.textDisabled },
      editButton: {
        color: accentBlue, bgcolor: accentBlueMuted,
        borderRadius: general.borderRadius.sm, width: 30, height: 30,
        "&:hover": { bgcolor: alpha(accentBlue, 0.2) },
      },
      editIcon:  { fontSize: 14 },
      deleteButton: {
        color: colors.error.main,
        bgcolor: alpha(colors.error.main, isDark ? 0.10 : 0.06),
        borderRadius: general.borderRadius.sm, width: 30, height: 30,
        "&:hover": { bgcolor: alpha(colors.error.main, 0.18) },
      },
      deleteIcon: { fontSize: 14 },
    },

    modal: {
      maxWidth: false,
      paper: {
        bgcolor: d.cardBg, borderRadius: layout.cardBorderRadius,
        border: `1px solid ${d.cardBorder}`,
        boxShadow: isDark ? "0 24px 80px rgba(0,0,0,0.70)" : colors.shadow.card,
        width: "75vw", maxWidth: "75vw",
        height: "75vh", maxHeight: "75vh",
        display: "flex", flexDirection: "column",
      },
      header: {
        wrapper: {
          ...general.flexRow, alignItems: "center",
          justifyContent: "space-between",
          px: spacing.lg, py: 2.5,
          background: `linear-gradient(135deg, ${accentBlueDark} 0%, ${accentBlue} 100%)`,
          borderRadius: `${layout.cardBorderRadius} ${layout.cardBorderRadius} 0 0`,
        },
        titleRow: { display: "flex", alignItems: "center", gap: 1.5 },
        iconBadge: {
          width: 36, height: 36, borderRadius: general.borderRadius.md,
          bgcolor: colors.overlay.light, ...general.flexCenter,
        },
        icon:      { color: colors.white.text, fontSize: 20 },
        title:     { color: colors.white.text, fontWeight: fonts.weight.bold, fontSize: fonts.size.md, lineHeight: fonts.lineHeight.tight },
        subtitle:  { color: colors.white.textMuted, fontSize: fonts.size.xs },
        closeButton: { color: colors.white.textMuted, "&:hover": { bgcolor: colors.overlay.lightHover } },
      },
      content:  { px: 6, pt: 5, pb: 3, flex: 1, overflowY: "auto" },
      actions:  { px: 6, py: 3.5, gap: spacing.sm },
      stackSpacing:    3,
      fieldRowSpacing: 3,
      headerGap: {
        mt: 1, mb: 3,
        borderBottom: `1px solid ${d.dividerColor}`, pb: 3,
      },
      fieldLabel: {
        fontSize: fonts.size.xs, fontWeight: fonts.weight.bold,
        color: d.textSecondary, letterSpacing: "0.07em",
        textTransform: "uppercase", mb: 1,
      },
      passwordToggle: { color: d.textSecondary, "&:hover": { color: d.textPrimary } },
      subDeptsGrid: { display: "flex", flexWrap: "wrap", gap: 1, mt: 0.5 },
      subDeptsListItem: {
        display: "flex", alignItems: "center", justifyContent: "space-between",
        px: 1.5, py: 0.75, borderRadius: general.borderRadius.md,
        bgcolor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.025)",
        border: `1px solid ${d.cardBorder}`,
        width: "calc(33.333% - 6px)", flexShrink: 0, minWidth: 0,
      },
      subDeptsListItemText: { fontSize: fonts.size.sm, fontWeight: fonts.weight.medium, color: d.textPrimary },
      subDeptsRemoveButton: { color: colors.error.main, p: 0.4, "&:hover": { bgcolor: "rgba(220,38,38,0.10)" } },
      subDeptsEmpty:   { fontSize: fonts.size.sm, color: d.textDisabled, textAlign: "center", py: 1.5 },
      subDeptsBlocked: { fontSize: fonts.size.sm, color: d.textDisabled, textAlign: "center", py: 1.5, fontStyle: "italic" },
      cancelButton: {
        textTransform: "none", color: d.textSecondary,
        borderRadius: general.borderRadius.md, px: 2.5,
      },
      saveButton: {
        textTransform: "none", fontWeight: fonts.weight.bold,
        borderRadius: general.borderRadius.md, px: spacing.lg,
        bgcolor: accentBlue, boxShadow: `0 4px 14px ${alpha(accentBlue, 0.35)}`,
        "&:hover": { bgcolor: accentBlueDark },
        "&.Mui-disabled": { bgcolor: alpha(accentBlue, 0.4), color: colors.white.text },
      },
      menuItemRow:      { display: "flex", alignItems: "center", gap: 1 },
      subDeptsChipsBox: { display: "flex", flexWrap: "wrap", gap: 0.5 },
      statusFormControl: {
        minWidth: 140,
        "& .MuiOutlinedInput-root": {
          bgcolor: inputBg, borderRadius: general.borderRadius.md,
          "& fieldset":             { borderColor: inputBorder },
          "&:hover fieldset":       { borderColor: accentBlue },
          "&.Mui-focused fieldset": { borderColor: accentBlue },
        },
        "& .MuiInputLabel-root":             { color: d.textSecondary },
        "& .MuiInputLabel-root.Mui-focused": { color: accentBlue },
        "& .MuiInputBase-input":             { color: d.textPrimary },
        "& .MuiSelect-icon":                 { color: d.textSecondary },
      },
      subDeptChip: {
        height: 20, fontSize: "0.7rem", fontWeight: fonts.weight.semibold,
        bgcolor: accentBlueMuted, color: accentBlue,
        "& .MuiChip-label": { px: spacing.sm },
      },
      savingSpinner: { color: "inherit", mr: 1 },

      // ── Sub-department selector (floating overlay) ──────────────────────
      selectionCountChip: {
        height: 22, fontSize: "0.72rem", fontWeight: 600, ml: 1,
      },
      selectorToggleBase: {
        fontSize: "0.75rem", fontWeight: 600, textTransform: "none",
        borderRadius: "6px", px: 1.5, py: 0.4,
      },
      selectorToggleOpen: {
        bgcolor: "primary.main", color: "#fff",
        "&:hover": { bgcolor: "primary.dark" },
      },
      selectorToggleClosed: (theme) => ({
        borderColor: theme.palette.primary.main, color: theme.palette.primary.main,
        "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.06) },
      }),
      selectorWrapper: { position: "relative", zIndex: 1200 },
      selectorCollapse: {
        position: "absolute", top: 4, left: 0, right: 0,
        boxShadow: 3, borderRadius: "10px",
      },
      selectorCard: {
        borderRadius: "10px", overflow: "hidden",
        borderColor: "primary.light", bgcolor: "background.paper",
        display: "flex", flexDirection: "column",
      },
      selectorHeader: (theme) => ({
        px: 1.5, pt: 1, pb: 1, flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        bgcolor: alpha(theme.palette.primary.main, 0.03),
      }),
      selectorHeaderCount: { fontSize: "0.75rem", color: "text.secondary", fontWeight: 600 },
      clearAllButton: {
        fontSize: "0.72rem", textTransform: "none", color: "error.main",
        p: 0, minWidth: 0,
        "&:hover": { bgcolor: "transparent", textDecoration: "underline" },
      },
      selectorCloseIcon: { p: 0.3, color: "text.disabled", "&:hover": { color: "error.main" } },
      selectorSearchBox: { px: 1.5, pb: 1.5, pt: 0.5, flexShrink: 0 },
      selectorSearchInput: { fontSize: "0.82rem", borderRadius: "6px" },
      selectorSearchIcon: { fontSize: 16, color: "text.disabled" },
      selectorListBox: {
        maxHeight: 220, overflowY: "auto",
        "&::-webkit-scrollbar": { width: 4 },
        "&::-webkit-scrollbar-thumb": { bgcolor: "divider", borderRadius: 4 },
      },
      selectorEmptyText: {
        fontSize: "0.8rem", color: "text.disabled",
        textAlign: "center", py: 3,
      },
      selectorListItem: (checked, theme) => ({
        display: "flex", alignItems: "center", gap: 1.5,
        px: 1.5, py: 0.85, cursor: "pointer",
        bgcolor: checked ? alpha(theme.palette.primary.main, 0.06) : "transparent",
        "&:hover": {
          bgcolor: checked
            ? alpha(theme.palette.primary.main, 0.1)
            : "action.hover",
        },
        borderBottom: "1px solid",
        borderColor: "divider",
        "&:last-child": { borderBottom: "none" },
      }),
      selectorCheckbox: { p: 0, "& .MuiSvgIcon-root": { fontSize: 17 } },
      selectorItemText: (checked) => ({
        fontSize: "0.85rem", lineHeight: 1.4, userSelect: "none",
        fontWeight: checked ? 600 : 400,
        color: checked ? "primary.main" : "text.primary",
        flex: 1,
      }),
      selectorItemDot: {
        width: 6, height: 6, borderRadius: "50%",
        bgcolor: "primary.main", flexShrink: 0,
      },

      // ── Selected sub-dept cards ─────────────────────────────────────────
      restrictedBox: (theme) => ({
        display: "flex", alignItems: "center", gap: 1,
        px: 1.5, py: 1.2,
        bgcolor: alpha(theme.palette.warning.main, 0.06),
        border: "1px dashed", borderColor: "warning.light", borderRadius: "8px",
      }),
      restrictedIcon: { fontSize: 14, color: "warning.main", flexShrink: 0 },
      restrictedText: { fontSize: "0.8rem", color: "text.secondary" },
      emptySubDeptsBox: (borderError) => ({
        display: "flex", alignItems: "center", gap: 1,
        px: 1.5, py: 1.2, bgcolor: "action.hover",
        border: "1px dashed",
        borderColor: borderError ? "error.light" : "divider",
        borderRadius: "8px",
      }),
      emptySubDeptsText: (isError) => ({
        fontSize: "0.8rem",
        color: isError ? "error.main" : "text.disabled",
      }),
      selectedCard: (theme) => ({
        display: "flex", alignItems: "center", justifyContent: "space-between",
        px: 1.5, py: 0.9, boxShadow: "none", borderRadius: "8px",
        bgcolor: alpha(theme.palette.primary.main, 0.04),
        border: "1px solid",
        borderColor: alpha(theme.palette.primary.main, 0.18),
        transition: "border-color 0.15s",
        "&:hover": { borderColor: "primary.light" },
      }),
      selectedCardDot: {
        width: 7, height: 7, borderRadius: "50%", bgcolor: "primary.main", flexShrink: 0,
      },
      selectedCardText: { fontSize: "0.85rem", fontWeight: 500, color: "text.primary" },
      selectedCardRemove: (theme) => ({
        color: "text.disabled", p: 0.4,
        "&:hover": {
          color: "error.main",
          bgcolor: alpha(theme.palette.error.main, 0.08),
        },
      }),
      selectedCardRemoveIcon: { fontSize: 14 },
    },

    deleteDialog: {
      paper: {
        bgcolor: d.cardBg, 
        borderRadius: layout.cardBorderRadius,
        border: `1px solid ${d.cardBorder}`,
        boxShadow: isDark ? "0 24px 80px rgba(0,0,0,0.70)" : colors.shadow.card,
        
        // --- CHANGE THESE LINES ---
        width: "100%",          // Allow it to be responsive
        maxWidth: "400px",      // Set a hard limit for the width
        height: "auto",         // Let the content define the height
        maxHeight: "none",      // Remove the 75vh restriction
        display: "flex", 
        flexDirection: "column",
      },
      content: { 
        px: spacing.xl,         // More horizontal padding for breathing room
        pt: 5,                  // More top padding for the icon
        pb: spacing.md, 
        textAlign: "center" 
      },
      iconBadge: {
        width: 56, height: 56, ...general.borderCircle,
        bgcolor: alpha(colors.error.main, 0.12), ...general.flexCenter,
        mx: "auto", mb: spacing.md,
      },
      warnIcon:  { color: colors.error.main, fontSize: 28 },
      title:     { fontSize: "1.05rem", fontWeight: fonts.weight.bold, color: d.textPrimary, mb: spacing.sm },
      body:      { fontSize: fonts.size.sm, color: d.textSecondary, lineHeight: fonts.lineHeight.normal },
      boldName:  { fontWeight: fonts.weight.bold, color: d.textPrimary },
      actions:   { px: spacing.lg, py: 2.5, gap: spacing.sm, justifyContent: "center" },
      cancelButton: {
        textTransform: "none", borderRadius: general.borderRadius.md, px: spacing.lg,
        borderColor: inputBorder, color: d.textSecondary,
        "&:hover": { borderColor: d.textSecondary },
      },
      deleteButton: {
        textTransform: "none", fontWeight: fonts.weight.bold,
        borderRadius: general.borderRadius.md, px: spacing.lg,
        bgcolor: colors.error.main, boxShadow: `0 4px 14px ${alpha(colors.error.main, 0.30)}`,
        "&:hover": { bgcolor: "#b91c1c" },
        "&.Mui-disabled": { bgcolor: alpha(colors.error.main, 0.4), color: colors.white.text },
      },
      deletingSpinner: { color: "inherit", mr: 1 },
    },

    // ─── RICH STATS GRID ────────────────────────────────────────────────────────
    statsGrid: {
      ...adminTheme.statsGrid,

      colors: {
        total: {
          accent:      isDark ? "#3b82f6" : "#1d4ed8",
          iconBg:      isDark ? "rgba(59,130,246,0.15)" : "rgba(29,78,216,0.08)",
          iconBorder:  isDark ? "rgba(59,130,246,0.30)" : "rgba(29,78,216,0.18)",
          iconColor:   isDark ? "#93c5fd" : "#1d4ed8",
          value:       isDark ? "#93c5fd" : "#1d4ed8",
        },
        active: {
          accent:      isDark ? "#22c55e" : "#15803d",
          iconBg:      isDark ? "rgba(34,197,94,0.15)"  : "rgba(21,128,61,0.08)",
          iconBorder:  isDark ? "rgba(34,197,94,0.30)"  : "rgba(21,128,61,0.18)",
          iconColor:   isDark ? "#86efac" : "#15803d",
          value:       isDark ? "#86efac" : "#15803d",
        },
        inactive: {
          accent:      isDark ? "#f87171" : "#dc2626",
          iconBg:      isDark ? "rgba(248,113,113,0.15)" : "rgba(220,38,38,0.08)",
          iconBorder:  isDark ? "rgba(248,113,113,0.30)" : "rgba(220,38,38,0.18)",
          iconColor:   isDark ? "#fca5a5" : "#dc2626",
          value:       isDark ? "#fca5a5" : "#dc2626",
        },
        reset: {
          accent:      isDark ? "#fb923c" : "#c2410c",
          iconBg:      isDark ? "rgba(251,146,60,0.15)"  : "rgba(194,65,12,0.08)",
          iconBorder:  isDark ? "rgba(251,146,60,0.30)"  : "rgba(194,65,12,0.18)",
          iconColor:   isDark ? "#fdba74" : "#c2410c",
          value:       isDark ? "#fdba74" : "#c2410c",
        },
      },
    },

  };
};

export default getUserManagementTheme;

/* ═══════════════════════════════════════════════════
   Role / Status / Department config
   (exported independently — contain icon references)
═══════════════════════════════════════════════════ */
export const roleConfig: Record<string, { Icon: any; color: string; bg: string }> = {
  Admin: {
    Icon: icons.userMgmt.adminRole,
    color: "#7c3aed",
    bg: "rgba(124,58,237,0.10)",
  },
  "System Manager": {
    Icon: icons.userMgmt.managerRole,
    color: "#0369a1",
    bg: "rgba(3,105,161,0.10)",
  },
  Approver: {
    Icon: icons.userMgmt.approverRole,
    color: "#b45309",
    bg: "rgba(180,83,9,0.10)",
  },
  User: {
    Icon: icons.userMgmt.userRole,
    color: "#047857",
    bg: "rgba(4,120,87,0.10)",
  },
};

export const statusConfig: Record<string, { Icon: any; color: string; bg: string }> = {
  Active: {
    Icon: icons.userMgmt.activeStatus,
    color: "#16a34a",
    bg: "rgba(22,163,74,0.10)",
  },
  Inactive: {
    Icon: icons.userMgmt.inactiveStatus,
    color: "#dc2626",
    bg: "rgba(220,38,38,0.10)",
  },
};

const deptColorMap = [
  { color: "#0369a1", bg: "rgba(3,105,161,0.10)" },
  { color: "#7c3aed", bg: "rgba(124,58,237,0.10)" },
  { color: "#b45309", bg: "rgba(180,83,9,0.10)" },
  { color: "#047857", bg: "rgba(4,120,87,0.10)" },
  { color: "#9d174d", bg: "rgba(157,23,77,0.10)" },
];

export const getDeptConfig = (deptName: string, departments: any[]) => {
  const idx = departments.findIndex((d) => d.departmentName === deptName);
  return deptColorMap[idx >= 0 ? idx % deptColorMap.length : 0];
};