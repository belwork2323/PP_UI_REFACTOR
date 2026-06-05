import colors  from "../../colors";
import fonts   from "../../fonts";
import spacing from "../../spacing";
import layout  from "../../layout";
import general from "./common_css_theme";

// ─────────────────────────────────────────────────────────────────────────────
// getAppFooterTheme(mode)
//
//   "light" →  BLUE GRADIENT bar  (mirrors header light — branded look)
//              White text on blue
//
//   "dark"  →  NEAR-BLACK bar     (mirrors header dark — standard dark theme)
//              White text on dark
//
// All colour values come from colors.footer[mode] — no magic strings here.
// All reusable layout primitives come from `general`.
// ─────────────────────────────────────────────────────────────────────────────

const getAppFooterTheme = (mode = "light") => {
  const f = colors.footer?.[mode] ?? colors.footer.light;

  return {

    // ─── APP BAR ─────────────────────────────────────────────────
    appBar: {
      top:            "auto",
      bottom:         0,
      background:     f.barBg,
      backdropFilter: layout.glass?.backdropFilter ?? "blur(8px)",
      borderTop:      `1px solid ${f.barBorder}`,
      boxShadow:      f.boxShadow,
    },

    // ─── TOOLBAR ─────────────────────────────────────────────────
    toolbar: {
      px:        { xs: spacing.md, md: spacing.lg },
      minHeight: {
        xs: layout.appFooterHeight?.xs ?? 52,
        md: layout.appFooterHeight?.md ?? 56,
      },
      ...general.positionRelative,
      ...general.flexRow,
      ...general.alignCenter,
    },

    // ─── CENTER TEXT BLOCK ────────────────────────────────────────
    centerBlock: {
      wrapper: {
        ...general.positionAbsolute,
        left:          "50%",
        transform:     "translateX(-50%)",
        ...general.flexColumn,
        ...general.alignCenter,
        gap:           "2px",
        pointerEvents: "none",
        ...general.noWrap,
      },

      copyright: {
        fontSize:      fonts.size?.xs     ?? "0.72rem",
        fontWeight:    fonts.weight?.bold ?? 700,
        color:         f.barText,
        letterSpacing: "0.04em",
        lineHeight:    fonts.lineHeight?.tight ?? 1.3,
        textShadow:    f.textShadow,
      },

      maintenance: {
        fontSize:   fonts.size?.xs          ?? "0.68rem",
        color:      f.barMuted,
        fontWeight: fonts.weight?.medium    ?? 500,
        lineHeight: fonts.lineHeight?.tight ?? 1.3,
      },
    },

    // ─── RIGHT: BEL LOGO ─────────────────────────────────────────
    belLogo: {
      wrapper: {
        marginLeft: "auto",
        ...general.flexRow,
        ...general.alignCenter,
        ...general.noShrink,
      },

      img: {
        height:  36,
        width:   "auto",
        ...general.objectContain,
        display: "block",
      },
    },

    // ─── SPACER (pushes page content above fixed bar) ─────────────
    spacer: {
      minHeight: {
        xs: layout.appFooterHeight?.xs ?? 52,
        md: layout.appFooterHeight?.md ?? 56,
      },
    },
  };
};

export default getAppFooterTheme;