// src/app/theme/custom_themes/user/manufacturing/dispatch_theme.ts

import { alpha } from "@mui/material/styles";

export const DISPATCH_BRAND = {
  primary: "#1B4F72",
  primaryLight: "#2E86C1",
  accent: "#148F77",
  warn: "#D4AC0D",
  danger: "#C0392B",

  surface: "#F4F6F8",
  border: "#D5D8DC",

  text: "#1C2833",
  textSub: "#5D6D7E",

  dispatch: "#1565C0",
  dispatchLight: "#1976D2",
} as const;

export const getDispatchTheme = (baseTheme: any) => {
  const palette = baseTheme?.palette ?? {};
  const accentColor =
    palette.primaryLight ?? DISPATCH_BRAND.dispatchLight;

  return {
    brand: {
      ...DISPATCH_BRAND,

      primary: palette.primary ?? DISPATCH_BRAND.primary,
      primaryLight:
        palette.primaryLight ?? DISPATCH_BRAND.primaryLight,
      accent: palette.accent ?? DISPATCH_BRAND.accent,
      warn: palette.warn ?? DISPATCH_BRAND.warn,
      danger: palette.danger ?? DISPATCH_BRAND.danger,
      surface: palette.surface ?? DISPATCH_BRAND.surface,
      border: palette.border ?? DISPATCH_BRAND.border,
      text: palette.text ?? DISPATCH_BRAND.text,
      textSub: palette.textSub ?? DISPATCH_BRAND.textSub,
    },

    flowBar: {
      container: {
        mb: 2,
        p: 1.5,
        borderRadius: 3,
        border: `1px solid ${alpha(
          palette.border ?? DISPATCH_BRAND.border,
          0.9
        )}`,
        background: alpha(
          palette.surface ?? DISPATCH_BRAND.surface,
          0.6
        ),
        ...baseTheme.workflow?.animatedContainer,
      },

      selectField: (width: number | string = "100%") => ({
        width,
        flexShrink: 0,
      }),

      selectLabel: {
        fontSize: "0.72rem",
        fontWeight: 700,
        color: DISPATCH_BRAND.dispatch,
        letterSpacing: "0.03em",
        mb: 0.65,
        display: "block",
      },

      selectInput: (hasValue: boolean) => ({
        "& .MuiOutlinedInput-root": {
          borderRadius: 2.5,
          background: palette.pageBg ?? "#fff",
          fontSize: "0.82rem",

          "& fieldset": {
            borderColor: alpha(
              palette.border ?? DISPATCH_BRAND.border,
              0.95
            ),
          },

          "&:hover fieldset": {
            borderColor: alpha(accentColor, 0.55),
          },

          "&.Mui-focused fieldset": {
            borderColor: accentColor,
            borderWidth: 2,
          },

          "&.Mui-disabled": {
            background: alpha(
              palette.surface ?? DISPATCH_BRAND.surface,
              0.8
            ),
          },
        },

        "& .MuiSelect-select": {
          fontWeight: hasValue ? 600 : 500,
          color: hasValue
            ? palette.text ?? DISPATCH_BRAND.text
            : palette.textSub ?? DISPATCH_BRAND.textSub,
          py: 1,
        },

        "& .MuiSelect-icon": {
          color: hasValue
            ? accentColor
            : alpha(
                palette.textSub ?? DISPATCH_BRAND.textSub,
                0.6
              ),
        },
      }),

      selectPlaceholder: {
        color: palette.textSub ?? DISPATCH_BRAND.textSub,
        fontSize: "0.82rem",
        fontWeight: 500,
      },

      selectMenuPaper: {
        borderRadius: 2.5,
        mt: 0.5,
        maxHeight: 320,
        boxShadow: `0 10px 28px ${alpha(
          DISPATCH_BRAND.dispatch,
          0.14
        )}`,
        border: `1px solid ${alpha(
          palette.border ?? DISPATCH_BRAND.border,
          0.85
        )}`,

        "& .MuiMenuItem-root": {
          fontSize: "0.82rem",
          py: 1,
          px: 1.5,
          borderRadius: 1.5,
          mx: 0.75,
          my: 0.25,
        },
      },

      menuItem: (selected: boolean) => ({
        fontWeight: selected ? 700 : 500,
        color: selected
          ? accentColor
          : palette.text ?? DISPATCH_BRAND.text,

        background: selected
          ? alpha(accentColor, 0.08)
          : "transparent",

        "&:hover": {
          background: alpha(accentColor, 0.1),
        },
      }),

      topRow: {
        display: "flex",
        flexWrap: "wrap",
        alignItems: "flex-start",
        gap: 2,
      },
    },

    details: {
      bannerStatusConfig: (() => {
        const primary =
          palette.primary ?? DISPATCH_BRAND.primary;

        const primaryLight =
          palette.primaryLight ??
          DISPATCH_BRAND.primaryLight;

        const success =
          palette.accent ?? DISPATCH_BRAND.accent;

        const danger =
          palette.danger ?? DISPATCH_BRAND.danger;

        const warn =
          palette.warn ?? DISPATCH_BRAND.warn;

        return {
          Initiated: {
            color: "#334155",
            bg: "#F8FAFC",
            border: "#CBD5E1",
          },

          "In Progress": {
            color: primary,
            bg: "#E8F4FC",
            border: alpha(primaryLight, 0.5),
          },

          "Waiting for Approval": {
            color: "#7D6608",
            bg: "#FFF4D6",
            border: warn,
          },

          Approved: {
            color: success,
            bg: "#E8F8F5",
            border: alpha(success, 0.5),
          },

          Rejected: {
            color: danger,
            bg: "#FDEDEC",
            border: alpha(danger, 0.5),
          },
        };
      })(),

      page: {
        animation: "fadeIn 0.35s ease both",
      },

      document: {
        borderRadius: 3,
        border: `1px solid ${
          palette.border ?? DISPATCH_BRAND.border
        }`,
        boxShadow: `0 4px 24px ${alpha(
          palette.primary ?? DISPATCH_BRAND.primary,
          0.08
        )}`,
        overflow: "hidden",
        background: palette.pageBg ?? "#fff",
      },

      banner: {
        p: "18px 24px",
        background: `linear-gradient(
          135deg,
          ${palette.primary ?? DISPATCH_BRAND.primary},
          ${
            palette.primaryLight ??
            DISPATCH_BRAND.primaryLight
          }
        )`,
        color: "#fff",
      },

      bannerIcon: {
        fontSize: 28,
        color: "#fff",
        opacity: 0.95,
      },

      bannerTitle: {
        fontWeight: 800,
        fontSize: "1.05rem",
        color: "#fff",
      },

      bannerSubtitle: {
        fontSize: "0.78rem",
        color: alpha("#fff", 0.78),
        mt: 0.35,
      },

      body: {
        p: { xs: 2, sm: 3 },
        background:
          palette.surface ?? palette.pageBg,
      },

      section: {
        mb: 3,
        p: 2,
        borderRadius: 2,
        border: `1px solid ${alpha(
          palette.border ?? DISPATCH_BRAND.border,
          0.65
        )}`,
        background: palette.pageBg ?? "#fff",
      },

      sectionTitle: {
        fontSize: "0.72rem",
        fontWeight: 800,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color:
          palette.primaryLight ??
          DISPATCH_BRAND.primaryLight,
        mb: 1.5,
      },

      emptyText: {
        fontSize: "0.85rem",
        color:
          palette.textSub ?? DISPATCH_BRAND.textSub,
        textAlign: "center",
        py: 4,
      },

      loadingBox: {
        minHeight: 320,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 1.5,
      },
    },
  };
};

export default getDispatchTheme;