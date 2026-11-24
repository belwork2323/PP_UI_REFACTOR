import colors from "../../colors";
import fonts from "../../fonts";
import spacing from "../../spacing";
import general from "../common/common_css_theme";
import type { AuthModeTokens } from "./auth_shell_theme";

const optionalColor = (color: string) => (color ? { color } : {});

const optionalFill = (color: string) =>
  color ? { color, WebkitTextFillColor: color } : {};

/** Fields, captcha, and form layout shared by the auth screens. */
export const createAuthFormTheme = (m: AuthModeTokens) => {
  // Fill sits on the outlined input so it uses the same radius as the border.
  // A background on the TextField root uses a larger radius and the outline no longer fits.
  const outlinedSurfaceSx = {
    backgroundColor: m.cardBg,
    ...optionalColor(m.inputText),
    "& .MuiOutlinedInput-notchedOutline": { borderColor: m.inputBorder },
    "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: m.inputBorderHover },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: m.focusBorder },
    "& input:-webkit-autofill, & input:-webkit-autofill:hover, & input:-webkit-autofill:focus": {
      WebkitBoxShadow: `0 0 0 100px ${m.cardBg} inset`,
      ...(m.inputText ? { WebkitTextFillColor: m.inputText, caretColor: m.inputText } : {}),
    },
  };

  const sharedFieldSx = {
    "& .MuiInputLabel-root": {
      fontSize: fonts.responsive.inputLabel,
      fontWeight: fonts.weight.medium,
      ...optionalColor(m.inputLabel),
      "&.Mui-focused": { color: m.focusBorder },
    },
    "& .MuiOutlinedInput-root": {
      height: "clamp(40px, 6vh, 52px)",
      ...outlinedSurfaceSx,
    },
  };

  const dropdownSelectSx = {
    ...sharedFieldSx,
    "& .MuiSelect-select": {
      display: "flex",
      alignItems: "center",
      justifyContent: "flex-start",
      height: "100%",
      padding: "0 14px",
      fontSize: fonts.responsive.inputLabel,
      ...optionalColor(m.inputText),
      ...general.boxSizingBorder,
    },
    ...(m.inputIcon ? { "& .MuiSvgIcon-root": { color: m.inputIcon } } : {}),
  };

  const authButtonSx = {
    height: "clamp(44px, 6.5vh, 56px)",
    fontSize: fonts.responsive.button,
    backgroundColor: m.focusBorder,
    color: colors.white.full,
    "&:hover": { backgroundColor: colors.primary.dark },
    "&.Mui-disabled": {
      backgroundColor: m.focusBorder,
      color: colors.white.full,
      opacity: 0.55,
    },
  };

  return {
    form: {
      wrapper: {
        ...general.flexColumn,
        gap: {
          xs: `clamp(24px, 2vh,   ${spacing.lg}px)`,
          md: `clamp(30px, 2.5vh, ${spacing.xl}px)`,
        },
      },
    },

    dropdown: {
      select: dropdownSelectSx,
      menu: {
        bgcolor: m.cardBg,
        "& .MuiMenuItem-root": optionalFill(m.inputText),
      },
    },

    inputField: {
      sx: {
        "& .MuiInputBase-root": {
          height: "clamp(40px, 6vh, 52px)",
          fontSize: fonts.responsive.inputLabel,
          ...outlinedSurfaceSx,
        },
        "& .MuiInputLabel-root": {
          fontSize: fonts.responsive.inputLabel,
          ...optionalColor(m.inputLabel),
          "&.Mui-focused": { color: m.focusBorder },
        },
        ...(m.inputAdornmentIcon
          ? {
              "& .MuiInputAdornment-root .MuiSvgIcon-root": {
                color: m.inputAdornmentIcon,
              },
            }
          : {}),
      },
    },

    loginButton: {
      sx: authButtonSx,
    },

    forgotPassword: {
      fontSize: fonts.responsive.link,
      color: m.focusBorder,
      ...general.textCenter,
      ...general.pointer,
      "&:hover": { textDecoration: "underline" },
    },

    lookupRow: {
      ...general.flexRow,
      alignItems: "center",
      gap: 1.5,
      py: 0.5,
    },

    lookupText: {
      fontSize: "0.8rem",
      color: "text.secondary",
    },

    resetForm: {
      topBar: {
        ...general.flexRow,
        alignItems: "flex-start",
        gap: 1,
        mb: { xs: 1, md: 1.5 },
        ...general.fullWidth,
      },
      backButton: {
        mt: 0.25,
        ...general.noShrink,
        color: m.focusBorder,
        "&:hover": { bgcolor: m.backButtonHoverBg },
      },
      reasonField: {
        "& .MuiInputBase-root": {
          height: "auto",
          minHeight: "clamp(96px, 12vh, 140px)",
          alignItems: "flex-start",
          paddingTop: "10px",
          ...outlinedSurfaceSx,
          ...optionalFill(m.inputText),
        },
        "& textarea": {
          lineHeight: fonts.lineHeight.normal,
          ...optionalFill(m.inputText),
        },
      },
      actions: {
        ...general.flexColumn,
        gap: 1.5,
      },
      requestButton: {
        sx: authButtonSx,
      },
    },

    changePassword: {
      actions: {
        ...general.flexColumn,
        gap: 1.5,
        mt: 1,
      },
    },

    captcha: {
      wrapper: {
        ...general.flexColumn,
        gap: "clamp(2px, 0.5vh, 6px)",
      },
      row: {
        ...general.flexRow,
        alignItems: "flex-start",
        gap: "clamp(6px, 1vh, 10px)",
      },
      leftCol: {
        ...general.flexColumn,
        alignItems: "center",
        ...general.noShrink,
      },
      imageBox: {
        width: "clamp(100px, 11vw, 120px)",
        height: "clamp(40px, 6vh, 52px)",
        borderRadius: "10px",
        border: "1.5px solid",
        borderColor: m.captchaBorder,
        overflow: "hidden",
        ...general.flexCenter,
        bgcolor: m.captchaBg,
        ...general.noSelect,
      },
      imageBoxError: { borderColor: "error.main" },
      image: {
        ...general.fullSize,
        objectFit: "fill",
        display: "block",
      },
      imageErrorText: {
        px: 0.5,
        fontSize: fonts.responsive.captchaError,
        lineHeight: 1.3,
        ...general.textCenter,
        ...optionalColor(m.captchaErrorText),
      },
      reloadLink: {
        mt: "clamp(2px, 0.4vh, 4px)",
        ...general.flexRow,
        alignItems: "center",
        gap: "3px",
        ...general.noSelect,
        transition: "opacity 0.2s",
        color: m.captchaReloadColor,
        active: { ...general.pointer, opacity: 1, "&:hover": { opacity: 0.75 } },
        inactive: { cursor: "default", opacity: 0.45 },
      },
      reloadIcon: {
        fontSize: "clamp(11px, 1.6vh, 14px)",
        spin: {
          animation: "captchaSpin 0.6s linear infinite",
          "@keyframes captchaSpin": {
            from: { transform: "rotate(0deg)" },
            to: { transform: "rotate(360deg)" },
          },
        },
      },
      reloadText: {
        fontSize: fonts.responsive.reload,
        lineHeight: 1,
        fontWeight: fonts.weight.medium,
      },
      rightCol: { ...general.flex1, ...general.flexColumn },
      input: {
        "& .MuiOutlinedInput-root": {
          borderRadius: "10px",
          height: "clamp(40px, 6vh, 52px)",
          ...optionalColor(m.inputText),
          "& .MuiInputBase-input": {
            height: "clamp(40px, 6vh, 52px)",
            fontSize: fonts.responsive.inputLabel,
            ...general.boxSizingBorder,
            letterSpacing: "0.15em",
            fontFamily: fonts.family.monospace,
            ...optionalColor(m.inputText),
          },
          "& .MuiOutlinedInput-notchedOutline": { borderColor: m.inputBorder },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: m.focusBorder },
          "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: m.inputBorderHover },
        },
      },
      inputLabel: {
        top: "50%",
        left: "14px",
        transform: "translateY(-50%)",
        fontSize: fonts.responsive.inputLabel,
        ...optionalColor(m.inputLabel),
        "&.MuiInputLabel-shrink": {
          top: 0,
          left: 0,
          transform: "translate(14px, -9px) scale(0.75)",
        },
      },
      successIcon: { color: "success.main", fontSize: "clamp(15px, 2.2vh, 18px)" },
      errorIcon: { color: "error.main", fontSize: "clamp(15px, 2.2vh, 18px)" },
    },
  };
};
