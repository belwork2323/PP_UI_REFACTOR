// ─── COLORS ──────────────────────────────────────────────────────────────────
// Single source of truth for every colour used across all themes.
//
// IMPORTANT — mode semantics:
//
//   Login page   →  light = BLUE GRADIENT bg, white text  (branded look)
//                   dark  = NEAR-BLACK bg, dark cards     (standard dark)
//
//   App Header   →  light = BLUE GRADIENT bar  (branded)
//                   dark  = NEAR-BLACK bar      (standard dark)
//
// Pressing the toggle switches between the branded blue experience (light)
// and the sleek standard dark experience (dark).
// ─────────────────────────────────────────────────────────────────────────────

const colors = {
  primary: {
    main:  "#1976d2",
    light: "#63a4ff",
    dark:  "#004ba0",
  },
  secondary: { main: "#9c27b0" },
  success:   { main: "#2e7d32" },
  error:     { main: "#d32f2f" },
  warning:   { main: "#ed6c02" },
  info:      { main: "#0288d1" },

  // ── Grey scale ────────────────────────────────────────────────
  grey: {
    100: "#f5f5f5",
    200: "#eeeeee",
    300: "#e0e0e0",
    400: "#bdbdbd",
    500: "#9e9e9e",
    600: "#757575",
    700: "#616161",
    800: "#424242",
    900: "#212121",
  },

  paper: "#fff",

  text: {
    primary:   "#000000",
    secondary: "text.secondary",
  },

  /* ── Semantic UI tokens ───────────────────────────────────────── */
  appHeaderBgColor:   "#1976d2",
  appHeaderTextColor: "#ffffff",
  appFooterBgColor:   "#004ba0",
  appFooterTextColor: "#ffffff",
  appLogoBgColor:     "#e0e0e0",

  /* ── Overlay / glass surfaces ────────────────────────────────── */
  overlay: {
    light:      "rgba(255,255,255,0.10)",
    lightHover: "rgba(255,255,255,0.18)",
    logoBg:     "rgba(255,255,255,0.15)",
    dark:       "rgba(0,0,0,0.25)",
  },

  /* ── White variants (for use on gradient/dark backgrounds) ──── */
  white: {
    full:      "#ffffff",
    text:      "#ffffff",
    textSoft:  "rgba(255,255,255,0.95)",
    textMuted: "rgba(255,255,255,0.85)",
  },

  /* ── Shadows ─────────────────────────────────────────────────── */
  shadow: {
    card:   "0 30px 80px rgba(0,0,0,0.35)",
    subtle: "0 4px 16px rgba(0,0,0,0.10)",
    header: "0 2px 16px rgba(0,0,0,0.18)",
  },

  /* ── Captcha background ──────────────────────────────────────── */
  captcha: {
    imageBg: "#eef2ff",
  },

  // ═══════════════════════════════════════════════════════════════
  // LOGIN PAGE — mode-aware tokens
  //
  //   light → blue gradient page, white text  (branded)
  //   dark  → near-black page, dark cards     (standard dark)
  // ═══════════════════════════════════════════════════════════════
  modes: {

    // ── light: blue gradient, branded ────────────────────────────
    light: {
      // Page / surface
      pageBg:              "linear-gradient(135deg, #004ba0 0%, #1976d2 100%)",
      cardBg:              "#ffffff",

      // Text
      textPrimary:         "#ffffff",
      textSecondary:       "rgba(255,255,255,0.85)",

      // Feature cards (left panel)
      featureOverlay:      "rgba(255,255,255,0.10)",
      featureOverlayHover: "rgba(255,255,255,0.18)",

      // Shadows
      cardShadow:          "0 30px 80px rgba(0,0,0,0.35)",

      // Brand accent inside the login card
      cardAccent:          "#1976d2",

      // Theme-toggle button
      toggleBg:            "rgba(0,0,0,0.25)",
      toggleBgHover:       "rgba(0,0,0,0.40)",
      toggleIcon:          "#ffffff",

      // Login page footer
      footerBg:            "rgba(0,0,0,0.35)",
      footerBorder:        "rgba(255,255,255,0.08)",
      footerText:          "rgba(255,255,255,0.85)",
    },

    // ── dark: standard dark theme ─────────────────────────────────
    dark: {
      // Page / surface
      pageBg:              "#0f1117",
      cardBg:              "#1a1d27",

      // Text
      textPrimary:         "#f0f2f8",
      textSecondary:       "rgba(240,242,248,0.60)",

      // Feature cards (left panel)
      featureOverlay:      "rgba(255,255,255,0.05)",
      featureOverlayHover: "rgba(255,255,255,0.09)",

      // Shadows
      cardShadow:          "0 20px 60px rgba(0,0,0,0.60)",

      // Brand accent inside the login card
      cardAccent:          "#63a4ff",

      // Theme-toggle button
      toggleBg:            "rgba(255,255,255,0.08)",
      toggleBgHover:       "rgba(255,255,255,0.14)",
      toggleIcon:          "#f0f2f8",

      // Login page footer
      footerBg:            "rgba(0,0,0,0.50)",
      footerBorder:        "rgba(255,255,255,0.08)",
      footerText:          "rgba(240,242,248,0.60)",
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // APP HEADER — mode-aware tokens
  //
  //   "light" →  BLUE GRADIENT bar  (branded)
  //   "dark"  →  NEAR-BLACK bar     (standard dark)
  // ═══════════════════════════════════════════════════════════════
  header: {
    light: {
      barBg:               "linear-gradient(135deg, #004ba0 0%, #1976d2 100%)",
      barBorder:           "rgba(255,255,255,0.25)",
      barText:             "#ffffff",
      barMuted:            "rgba(255,255,255,0.70)",
      glassBg:             "rgba(255,255,255,0.12)",
      glassBgHover:        "rgba(255,255,255,0.22)",
      glassBgActive:       "rgba(255,255,255,0.30)",
      glassBorder:         "rgba(255,255,255,0.25)",
      glassBorderHover:    "rgba(255,255,255,0.55)",
      glassBorderFocus:    "rgba(255,255,255,0.70)",
      logoBg:              "rgba(255,255,255,0.18)",
      orgTextShadow:       "0 1px 4px rgba(0,0,0,0.3)",
      menuPaperBg:         "linear-gradient(135deg, #004ba0 0%, #1976d2 100%)",
      menuPaperBaseBg:     "#004ba0",
      menuText:            "#ffffff",
      menuHoverBg:         "rgba(255,255,255,0.12)",
      menuSelectedBg:      "rgba(255,255,255,0.20)",
    },
    dark: {
      barBg:               "#0f172a",
      barBorder:           "rgba(255,255,255,0.10)",
      barText:             "#ffffff",
      barMuted:            "rgba(255,255,255,0.60)",
      glassBg:             "rgba(255,255,255,0.08)",
      glassBgHover:        "rgba(255,255,255,0.15)",
      glassBgActive:       "rgba(255,255,255,0.22)",
      glassBorder:         "rgba(255,255,255,0.18)",
      glassBorderHover:    "rgba(255,255,255,0.40)",
      glassBorderFocus:    "rgba(255,255,255,0.60)",
      logoBg:              "rgba(255,255,255,0.10)",
      orgTextShadow:       "0 1px 4px rgba(0,0,0,0.5)",
      menuPaperBg:         "#1e293b",
      menuPaperBaseBg:     "#1e293b",
      menuText:            "#ffffff",
      menuHoverBg:         "rgba(255,255,255,0.08)",
      menuSelectedBg:      "rgba(255,255,255,0.14)",
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // APP FOOTER — mode-aware tokens
  // ═══════════════════════════════════════════════════════════════
  footer: {
    light: {
      barBg:      "linear-gradient(135deg, #004ba0 0%, #1976d2 100%)",
      barBorder:  "rgba(255,255,255,0.12)",
      boxShadow:  "0 -2px 16px rgba(0,0,0,0.18)",
      barText:    "#ffffff",
      barMuted:   "rgba(255,255,255,0.70)",
      textShadow: "0 1px 4px rgba(0,0,0,0.3)",
    },
    dark: {
      barBg:      "#0f172a",
      barBorder:  "rgba(255,255,255,0.10)",
      boxShadow:  "0 -2px 16px rgba(0,0,0,0.35)",
      barText:    "#ffffff",
      barMuted:   "rgba(255,255,255,0.60)",
      textShadow: "0 1px 4px rgba(0,0,0,0.5)",
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // APP DRAWER — mode-aware tokens
  // ═══════════════════════════════════════════════════════════════
  drawer: {
    light: {
      paperBg:          "linear-gradient(180deg, #f0f4ff 0%, #ffffff 100%)",
      boxShadow:        "4px 0 24px rgba(0,0,0,0.10)",
      borderColor:      "rgba(0,0,0,0.08)",
      headerBg:         "rgba(0,0,0,0.02)",
      logoBorder:       "rgba(0,0,0,0.15)",
      textPrimary:      "#111111",
      textMuted:        "rgba(0,0,0,0.50)",
      navText:          "rgba(0,0,0,0.75)",
      hoverBg:          "rgba(0,0,0,0.05)",
      activeBg:         "rgba(0,0,0,0.08)",
      logoutHoverBg:    "rgba(244,67,54,0.08)",
    },
    dark: {
      paperBg:          "linear-gradient(180deg, #0d1b2e 0%, #112240 100%)",
      boxShadow:        "4px 0 32px rgba(0,0,0,0.55)",
      borderColor:      "rgba(255,255,255,0.08)",
      headerBg:         "rgba(255,255,255,0.04)",
      logoBorder:       "rgba(255,255,255,0.20)",
      textPrimary:      "#ffffff",
      textMuted:        "rgba(255,255,255,0.55)",
      navText:          "rgba(255,255,255,0.80)",
      hoverBg:          "rgba(255,255,255,0.10)",
      activeBg:         "rgba(255,255,255,0.14)",
      logoutHoverBg:    "rgba(244,67,54,0.08)",
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // DEPARTMENT HEADER CARD — mode-aware tokens
  // ═══════════════════════════════════════════════════════════════
  deptHeader: {
    light: {
      cardBg:          "linear-gradient(135deg, rgba(0,75,160,0.82) 0%, rgba(25,118,210,0.78) 100%)",
      cardBorder:      "rgba(255,255,255,0.14)",
      cardShadow:      "0 8px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.08)",
      backdropFilter:  "blur(12px)",
      labelColor:      "rgba(255,255,255,0.60)",
      valueColor:      "#ffffff",
      dividerColor:    "rgba(255,255,255,0.10)",
      chipBg:          "rgba(255,255,255,0.12)",
      chipBorder:      "rgba(255,255,255,0.20)",
      chipText:        "#ffffff",
      iconBadgeBg:     "rgba(255,255,255,0.15)",
      iconColor:       "#ffffff",
      decorBg:         "rgba(255,255,255,0.05)",
      decorBgSmall:    "rgba(255,255,255,0.04)",
      accentAllocated: "rgba(255,255,255,0.70)",
      accentCompleted: "#4ade80",
      accentDraft:     "#fbbf24",
      accentPending:   "#f87171",
    },
    dark: {
      cardBg:          "#1a1d27",
      cardBorder:      "rgba(255,255,255,0.07)",
      cardShadow:      "0 2px 16px rgba(0,0,0,0.45)",
      backdropFilter:  "none",
      labelColor:      "rgba(255,255,255,0.50)",
      valueColor:      "#ffffff",
      dividerColor:    "rgba(255,255,255,0.08)",
      chipBg:          "rgba(255,255,255,0.07)",
      chipBorder:      "rgba(255,255,255,0.14)",
      chipText:        "#ffffff",
      iconBadgeBg:     "rgba(255,255,255,0.10)",
      iconColor:       "#ffffff",
      decorBg:         "rgba(255,255,255,0.04)",
      decorBgSmall:    "rgba(255,255,255,0.03)",
      accentAllocated: "#63a4ff",
      accentCompleted: "#4ade80",
      accentDraft:     "#fbbf24",
      accentPending:   "#f87171",
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // DASHBOARD PAGE — mode-aware tokens
  // ═══════════════════════════════════════════════════════════════
  dashboard: {
    light: {
      pageBg:         "#f5f6fa",
      cardBg:         "#ffffff",
      cardBorder:     "rgba(0,0,0,0.06)",
      cardShadow:     "0 2px 12px rgba(0,0,0,0.08)",
      dividerColor:   "rgba(0,0,0,0.08)",
      textPrimary:    "#111111",
      textSecondary:  "rgba(0,0,0,0.50)",
      textDisabled:   "rgba(0,0,0,0.30)",
      textSuccess:    "#2e7d32",
      textWarning:    "#e65100",
      tableHeaderText:   "rgba(0,0,0,0.38)",
      tableHeaderBorder: "rgba(0,0,0,0.06)",
      tableRowHover:     "rgba(0,0,0,0.02)",
      progressTrack:  "rgba(0,0,0,0.08)",
      timelineConnector: "rgba(0,0,0,0.08)",
      chartHeaderBar:  "linear-gradient(135deg, #1565c0 0%, #1e88e5 40%, #42a5f5 100%)",
      chartHeaderLine: "linear-gradient(135deg, #2e7d32 0%, #43a047 40%, #66bb6a 100%)",
      chartHeaderArea: "linear-gradient(135deg, #37474f 0%, #546e7a 45%, #78909c 100%)",
    },
    dark: {
      pageBg:         "#0f1117",
      cardBg:         "#1a1d27",
      cardBorder:     "rgba(255,255,255,0.07)",
      cardShadow:     "0 2px 16px rgba(0,0,0,0.45)",
      dividerColor:   "rgba(255,255,255,0.08)",
      textPrimary:    "#f0f2f8",
      textSecondary:  "rgba(240,242,248,0.55)",
      textDisabled:   "rgba(240,242,248,0.30)",
      textSuccess:    "#66bb6a",
      textWarning:    "#ffa726",
      tableHeaderText:   "rgba(240,242,248,0.40)",
      tableHeaderBorder: "rgba(255,255,255,0.10)",
      tableRowHover:     "rgba(255,255,255,0.04)",
      progressTrack:  "rgba(255,255,255,0.10)",
      timelineConnector: "rgba(255,255,255,0.10)",
      chartHeaderBar:  "linear-gradient(135deg, #0d47a1 0%, #1565c0 45%, #1976d2 100%)",
      chartHeaderLine: "linear-gradient(135deg, #1b5e20 0%, #2e7d32 45%, #388e3c 100%)",
      chartHeaderArea: "linear-gradient(135deg, #263238 0%, #37474f 45%, #455a64 100%)",
    },
  },
};

export default colors;