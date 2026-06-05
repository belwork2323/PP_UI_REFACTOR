export const CASTING_CURING_BRAND = {
  primary: "#1565C0",
  primaryLight: "#1976D2",
  accent: "#148F77",
  warn: "#D4AC0D",
  danger: "#C0392B",
  surface: "#F4F6F8",
  border: "#D5D8DC",
  text: "#1C2833",
  textSub: "#5D6D7E",
  cc: "#1565C0",
  ccLight: "#1976D2",
} as const;

export const getCastingAndCuringTheme = (baseTheme: any) => {
  const palette = baseTheme?.palette ?? {};
  return {
    brand: {
      ...CASTING_CURING_BRAND,
      primary: palette.primary ?? CASTING_CURING_BRAND.primary,
      primaryLight: palette.primaryLight ?? CASTING_CURING_BRAND.primaryLight,
      accent: palette.accent ?? CASTING_CURING_BRAND.accent,
      warn: palette.warn ?? CASTING_CURING_BRAND.warn,
      danger: palette.danger ?? CASTING_CURING_BRAND.danger,
      surface: palette.surface ?? CASTING_CURING_BRAND.surface,
      border: palette.border ?? CASTING_CURING_BRAND.border,
      text: palette.text ?? CASTING_CURING_BRAND.text,
      textSub: palette.textSub ?? CASTING_CURING_BRAND.textSub,
    },
  };
};

export default getCastingAndCuringTheme;
