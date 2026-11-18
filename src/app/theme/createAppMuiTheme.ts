import { createTheme } from "@mui/material/styles";
import fonts from "./fonts";
import colors from "./colors";
import type { ThemeMode } from "./tokens";

/**
 * MUI ThemeProvider must match the app light/dark toggle.
 * Custom page palettes alone are not enough — OutlinedInput still uses
 * `theme.palette.text.primary` / `-webkit-text-fill-color` from this theme.
 */
export const createAppMuiTheme = (mode: ThemeMode = "light") =>
  createTheme({
    palette: {
      mode,
      primary: colors.primary,
      secondary: colors.secondary,
      ...(mode === "dark"
        ? {
            background: {
              default: "#0f1117",
              paper: "#1a1d27",
            },
            text: {
              primary: "#f0f2f8",
              secondary: "rgba(240,242,248,0.55)",
              disabled: "rgba(240,242,248,0.30)",
            },
            divider: "rgba(255,255,255,0.12)",
            action: {
              active: "#f0f2f8",
              hover: "rgba(255,255,255,0.08)",
              selected: "rgba(255,255,255,0.12)",
              disabled: "rgba(240,242,248,0.30)",
              disabledBackground: "rgba(255,255,255,0.08)",
            },
          }
        : {}),
    },
    typography: {
      fontFamily: fonts.family.primary,
      fontWeightLight: fonts.weight.light,
      fontWeightRegular: fonts.weight.regular,
      fontWeightMedium: fonts.weight.medium,
      fontWeightBold: fonts.weight.bold,
      h1: { fontSize: fonts.size["5xl"], lineHeight: fonts.lineHeight.tight },
      h2: { fontSize: fonts.size["4xl"], lineHeight: fonts.lineHeight.tight },
      h3: { fontSize: fonts.size["3xl"], lineHeight: fonts.lineHeight.tight },
      h4: { fontSize: fonts.size["2xl"], lineHeight: fonts.lineHeight.tight },
      body1: { fontSize: fonts.size.md, lineHeight: fonts.lineHeight.normal },
      body2: { fontSize: fonts.size.sm, lineHeight: fonts.lineHeight.normal },
    },
    components: {
      MuiOutlinedInput: {
        styleOverrides: {
          input: {
            // Beat UA / autofill near-black fill when palette.mode is dark.
            ...(mode === "dark"
              ? {
                  color: "#f0f2f8",
                  WebkitTextFillColor: "#f0f2f8",
                  caretColor: "#f0f2f8",
                  "&::placeholder": {
                    color: "rgba(240,242,248,0.65)",
                    WebkitTextFillColor: "rgba(240,242,248,0.65)",
                    opacity: 1,
                  },
                }
              : {}),
          },
        },
      },
      MuiInputBase: {
        styleOverrides: {
          input: {
            ...(mode === "dark"
              ? {
                  color: "#f0f2f8",
                  WebkitTextFillColor: "#f0f2f8",
                  "&::placeholder": {
                    color: "rgba(240,242,248,0.65)",
                    WebkitTextFillColor: "rgba(240,242,248,0.65)",
                    opacity: 1,
                  },
                }
              : {}),
          },
        },
      },
    },
  });

export default createAppMuiTheme;
