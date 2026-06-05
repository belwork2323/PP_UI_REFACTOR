export const MIXING_BRAND = {
  primary: "#1B4F72",
  primaryLight: "#2E86C1",
  accent: "#148F77",
  warn: "#D4AC0D",
  danger: "#C0392B",
  surface: "#F4F6F8",
  border: "#D5D8DC",
  text: "#1C2833",
  textSub: "#5D6D7E",
  mx: "#1565C0",
  mxLight: "#1976D2",
} as const;

export const getMixingTheme = (baseTheme: any) => {
  const palette = baseTheme?.palette ?? {};
  return {
    brand: {
      ...MIXING_BRAND,
      primary: palette.primary ?? MIXING_BRAND.primary,
      primaryLight: palette.primaryLight ?? MIXING_BRAND.primaryLight,
      accent: palette.accent ?? MIXING_BRAND.accent,
      warn: palette.warn ?? MIXING_BRAND.warn,
      danger: palette.danger ?? MIXING_BRAND.danger,
      surface: palette.surface ?? MIXING_BRAND.surface,
      border: palette.border ?? MIXING_BRAND.border,
      text: palette.text ?? MIXING_BRAND.text,
      textSub: palette.textSub ?? MIXING_BRAND.textSub,
    },
  };
};

export default getMixingTheme;
