/**
 * layout.js
 * ─────────────────────────────────────────────────────────────
 * Generic layout constants — viewport sizes, z-index layers,
 * glass effects, border radii, fixed bar heights.
 * ─────────────────────────────────────────────────────────────
 */

const layout = {
  /* Full-viewport page wrapper — Login, Splash, Error pages */
  fullPage: {
    height:   "100vh",
    overflow: "hidden",
  },

  /* Scrollable page wrapper — Dashboard, List pages */
  scrollPage: {
    minHeight: "100vh",
    overflow:  "auto",
  },

  /* Glass / frosted panel effect */
  glass: {
    backdropFilter: "blur(10px)",
    transition:     "all 0.3s ease",
  },

  /* Standard card border radius (MUI spacing units → 16px) */
  cardBorderRadius: 4,

  /* Z-index layers */
  zIndex: {
    fixed:   10,
    modal:   100,
    tooltip: 200,
  },

  /**
   * Fixed header bar heights (px).
   * login_theme uses these to set pt on the right panel:
   *   pt: { xs: "86px", md: "136px" }
   * The formula is fixedBarHeight[size] + 16px gap.
   *   xs: 70  + 16 = 86
   *   md: 120 + 16 = 136
   */
  fixedBarHeight: {
    xs: 70,
    sm: 90,
    md: 120,
  },

  /**
   * BEL logo fixed box size (top-right corner of login page).
   * login_theme belLogo.wrapper uses this as width/height.
   * These are responsive sizes in px.
   */
  belLogoSize: {
    xs: 140,
    sm: 180,
    md: 240,
  },

  /**
   * App header bar heights (px) — used by app_header_theme.
   * Spacer toolbar matches these so page content clears the fixed bar.
   */
  appHeaderHeight: {
    xs: 60,
    md: 68,
  },

  /** App footer bar heights (px) — used by app_footer_theme */
  appFooterHeight: {
    xs: 52,
    md: 56,
  },
};

export default layout;