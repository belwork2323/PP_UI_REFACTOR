import colors  from "../../colors";
import fonts   from "../../fonts";
import spacing from "../../spacing";
import layout  from "../../layout";
import general from "./common_css_theme";
import { icons } from "../../icons";

// ─────────────────────────────────────────────────────────────────────────────
// DRAWER NAV ITEMS
// Icons are pulled from the central icons.js — add new entries there first,
// then reference them here via icons.drawerXxx
// ─────────────────────────────────────────────────────────────────────────────
export const DRAWER_NAV = [
  { key: "dashboard",   label: "Dashboard",         path: "/admin",          Icon: icons.drawerDashboard   },
  { key: "users",       label: "User Management",   path: "/admin/users",    Icon: icons.drawerUsers       },
  { key: "batch",       label: "Batch Management",  path: "/admin/batch",    Icon: icons.drawerBatch       },
  { key: "projects",    label: "Project Management",path: "/admin/projects", Icon: icons.drawerDepartments },
];

// ─────────────────────────────────────────────────────────────────────────────
// DRAWER WIDTH
// ─────────────────────────────────────────────────────────────────────────────
export const DRAWER_WIDTH = 260;

// ─────────────────────────────────────────────────────────────────────────────
// getDrawerTheme(mode)
//
//   "light" →  WHITE / off-white panel — clean bright sidebar
//              Dark text on white
//
//   "dark"  →  DEEP NAVY panel — standard dark theme
//              White text on dark
//
// All colour values come from colors.drawer[mode] — no magic strings here.
// All reusable layout primitives come from `general`.
// ─────────────────────────────────────────────────────────────────────────────
const getDrawerTheme = (mode = "light") => {
  const d = colors.drawer?.[mode] ?? colors.drawer.light;

  return {

    // ── Drawer paper ─────────────────────────────────────────────
    paper: {
      width:       DRAWER_WIDTH,
      background:  d.paperBg,
      borderRight: `1px solid ${d.borderColor}`,
      boxShadow:   d.boxShadow,
      ...general.flexColumn,
    },

    // ── Header (logo + org name + role badge) ─────────────────────
    header: {
      wrapper: {
        ...general.flexRow,
        ...general.alignCenter,
        gap:          1.5,
        px:           2.5,
        py:           2,
        borderBottom: `1px solid ${d.borderColor}`,
        background:   d.headerBg,
        ...general.noShrink,
      },

      logoCircle: {
        width:        40,
        height:       40,
        ...general.borderCircle,
        ...general.overflowHidden,
        ...general.noShrink,
        border:       `2px solid ${d.logoBorder}`,
      },

      logoImg: {
        ...general.fullSize,
        ...general.objectCover,
      },

      orgName: {
        fontSize:      fonts.size?.sm     ?? "0.8rem",
        fontWeight:    fonts.weight?.bold ?? 700,
        color:         d.textPrimary,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        lineHeight:    fonts.lineHeight?.tight ?? 1.3,
      },

      roleBadge: {
        fontSize:   fonts.size?.xs         ?? "0.7rem",
        color:      d.textMuted,
        fontWeight: fonts.weight?.medium   ?? 500,
        mt:         "2px",
      },
    },

    // ── Nav list ──────────────────────────────────────────────────
    nav: {
      list: {
        pt:        1.5,
        ...general.flex1,
        overflowY: "auto",
      },

      item: {
        borderRadius: `${layout.cardBorderRadius ?? 10}px`,
        mx:           1,
        mb:           0.5,
        color:        d.navText,
        "&:hover":  { background: d.hoverBg,  color: d.textPrimary },
        "&.active": { background: d.activeBg, color: d.textPrimary },
        transition: layout.glass?.transition ?? "all 0.18s ease",
      },

      icon: {
        minWidth: 36,
        color:    "inherit",
      },

      labelProps: {
        fontSize:   fonts.size?.sm         ?? "0.875rem",
        fontWeight: fonts.weight?.medium   ?? 500,
        color:      "inherit",
      },
    },

    // ── Divider ───────────────────────────────────────────────────
    divider: {
      borderColor: d.borderColor,
    },

    // ── Footer wrapper ────────────────────────────────────────────
    footer: {
      wrapper: {
        mt: "auto",
        pt: 0.5,
        pb: 1.5,
      },
    },

    // ── Profile card ──────────────────────────────────────────────
    profileCard: {
      wrapper: {
        mx: 1.5,
        mt: 1.5,
        mb: 1,
        px: 1.25,
        py: 1.25,
        display: "flex",
        alignItems: "flex-start",
        gap: 1,
        borderRadius: `${(layout.cardBorderRadius ?? 10) + 4}px`,
        background: d.headerBg,
        border: `1px solid ${d.borderColor}`,
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
      },

      avatar: {
        width: 44,
        height: 44,
        fontSize: "0.95rem",
        fontWeight: fonts.weight?.bold ?? 700,
        bgcolor: mode === "dark" ? colors.primary.main : colors.primary.dark,
        color: "#fff",
        flexShrink: 0,
        boxShadow: "0 8px 20px rgba(15, 23, 42, 0.16)",
      },

      content: {
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        gap: 0.6,
        flex: 1,
      },

      username: {
        fontSize: fonts.size?.sm ?? "0.875rem",
        fontWeight: fonts.weight?.bold ?? 700,
        color: d.textPrimary,
        lineHeight: 1.2,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
      },

      roleRow: {
        display: "inline-flex",
        alignItems: "center",
        gap: 0.6,
        width: "fit-content",
        maxWidth: "100%",
        px: 0.75,
        py: 0.35,
        borderRadius: "999px",
        backgroundColor: mode === "dark" ? "rgba(255,255,255,0.06)" : "rgba(15,23,42,0.04)",
        border: `1px solid ${d.borderColor}`,
      },

      roleIcon: {
        fontSize: 15,
        color: d.textPrimary,
        flexShrink: 0,
      },

      roleText: {
        fontSize: fonts.size?.xs ?? "0.75rem",
        fontWeight: fonts.weight?.bold ?? 700,
        color: d.textPrimary,
        lineHeight: 1,
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
      },

      idRow: {
        display: "flex",
        alignItems: "center",
        gap: 0.55,
        minWidth: 0,
      },

      idIcon: {
        fontSize: 15,
        color: d.textMuted,
        flexShrink: 0,
      },

      idText: {
        fontSize: fonts.size?.xs ?? "0.75rem",
        fontWeight: fonts.weight?.medium ?? 500,
        color: d.textMuted,
        lineHeight: 1.2,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
      },
    },

    // ── Logout footer ─────────────────────────────────────────────
    logout: {
      list: {
        pb: 0,
      },

      item: {
        borderRadius: `${layout.cardBorderRadius ?? 10}px`,
        mx:           1,
        mb:           0.5,
        color:        colors.error.main,
        "&:hover": {
          background: d.logoutHoverBg,
          color:      colors.error.main,
        },
        transition: layout.glass?.transition ?? "all 0.18s ease",
      },

      icon: {
        minWidth: 36,
        color:    "inherit",
      },

      labelProps: {
        fontSize:   fonts.size?.sm         ?? "0.875rem",
        fontWeight: fonts.weight?.medium   ?? 500,
        color:      "inherit",
      },
    },
  };
};

export default getDrawerTheme;