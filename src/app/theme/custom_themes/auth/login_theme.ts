import colors  from "../../colors";
import fonts   from "../../fonts";
import spacing from "../../spacing";
import layout  from "../../layout";
import general from "../common/common_css_theme";

const getLoginTheme = (mode = "light") => {
  const m = colors.modes?.[mode] ?? colors.modes.light;

  // ── Per-mode input/dropdown border & text colours ─────────────────────────
  // light: card is white  → use brand accent
  // dark:  card is #1a1d27 → use subtle white-alpha
  const inputBorderColor      = mode === "dark" ? "rgba(255,255,255,0.18)" : m.cardAccent;
  const inputBorderHoverColor = mode === "dark" ? "rgba(255,255,255,0.45)" : colors.primary.main;
  const inputLabelColor       = mode === "dark" ? "rgba(240,242,248,0.70)" : undefined;
  const inputTextColor        = mode === "dark" ? "#f0f2f8"                : undefined;
  const focusBorderColor      = mode === "dark" ? colors.primary.light     : colors.primary.main;

  // ── Shared overrides applied to every dropdown and input ──────────────────
  const sharedFieldSx = {
    bgcolor:      m.cardBg,
    borderRadius: layout.cardBorderRadius,
    "& .MuiInputLabel-root": {
      fontSize:   "clamp(0.8rem, 1.6vh, 0.9rem)",
      fontWeight: fonts.weight.medium,
      ...(inputLabelColor ? { color: inputLabelColor } : {}),
      "&.Mui-focused": { color: focusBorderColor },
    },
    "& .MuiInputBase-root": {
      height: "clamp(40px, 6vh, 52px)",
      ...(inputTextColor ? { color: inputTextColor } : {}),
    },
    "& .MuiOutlinedInput-notchedOutline":       { borderColor: inputBorderColor },
    "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: inputBorderHoverColor },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: focusBorderColor },
  };

  // ── Shared dropdown select inner sx (role & dept dropdowns are identical) ─
  const dropdownSelectSx = {
    ...sharedFieldSx,
    "& .MuiSelect-select": {
      display:        "flex",
      alignItems:     "center",
      justifyContent: "flex-start",
      height:         "100%",
      padding:        "0 14px",
      fontSize:       "clamp(0.8rem, 1.6vh, 0.9rem)",
      ...(inputTextColor ? { color: inputTextColor } : {}),
      ...general.boxSizingBorder,
    },
    ...(mode === "dark" && {
      "& .MuiSvgIcon-root": { color: "rgba(240,242,248,0.70)" },
    }),
  };

  return {

    // ─── GENERAL ──────────────────────────────────────────────────────────────
    general,

    // ─── PAGE ─────────────────────────────────────────────────────────────────
    page: {
      background:    m.pageBg,
      width:         "100vw",
      height:        { xs: "auto", md: "100vh" },
      minHeight:     { xs: "100vh", md: "unset" },
      overflow:      { xs: "visible", md: "hidden" },
      ...general.flexRow,
      flexDirection: { xs: "column", md: "row" },
      ...general.positionRelative,
    },

    // ─── THEME TOGGLE BUTTON ──────────────────────────────────────────────────
    toggleButton: {
      wrapper: {
        ...general.positionFixed,
        top:    16,
        left:   16,
        zIndex: layout.zIndex.fixed,
      },
      root: {
        width:          44,
        height:         44,
        bgcolor:        m.toggleBg,
        backdropFilter: layout.glass.backdropFilter,
        ...general.borderCircle,
        "&:hover": { bgcolor: m.toggleBgHover },
      },
      icon: { color: m.toggleIcon },
    },

    // ─── BEL LOGO ─────────────────────────────────────────────────────────────
    belLogo: {
      wrapper: {
        height: {
          xs: layout.fixedBarHeight.xs,
          sm: layout.fixedBarHeight.sm,
          md: layout.fixedBarHeight.md,
        },
        width: {
          xs: layout.belLogoSize.xs,
          sm: layout.belLogoSize.sm,
          md: layout.belLogoSize.md,
        },
        top:    0,
        right:  0,
        ...general.positionFixed,
        p:      { xs: spacing.sm, md: spacing.md },
        zIndex: layout.zIndex.fixed,
      },
      img: { ...general.fullSize, ...general.objectContain },
    },

    // ─── LEFT PANEL ───────────────────────────────────────────────────────────
    leftPanel: {
      wrapper: {
        ...general.flex1,
        ...general.noMinWidth,
        ...general.flexColumnCenter,
        overflow: { xs: "visible", md: "hidden" },
        px: {
          xs: spacing.lg,
          sm: spacing.xl,
          md: spacing.xl * 2,
          lg: spacing.xl * 3,
        },
        py: {
          xs: `${layout.fixedBarHeight.xs}px`,
          md: spacing.xl,
        },
      },
      inner: { ...general.fullWidth, maxWidth: 720 },
    },

    // ─── DRDO LOGO ────────────────────────────────────────────────────────────
    drdoLogo: {
      wrapper: {
        ...general.flexCenter,
        mb: { xs: spacing.md, md: spacing.lg },
      },
      badge: {
        height: {
          xs: "clamp(80px, 14vh, 18vh)",
          sm: "clamp(90px, 16vh, 20vh)",
          md: "clamp(100px, 18vh, 22vh)",
          lg: "clamp(110px, 20vh, 24vh)",
        },
        width: {
          xs: "clamp(80px, 14vh, 18vh)",
          sm: "clamp(90px, 16vh, 20vh)",
          md: "clamp(100px, 18vh, 22vh)",
          lg: "clamp(110px, 20vh, 24vh)",
        },
        bgcolor:    colors.overlay.logoBg,
        ...general.borderCircle,
        p:          { xs: spacing.md, md: spacing.md + 0.5 },
        ...general.noShrink,
      },
      img: { ...general.fullSize, ...general.objectCover, borderRadius: "50%" },
    },

    // ─── INTRO DETAIL LINES ───────────────────────────────────────────────────
    intro_details: {
      fontSize: {
        xs: "clamp(0.55rem, 1.2vw, 0.65rem)",
        sm: "clamp(0.6rem,  1.4vw, 0.7rem)",
        md: "clamp(0.65rem, 1.6vw, 0.75rem)",
        lg: "clamp(0.7rem,  1.8vw, 0.85rem)",
      },
      color:  m.textSecondary,
      mb:     { xs: spacing.xs, md: spacing.xs },
      ...general.textCenter,
    },

    // ─── TITLE ────────────────────────────────────────────────────────────────
    title: {
      fontWeight: fonts.weight.bold,
      fontSize: {
        xs: fonts.size.md,
        sm: fonts.size.lg,
        md: fonts.size["2xl"],
        lg: fonts.size["2xl"],
      },
      color:      m.textPrimary,
      lineHeight: fonts.lineHeight.tight,
      mb:         { xs: spacing.sm, md: spacing.sm + 0.5 },
      ...general.textCenter,
    },

    // ─── SUBTITLE ─────────────────────────────────────────────────────────────
    subtitle: {
      fontSize: {
        xs: "0.95rem",
        sm: fonts.size.md,
        md: "1.1rem",
        lg: fonts.size.lg,
      },
      color: m.textSecondary,
      mb:    { xs: spacing.xs, md: spacing.md },
      ...general.textCenter,
    },

    // ─── FEATURE CARDS ────────────────────────────────────────────────────────
    featureCard: {
      card: {
        mb:             { xs: spacing.sm + 0.5, md: spacing.md },
        p:              { xs: spacing.sm + 0.5, md: spacing.md },
        bgcolor:        m.featureOverlay,
        backdropFilter: layout.glass.backdropFilter,
        borderRadius:   "12px",
        transition:     layout.glass.transition,
        "&:hover": {
          bgcolor:   m.featureOverlayHover,
          transform: "translateX(8px)",
        },
      },
      title: {
        fontWeight: fonts.weight.medium,
        fontSize: {
          xs: "0.95rem",
          sm: fonts.size.md,
          md: "1.05rem",
          lg: fonts.size.md,
        },
        color: m.textPrimary,
        mb:    spacing.xs,
      },
      description: {
        fontSize:   { xs: "0.85rem", sm: "0.9rem", md: "0.95rem" },
        color:      m.textSecondary,
        lineHeight: fonts.lineHeight.normal,
      },
    },

    // ─── RIGHT PANEL ──────────────────────────────────────────────────────────
    rightPanel: {
      wrapper: {
        width:          { xs: "100%", md: "44%", lg: "42%", xl: "38%" },
        height:         { xs: "auto", md: "100vh" },
        ...general.flexCenter,
        flexDirection:  "column",
        alignItems:     "stretch",
        justifyContent: "center",
        pt: {
          xs: `clamp(16px, 3vh, 32px)`,
          md: `${layout.fixedBarHeight.md}px`,
        },
        pb: {
          xs: "clamp(72px, 10vh, 100px)",
          md: "80px",
        },
        px:  { xs: spacing.lg, md: spacing.xl * 1.5, lg: spacing.xl * 2 },
        ...general.noShrink,
        ...general.boxSizingBorder,
      },
    },

    // ─── LOGIN CARD ───────────────────────────────────────────────────────────
    loginCard: {
      card: {
        ...general.fullWidth,
        flex:            { xs: "none", md: 1 },
        minHeight:       { xs: "auto", md: 0 },
        borderRadius:    layout.cardBorderRadius,
        backgroundColor: m.cardBg,
        boxShadow:       m.cardShadow,
        display:         "flex",
        flexDirection:   "column",
        justifyContent:  "stretch",
        overflow:        "hidden",
        padding:         { xs: 1, md: 2, lg: 4 },
      },
      cardContent: {
        ...general.fullWidth,
        height:         { xs: "auto", md: "100%" },
        ...general.flexColumn,
        justifyContent: { xs: "flex-start", md: "space-evenly" },
        ...general.boxSizingBorder,
        px: {
          xs: `clamp(16px, 3vw,  ${spacing.lg}px)`,
          sm: `clamp(20px, 4vw,  ${spacing.xl}px)`,
          md: `clamp(24px, 4vw,  ${spacing.xl * 1.5}px)`,
        },
        py: {
          xs: `clamp(16px, 3vh, 24px)`,
          md: 0,
        },
        "&:last-child": {
          pb: { xs: `clamp(16px, 3vh, 24px)`, md: 0 },
        },
      },
    },

    // ─── CARD HEADING ─────────────────────────────────────────────────────────
    cardHeading: {
      wrapper: {
        mb: {
          xs: `clamp(12px, 2vh,   ${spacing.lg}px)`,
          md: `clamp(16px, 2.5vh, ${spacing.xl}px)`,
        },
        ...general.textCenter,
      },
      title: {
        fontSize: {
          xs: `clamp(1rem,   2vh,   ${fonts.size.md})`,
          md: `clamp(1.5rem, 2.2vh, 1.2rem)`,
        },
        fontWeight: fonts.weight.bold,
        color:      focusBorderColor,
        mb:         `clamp(4px, 0.6vh, ${spacing.xs}px)`,
        ...general.textCenter,
      },
      subtitle: {
        fontSize: `clamp(1rem, 1.5vh, ${fonts.size.sm})`,
        color:    m.cardAccent,
        ...general.textCenter,
      },
    },

    // ─── FORM ─────────────────────────────────────────────────────────────────
    form: {
      wrapper: {
        ...general.flexColumn,
        gap: {
          xs: `clamp(24px, 2vh,   ${spacing.lg}px)`,
          md: `clamp(30px, 2.5vh, ${spacing.xl}px)`,
        },
      },
    },

    // ─── ROLE DROPDOWN ────────────────────────────────────────────────────────
    // Shared dropdownSelectSx — identical to deptDropdown
    roleDropdown: {
      select: dropdownSelectSx,
    },

    // ─── DEPARTMENT DROPDOWN ──────────────────────────────────────────────────
    deptDropdown: {
      select: dropdownSelectSx,
    },

    // ─── INPUT FIELDS ─────────────────────────────────────────────────────────
    inputField: {
      sx: {
        "& .MuiInputBase-root": {
          height:   "clamp(40px, 6vh, 52px)",
          fontSize: "clamp(0.8rem, 1.6vh, 0.9rem)",
          ...(inputTextColor ? { color: inputTextColor } : {}),
        },
        "& .MuiInputLabel-root": {
          fontSize: "clamp(0.8rem, 1.6vh, 0.9rem)",
          ...(inputLabelColor ? { color: inputLabelColor } : {}),
          "&.Mui-focused": { color: focusBorderColor },
        },
        "& .MuiOutlinedInput-notchedOutline":              { borderColor: inputBorderColor },
        "&:hover .MuiOutlinedInput-notchedOutline":        { borderColor: inputBorderHoverColor },
        "& .Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: focusBorderColor },
        ...(mode === "dark" && {
          "& .MuiInputAdornment-root .MuiSvgIcon-root": {
            color: "rgba(240,242,248,0.55)",
          },
        }),
      },
    },

    // ─── LOGIN BUTTON ─────────────────────────────────────────────────────────
    loginButton: {
      sx: {
        height:   "clamp(44px, 6.5vh, 56px)",
        fontSize: "clamp(0.85rem, 1.6vh, 0.95rem)",
      },
    },

    // ─── FORGOT PASSWORD ──────────────────────────────────────────────────────
    forgotPassword: {
      fontSize:  `clamp(0.78rem, 1.5vh, ${fonts.size.sm})`,
      color:     focusBorderColor,
      ...general.textCenter,
      ...general.pointer,
      "&:hover": { textDecoration: "underline" },
    },

    // ─── INLINE RESET REQUEST ─────────────────────────────────────────────────
    resetForm: {
      topBar: {
        ...general.flexRow,
        alignItems: "flex-start",
        gap:        1,
        mb:         { xs: 1, md: 1.5 },
        ...general.fullWidth,
      },
      backButton: {
        mt:        0.25,
        ...general.noShrink,
        color:     focusBorderColor,
        "&:hover": {
          bgcolor: mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(27,79,114,0.08)",
        },
      },
      reasonField: {
        "& .MuiInputBase-root": {
          height:     "auto",
          minHeight:  "clamp(96px, 12vh, 140px)",
          alignItems: "flex-start",
          paddingTop: "10px",
        },
        "& textarea": { lineHeight: fonts.lineHeight.normal },
      },
      requestButton: {
        sx: {
          height:   "clamp(44px, 6.5vh, 56px)",
          fontSize: "clamp(0.85rem, 1.6vh, 0.95rem)",
          "&.Mui-disabled": { opacity: 0.55 },
        },
      },
    },

    // ─── CAPTCHA ──────────────────────────────────────────────────────────────
    captcha: {
      wrapper: {
        ...general.flexColumn,
        gap: `clamp(2px, 0.5vh, 6px)`,
      },
      row: {
        ...general.flexRow,
        alignItems: "flex-start",
        gap:        `clamp(6px, 1vh, 10px)`,
      },
      leftCol: {
        ...general.flexColumn,
        alignItems:  "center",
        ...general.noShrink,
      },
      imageBox: {
        width:        "clamp(100px, 11vw, 120px)",
        height:       "clamp(40px, 6vh, 52px)",
        borderRadius: "10px",
        border:       "1.5px solid",
        borderColor:  mode === "dark" ? "rgba(255,255,255,0.18)" : "divider",
        overflow:     "hidden",
        ...general.flexCenter,
        bgcolor:      mode === "dark" ? "rgba(255,255,255,0.06)" : colors.captcha.imageBg,
        ...general.noSelect,
      },
      imageBoxError:  { borderColor: "error.main" },
      image: {
        ...general.fullSize,
        objectFit: "fill",
        display:   "block",
      },
      imageErrorText: {
        px:         0.5,
        fontSize:   "clamp(0.55rem, 1vh, 0.65rem)",
        lineHeight: 1.3,
        ...general.textCenter,
        ...(mode === "dark" ? { color: "rgba(240,242,248,0.70)" } : {}),
      },
      reloadLink: {
        mt:         `clamp(2px, 0.4vh, 4px)`,
        ...general.flexRow,
        alignItems: "center",
        gap:        "3px",
        ...general.noSelect,
        transition: "opacity 0.2s",
        color:      mode === "dark" ? colors.primary.light : "primary.main",
        active:     { ...general.pointer, opacity: 1, "&:hover": { opacity: 0.75 } },
        inactive:   { cursor: "default", opacity: 0.45 },
      },
      reloadIcon: {
        fontSize: `clamp(11px, 1.6vh, 14px)`,
        spin: {
          animation: "captchaSpin 0.6s linear infinite",
          "@keyframes captchaSpin": {
            from: { transform: "rotate(0deg)" },
            to:   { transform: "rotate(360deg)" },
          },
        },
      },
      reloadText: {
        fontSize:   `clamp(0.62rem, 1.2vh, 0.75rem)`,
        lineHeight: 1,
        fontWeight: fonts.weight.medium,
      },
      rightCol: { ...general.flex1, ...general.flexColumn },
      input: {
        "& .MuiOutlinedInput-root": {
          borderRadius: "10px",
          height:       "clamp(40px, 6vh, 52px)",
          ...(inputTextColor ? { color: inputTextColor } : {}),
          "& .MuiInputBase-input": {
            height:        "clamp(40px, 6vh, 52px)",
            fontSize:      "clamp(0.8rem, 1.6vh, 0.9rem)",
            ...general.boxSizingBorder,
            letterSpacing: "0.15em",
            fontFamily:    fonts.family.monospace,
            ...(inputTextColor ? { color: inputTextColor } : {}),
          },
          "& .MuiOutlinedInput-notchedOutline":           { borderColor: inputBorderColor },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: focusBorderColor },
          "&:hover .MuiOutlinedInput-notchedOutline":     { borderColor: inputBorderHoverColor },
        },
      },
      inputLabel: {
        top:       "50%",
        left:      "14px",
        transform: "translateY(-50%)",
        fontSize:  "clamp(0.8rem, 1.6vh, 0.9rem)",
        ...(inputLabelColor ? { color: inputLabelColor } : {}),
        "&.MuiInputLabel-shrink": {
          top:       0,
          left:      0,
          transform: "translate(14px, -9px) scale(0.75)",
        },
      },
      successIcon: { color: "success.main", fontSize: `clamp(15px, 2.2vh, 18px)` },
      errorIcon:   { color: "error.main",   fontSize: `clamp(15px, 2.2vh, 18px)` },
      helperText: {
        mt:         `clamp(2px, 0.4vh, 4px)`,
        pl:         "2px",
        fontSize:   `clamp(0.65rem, 1.2vh, ${fonts.size.xs})`,
        lineHeight: fonts.lineHeight.normal,
        minHeight:  "1.1em",
        ...(mode === "dark" ? { color: "rgba(240,242,248,0.55)" } : {}),
      },
    },

    // ─── FOOTER ───────────────────────────────────────────────────────────────
    footer: {
      wrapper: {
        ...general.positionFixed,
        bottom:         0,
        left:           0,
        ...general.fullWidth,
        height:         { xs: 44, md: 52 },
        ...general.flexCenter,
        px:             { xs: spacing.md, md: spacing.lg },
        zIndex:         layout.zIndex.fixed,
        bgcolor:        m.footerBg,
        backdropFilter: layout.glass.backdropFilter,
        borderTop:      `1px solid ${m.footerBorder}`,
        ...general.boxSizingBorder,
      },
      drdoSlot: { ...general.flexRow, alignItems: "center", justifyContent: "flex-start" },
      drdoImg: {
        height:       { xs: 28, md: 34 },
        width:        { xs: 28, md: 34 },
        ...general.objectContain,
        borderRadius: "50%",
        bgcolor:      colors.overlay.logoBg,
      },
      copyrightContainer: {
        ...general.flexCenter,
        gridColumn: "1 / -1",
        ...general.fullWidth,
      },
      copyrightText: {
        fontSize:      { xs: fonts.size.xs, md: fonts.size.sm },
        color:         m.footerText,
        letterSpacing: "0.01em",
        ...general.textCenter,
        ...general.noWrap,
      },
      belSlot: { ...general.flexRow, alignItems: "center", justifyContent: "flex-end" },
      belImg:  { height: { xs: 28, md: 34 }, ...general.objectContain },
    },
  };
};

export default getLoginTheme;