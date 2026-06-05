export const CASE_PREP_BRAND = {
	primary: "#1B4F72",
	primaryLight: "#2E86C1",
	accent: "#148F77",
	warn: "#D4AC0D",
	danger: "#C0392B",
	ok: "#1B5E20",
	okBg: "rgba(27,94,32,0.08)",
	okBorder: "rgba(27,94,32,0.25)",
	notOk: "#B71C1C",
	notOkBg: "rgba(183,28,28,0.08)",
	notOkBorder: "rgba(183,28,28,0.25)",
	surface: "#F4F6F8",
	border: "#D5D8DC",
	text: "#1C2833",
	textSub: "#5D6D7E",
	cp: "#1565C0",
	cpLight: "#1976D2",
} as const;

export const getCasePreparationTheme = (baseTheme: any) => {
	const palette = baseTheme?.palette ?? {};
	return {
		brand: {
			...CASE_PREP_BRAND,
			primary: palette.primary ?? CASE_PREP_BRAND.primary,
			primaryLight: palette.primaryLight ?? CASE_PREP_BRAND.primaryLight,
			accent: palette.accent ?? CASE_PREP_BRAND.accent,
			warn: palette.warn ?? CASE_PREP_BRAND.warn,
			danger: palette.danger ?? CASE_PREP_BRAND.danger,
			surface: palette.surface ?? CASE_PREP_BRAND.surface,
			border: palette.border ?? CASE_PREP_BRAND.border,
			text: palette.text ?? CASE_PREP_BRAND.text,
			textSub: palette.textSub ?? CASE_PREP_BRAND.textSub,
		},
	};
};

export default getCasePreparationTheme;
