export const POST_CURE_BRAND = {
  primary: "#1565C0",
  primaryLight: "#1976D2",
  accent: "#148F77",
  warn: "#D4AC0D",
  danger: "#C0392B",
  surface: "#F4F6F8",
  border: "#D5D8DC",
  text: "#1C2833",
  textSub: "#5D6D7E",
  pc: "#1565C0",
  pcLight: "#1976D2",
  ok: "#148F77",
  okBg: "rgba(20,143,119,0.08)",
  okBorder: "rgba(20,143,119,0.25)",
  notOk: "#C0392B",
  notOkBg: "rgba(192,57,43,0.06)",
  notOkBorder: "rgba(192,57,43,0.2)",
} as const;

export const getPostCureTheme = (baseTheme: any) => {
  const palette = baseTheme?.palette ?? {};
  return {
    brand: {
      ...POST_CURE_BRAND,
      primary: palette.primary ?? POST_CURE_BRAND.primary,
      primaryLight: palette.primaryLight ?? POST_CURE_BRAND.primaryLight,
      accent: palette.accent ?? POST_CURE_BRAND.accent,
      warn: palette.warn ?? POST_CURE_BRAND.warn,
      danger: palette.danger ?? POST_CURE_BRAND.danger,
      surface: palette.surface ?? POST_CURE_BRAND.surface,
      border: palette.border ?? POST_CURE_BRAND.border,
      text: palette.text ?? POST_CURE_BRAND.text,
      textSub: palette.textSub ?? POST_CURE_BRAND.textSub,
    },
  };
};

export default getPostCureTheme;
