import colors  from "../../colors";
import fonts   from "../../fonts";
import spacing from "../../spacing";
import layout  from "../../layout";
import general from "./common_css_theme";

// ─────────────────────────────────────────────────────────────────────────────
// getAppHeaderTheme(mode)
//
//   "light" →  BLUE GRADIENT bar  (familiar branded look — mirrors login dark)
//   "dark"  →  NEAR-BLACK bar     (standard dark theme)
//
// All colour values come from colors.header[mode] — no magic strings here.
// All reusable layout primitives come from `general`.
// ─────────────────────────────────────────────────────────────────────────────

const getAppHeaderTheme = (mode = "light") => {
  const h = colors.header?.[mode] ?? colors.header.light;

  return {

    // ─── APP BAR ─────────────────────────────────────────────────
    appBar: {
      background:     h.barBg,
      backdropFilter: layout.glass?.backdropFilter ?? "blur(8px)",
      borderBottom:   `1px solid ${h.barBorder}`,
      boxShadow:      colors.shadow.header,
    },

    // ─── TOOLBAR ─────────────────────────────────────────────────
    toolbar: {
      px:        { xs: spacing.md, md: spacing.lg },
      gap:       2,
      minHeight: {
        xs: layout.appHeaderHeight?.xs ?? 60,
        md: layout.appHeaderHeight?.md ?? 68,
      },
    },

    // ─── LEFT SECTION ────────────────────────────────────────────
    leftSection: {
      wrapper: {
        ...general.flexRow,
        ...general.alignCenter,
        gap:        1.5,
        ...general.noShrink,
      },

      logoCircle: {
        width:          52,
        height:         52,
        bgcolor:        h.logoBg,
        backdropFilter: "blur(6px)",
        border:         `2px solid ${h.glassBorder}`,
        ...general.borderCircle,
        ...general.flexCenter,
        ...general.overflowHidden,
        ...general.noShrink,
      },

      logoImg: {
        width:        "92%",
        height:       "92%",
        ...general.objectCover,
        borderRadius: "50%",
      },

      orgWrapper: {
        display:       { xs: "none", lg: "flex" },
        flexDirection: "column",
        gap:           "2px",
      },

      orgName: {
        fontSize:      fonts.size?.sm     ?? "0.875rem",
        fontWeight:    fonts.weight?.bold ?? 700,
        color:         h.barText,
        lineHeight:    fonts.lineHeight?.tight ?? 1.3,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        textShadow:    h.orgTextShadow,
      },

      orgCountry: {
        fontSize:   fonts.size?.xs         ?? "0.75rem",
        color:      h.barMuted,
        lineHeight: fonts.lineHeight?.tight ?? 1.3,
        fontWeight: fonts.weight?.medium   ?? 500,
      },
    },

    // ─── CENTER TITLE ─────────────────────────────────────────────
    centerTitle: {
      ...general.positionAbsolute,
      left:          "50%",
      transform:     "translateX(-50%)",
      fontWeight:    fonts.weight?.bold ?? 700,
      fontSize:      { xs: fonts.size?.sm ?? "0.875rem", sm: "0.9rem", md: fonts.size?.md ?? "1rem" },
      color:         h.barText,
      ...general.noWrap,
      ...general.overflowHidden,
      textOverflow:  "ellipsis",
      maxWidth:      { xs: "40vw", md: "36vw" },
      letterSpacing: "0.01em",
      pointerEvents: "none",
    },

    // ─── RIGHT SECTION ────────────────────────────────────────────
    rightSection: {
      wrapper: {
        marginLeft: "auto",
        ...general.flexRow,
        ...general.alignCenter,
        gap:        spacing.sm ?? 1,
        ...general.noShrink,
      },

      userCard: {
        display: "flex",
        alignItems: "center",
        px: 0.75,
        py: 0.625,
        gap: 1,
        minWidth: { xs: 0, sm: 190, md: 224 },
        borderRadius: "14px",
        background: h.glassBg,
        backdropFilter: "blur(10px)",
        border: `1px solid ${h.glassBorder}`,
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)",
        maxWidth: { xs: 160, sm: 220, md: 250 },
      },
      userCardInteractive: {
        cursor: "pointer",
        transition: "all 0.2s ease",
        "&:hover": {
          background: h.glassBgHover,
          borderColor: h.glassBorderHover,
        },
      },
      
      userAvatar: {
        width: 38,
        height: 38,
        fontSize: "0.9rem",
        fontWeight: 700,
        bgcolor: mode === "dark" ? "primary.main" : "primary.dark",
        color: "#fff",
        border: `1px solid ${h.glassBorderHover}`,
        boxShadow: "0 6px 18px rgba(15, 23, 42, 0.18)",
      },

      userMeta: {
        minWidth: 0,
        flex: 1,
        display: { xs: "none", sm: "flex" },
      },

      userName: {
        fontSize: fonts.size?.sm ?? "0.85rem",
        fontWeight: 700,
        color: h.barText,
        lineHeight: 1.2,
        letterSpacing: "0.02em",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
      },

      roleBadge: {
        display: "inline-flex",
        alignItems: "center",
        gap: 0.5,
        width: "fit-content",
        maxWidth: "100%",
        px: 0.75,
        py: 0.35,
        borderRadius: "999px",
        backgroundColor: mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.22)",
        border: `1px solid ${h.glassBorder}`,
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
      },

      roleIcon: {
        fontSize: 14,
        color: h.barText,
        opacity: 0.9,
        flexShrink: 0,
      },

      userRole: {
        display: "block",
        maxWidth: { sm: 92, md: 122 },
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        fontSize: "0.68rem",
        fontWeight: 700,
        color: h.barText,
        lineHeight: 1,
        textTransform: "uppercase",
        letterSpacing: "0.08em",
      },

      select: {
        height:         36,
        color:          h.barText,
        fontSize:       fonts.size?.sm      ?? "0.875rem",
        fontWeight:     fonts.weight?.medium ?? 500,
        borderRadius:   "8px",
        bgcolor:        h.glassBg,
        backdropFilter: "blur(6px)",
        minWidth:       { xs: 140, sm: 190 },

        "& .MuiOutlinedInput-notchedOutline":             { borderColor: h.glassBorder      },
        "&:hover .MuiOutlinedInput-notchedOutline":       { borderColor: h.glassBorderHover },
        "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: h.glassBorderFocus },

        "& .MuiSelect-icon": { color: h.barText },

        "& .MuiSelect-select": {
          ...general.flexRow,
          ...general.alignCenter,
          py:                  0,
          pr:                  "28px !important",
          pl:                  "12px",
          color:               h.barText,
          WebkitTextFillColor: h.barText,
        },
      },

      menuPaper: {
        mt:              spacing.sm ?? 1,
        borderRadius:    `${(layout.cardBorderRadius ?? 4) * 2.5}px`,
        boxShadow:       colors.shadow.subtle,
        background:      h.menuPaperBg,          // gradient → must use `background`
        backgroundColor: h.menuPaperBaseBg,      // solid fallback for browsers
        "& .MuiMenuItem-root": {
          fontSize: fonts.size?.sm ?? "0.875rem",
          py:       spacing.sm    ?? 1,
          color:    h.menuText,
        },
        "& .MuiMenuItem-root:hover":        { background: h.menuHoverBg    },
        "& .MuiMenuItem-root.Mui-selected": { background: h.menuSelectedBg, color: h.menuText },
      },

      themeToggle: {
        width:          36,
        height:         36,
        bgcolor:        h.glassBg,
        backdropFilter: "blur(6px)",
        border:         `1.5px solid ${h.glassBorder}`,
        borderRadius:   "8px",
        color:          h.barText,
        transition:     layout.glass?.transition ?? "all 0.2s",
        "&:hover":  { bgcolor: h.glassBgHover,  borderColor: h.glassBorderHover },
        "&:active": { bgcolor: h.glassBgActive },
      },

    },

    // ─── USER MENU PAPER ─────────────────────────────────────────
    userMenuPaper: {
      mt:              spacing.sm ?? 1,
      minWidth:        280,
      borderRadius:    `${(layout.cardBorderRadius ?? 4) * 2.5}px`,
      boxShadow:       colors.shadow.subtle,
      background:      h.menuPaperBg,            // gradient → `background`
      backgroundColor: h.menuPaperBaseBg,
      ...general.overflowHidden,
      "& .MuiMenuItem-root":       { color: h.menuText },
      "& .MuiMenuItem-root:hover": { background: h.menuHoverBg },
    },

    // ─── MENU ITEM STYLES ─────────────────────────────────────────
    menuItem: {
      normal: {
        fontSize: fonts.size?.sm ?? "0.875rem",
        color:    h.menuText,
      },
      danger: {
        color:    colors.error.main,
        fontSize: fonts.size?.sm ?? "0.875rem",
      },
      dangerIcon: {
        color: colors.error.main,
      },
    },

    profileMenu: {
      card: {
        display: "flex",
        alignItems: "flex-start",
        gap: 1.5,
        px: 2,
        py: 1.8,
      },
      avatar: {
        width: 46,
        height: 46,
        fontSize: "1rem",
        fontWeight: 700,
        bgcolor: mode === "dark" ? "primary.main" : "primary.dark",
        color: "#fff",
        border: `1px solid ${h.glassBorderHover}`,
        boxShadow: "0 6px 18px rgba(15, 23, 42, 0.18)",
      },
      content: {
        minWidth: 0,
        flex: 1,
      },
      username: {
        fontSize: fonts.size?.sm ?? "0.85rem",
        fontWeight: 700,
        color: h.menuText,
        lineHeight: 1.2,
        mb: 0.8,
      },
      roleRow: {
        display: "inline-flex",
        alignItems: "center",
        gap: 0.6,
        maxWidth: "100%",
        px: 0.75,
        py: 0.35,
        borderRadius: "999px",
        backgroundColor: mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.22)",
        border: `1px solid ${h.glassBorder}`,
      },
      roleIcon: {
        fontSize: 14,
        color: h.menuText,
        flexShrink: 0,
      },
      roleText: {
        fontSize: "0.68rem",
        fontWeight: 700,
        color: h.menuText,
        lineHeight: 1,
        textTransform: "uppercase",
        letterSpacing: "0.08em",
      },
      idRow: {
        display: "flex",
        alignItems: "center",
        gap: 0.6,
        mt: 1,
      },
      idIcon: {
        fontSize: 14,
        color: h.menuText,
        opacity: 0.8,
      },
      idText: {
        fontSize: "0.72rem",
        color: h.menuText,
        opacity: 0.88,
      },
      divider: {
        borderColor: h.glassBorder,
      },
      logoutItem: {
        mx: 1,
        mb: 1,
        py: spacing.sm ?? 1,
        borderRadius: "10px",
        bgcolor: "#ffffff",
        border: "1px solid rgba(183,28,28,0.45)",
        "&:hover": {
          bgcolor: "#ffffff !important",
        },
        "&.Mui-focusVisible": {
          bgcolor: "#ffffff !important",
        },
        "&.Mui-selected, &.Mui-selected:hover": {
          bgcolor: "#ffffff !important",
        },
      },
      logoutIcon: {
        minWidth: 32,
        color: "#b71c1c",
      },
      logoutLabelProps: {
        fontSize: fonts.size?.sm ?? "0.875rem",
        color: "#b71c1c",
        fontWeight: fonts.weight?.bold ?? 700,
      },
    },

    // ─── SPACER (pushes page content below fixed bar) ─────────────
    spacer: {
      minHeight: {
        xs: layout.appHeaderHeight?.xs ?? 60,
        md: layout.appHeaderHeight?.md ?? 68,
      },
    },
  };
};

export default getAppHeaderTheme;