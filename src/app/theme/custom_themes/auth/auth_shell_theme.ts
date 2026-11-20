import colors from "../../colors";
import fonts from "../../fonts";
import spacing from "../../spacing";
import layout from "../../layout";
import general from "../common/common_css_theme";

export type AuthModeTokens = (typeof colors.modes)["light"];

/** Page chrome shared by login, forgot-password, and change-password. */
export const createAuthShellTheme = (m: AuthModeTokens) => ({
  page: {
    background: m.pageBg,
    width: "100vw",
    height: { xs: "auto", md: "100vh" },
    minHeight: { xs: "100vh", md: "unset" },
    overflow: { xs: "visible", md: "hidden" },
    ...general.flexRow,
    flexDirection: { xs: "column", md: "row" },
    ...general.positionRelative,
  },

  toggleButton: {
    wrapper: {
      ...general.positionFixed,
      top: 16,
      left: 16,
      zIndex: layout.zIndex.fixed,
    },
    root: {
      width: 44,
      height: 44,
      bgcolor: m.toggleBg,
      backdropFilter: layout.glass.backdropFilter,
      ...general.borderCircle,
      "&:hover": { bgcolor: m.toggleBgHover },
    },
    icon: { color: m.toggleIcon },
  },

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
      top: 0,
      right: 0,
      ...general.positionFixed,
      p: { xs: spacing.sm, md: spacing.md },
      zIndex: layout.zIndex.fixed,
    },
    img: { ...general.fullSize, ...general.objectContain },
  },

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

  drdoLogo: {
    wrapper: {
      ...general.flexCenter,
      mb: { xs: spacing.md, md: spacing.lg },
    },
    badge: {
      height: {
        xs: "clamp(100px, 18vh, 22vh)",
        sm: "clamp(112px, 20vh, 25vh)",
        md: "clamp(125px, 22vh, 28vh)",
        lg: "clamp(138px, 25vh, 30vh)",
      },
      width: {
        xs: "clamp(100px, 18vh, 22vh)",
        sm: "clamp(112px, 20vh, 25vh)",
        md: "clamp(125px, 22vh, 28vh)",
        lg: "clamp(138px, 25vh, 30vh)",
      },
      bgcolor: colors.overlay.logoBg,
      ...general.borderCircle,
      p: { xs: spacing.md, md: spacing.md + 0.5 },
      ...general.noShrink,
    },
    img: { ...general.fullSize, ...general.objectCover, borderRadius: "50%" },
  },

  intro_details: {
    fontSize: {
      xs: fonts.responsive.caption,
      sm: `clamp(0.6rem, 1.4vw, ${fonts.size.tight})`,
      md: `clamp(0.65rem, 1.6vw, ${fonts.size.xs})`,
      lg: `clamp(0.7rem, 1.8vw, ${fonts.size.base})`,
    },
    color: m.textSecondary,
    mb: { xs: spacing.xs, md: spacing.xs },
    ...general.textCenter,
  },

  title: {
    fontWeight: fonts.weight.bold,
    fontSize: {
      xs: fonts.size.md,
      sm: fonts.size.lg,
      md: fonts.size["2xl"],
      lg: fonts.size["2xl"],
    },
    color: m.textPrimary,
    lineHeight: fonts.lineHeight.tight,
    mb: { xs: spacing.sm, md: spacing.sm + 0.5 },
    ...general.textCenter,
  },

  subtitle: {
    fontSize: {
      xs: fonts.size.input,
      sm: fonts.size.md,
      md: "1.1rem",
      lg: fonts.size.lg,
    },
    color: m.textSecondary,
    mb: { xs: spacing.xs, md: spacing.md },
    ...general.textCenter,
  },

  featureCard: {
    card: {
      mb: { xs: spacing.sm + 0.5, md: spacing.md },
      p: { xs: spacing.sm + 0.5, md: spacing.md },
      bgcolor: m.featureOverlay,
      backdropFilter: layout.glass.backdropFilter,
      borderRadius: "12px",
      transition: layout.glass.transition,
      "&:hover": {
        bgcolor: m.featureOverlayHover,
        transform: "translateX(8px)",
      },
    },
    title: {
      fontWeight: fonts.weight.medium,
      fontSize: {
        xs: fonts.size.input,
        sm: fonts.size.md,
        md: "1.05rem",
        lg: fonts.size.md,
      },
      color: m.textPrimary,
      mb: spacing.xs,
    },
    description: {
      fontSize: { xs: fonts.size.base, sm: fonts.size.input, md: fonts.size.input },
      color: m.textSecondary,
      lineHeight: fonts.lineHeight.normal,
    },
  },

  rightPanel: {
    wrapper: {
      width: { xs: "100%", md: "44%", lg: "42%", xl: "38%" },
      height: { xs: "auto", md: "100vh" },
      ...general.flexCenter,
      flexDirection: "column",
      alignItems: "stretch",
      justifyContent: "center",
      pt: {
        xs: "clamp(16px, 3vh, 32px)",
        md: `${layout.fixedBarHeight.md}px`,
      },
      pb: {
        xs: "clamp(72px, 10vh, 100px)",
        md: "80px",
      },
      px: { xs: spacing.lg, md: spacing.xl * 1.5, lg: spacing.xl * 2 },
      ...general.noShrink,
      ...general.boxSizingBorder,
    },
  },

  alertAnchor: {
    ...general.positionRelative,
  },

  loginCard: {
    card: {
      ...general.fullWidth,
      flex: { xs: "none", md: 1 },
      minHeight: { xs: "auto", md: 0 },
      borderRadius: layout.cardBorderRadius,
      backgroundColor: m.cardBg,
      boxShadow: m.cardShadow,
      display: "flex",
      flexDirection: "column",
      justifyContent: "stretch",
      overflow: "hidden",
      padding: { xs: 1, md: 2, lg: 4 },
    },
    cardContent: {
      ...general.fullWidth,
      height: { xs: "auto", md: "100%" },
      ...general.flexColumn,
      justifyContent: { xs: "flex-start", md: "space-evenly" },
      ...general.boxSizingBorder,
      px: {
        xs: `clamp(16px, 3vw,  ${spacing.lg}px)`,
        sm: `clamp(20px, 4vw,  ${spacing.xl}px)`,
        md: `clamp(24px, 4vw,  ${spacing.xl * 1.5}px)`,
      },
      py: {
        xs: "clamp(16px, 3vh, 24px)",
        md: 0,
      },
      "&:last-child": {
        pb: { xs: "clamp(16px, 3vh, 24px)", md: 0 },
      },
    },
  },

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
        xs: fonts.responsive.cardTitle,
        md: `clamp(1.5rem, 2.2vh, ${fonts.size.lg})`,
      },
      fontWeight: fonts.weight.bold,
      color: m.focusBorder,
      mb: `clamp(4px, 0.6vh, ${spacing.xs}px)`,
      ...general.textCenter,
    },
    subtitle: {
      fontSize: fonts.responsive.cardSubtitle,
      color: m.cardAccent,
      ...general.textCenter,
    },
  },

  footer: {
    wrapper: {
      ...general.positionFixed,
      bottom: 0,
      left: 0,
      ...general.fullWidth,
      height: { xs: 44, md: 52 },
      ...general.flexCenter,
      px: { xs: spacing.md, md: spacing.lg },
      zIndex: layout.zIndex.fixed,
      bgcolor: m.footerBg,
      backdropFilter: layout.glass.backdropFilter,
      borderTop: `1px solid ${m.footerBorder}`,
      ...general.boxSizingBorder,
    },
    copyrightContainer: {
      ...general.flexCenter,
      gridColumn: "1 / -1",
      ...general.fullWidth,
    },
    copyrightText: {
      fontSize: { xs: fonts.size.xs, md: fonts.size.sm },
      color: m.footerText,
      letterSpacing: "0.01em",
      ...general.textCenter,
      ...general.noWrap,
    },
  },
});
