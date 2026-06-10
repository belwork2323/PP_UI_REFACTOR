import { alpha } from "@mui/material/styles";

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
	const accentColor = palette.primaryLight ?? CASE_PREP_BRAND.cpLight;

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
		flowBar: {
			container: {
				mb: 2,
				p: 1.5,
				borderRadius: 3,
				border: `1px solid ${alpha(palette.border ?? CASE_PREP_BRAND.border, 0.9)}`,
				background: alpha(palette.surface ?? CASE_PREP_BRAND.surface, 0.6),
				...baseTheme.workflow?.animatedContainer,
			},
			selectField: (width: number | string = "100%") => ({
				width,
				flexShrink: 0,
			}),
			selectLabel: {
				fontSize: "0.72rem",
				fontWeight: 700,
				color: CASE_PREP_BRAND.cp,
				letterSpacing: "0.03em",
				mb: 0.65,
				display: "block",
			},
			selectInput: (hasValue: boolean) => ({
				"& .MuiOutlinedInput-root": {
					borderRadius: 2.5,
					background: palette.pageBg ?? "#fff",
					fontSize: "0.82rem",
					transition: "all 0.2s ease",
					"& fieldset": {
						borderColor: alpha(palette.border ?? CASE_PREP_BRAND.border, 0.95),
					},
					"&:hover fieldset": {
						borderColor: alpha(accentColor, 0.55),
					},
					"&.Mui-focused fieldset": {
						borderColor: accentColor,
						borderWidth: 2,
					},
					"&.Mui-disabled": {
						background: alpha(palette.surface ?? CASE_PREP_BRAND.surface, 0.8),
					},
				},
				"& .MuiSelect-select": {
					fontWeight: hasValue ? 600 : 500,
					color: hasValue ? palette.text ?? CASE_PREP_BRAND.text : palette.textSub ?? CASE_PREP_BRAND.textSub,
					py: 1,
				},
				"& .MuiSelect-icon": {
					color: hasValue ? accentColor : alpha(palette.textSub ?? CASE_PREP_BRAND.textSub, 0.6),
				},
			}),
			selectPlaceholder: {
				color: palette.textSub ?? CASE_PREP_BRAND.textSub,
				fontSize: "0.82rem",
				fontWeight: 500,
			},
			selectMenuPaper: {
				borderRadius: 2.5,
				mt: 0.5,
				maxHeight: 320,
				boxShadow: `0 10px 28px ${alpha(CASE_PREP_BRAND.cp, 0.14)}`,
				border: `1px solid ${alpha(palette.border ?? CASE_PREP_BRAND.border, 0.85)}`,
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
				color: selected ? accentColor : palette.text ?? CASE_PREP_BRAND.text,
				background: selected ? alpha(accentColor, 0.08) : "transparent",
				"&:hover": { background: alpha(accentColor, 0.1) },
			}),
			topRow: {
				display: "flex",
				flexWrap: "wrap",
				alignItems: "flex-start",
				gap: 2,
			},
			motorSelectorBox: {
				p: "14px 18px",
				borderRadius: 3,
				background: `linear-gradient(135deg, ${alpha(CASE_PREP_BRAND.cp, 0.04)}, ${alpha(CASE_PREP_BRAND.cpLight, 0.03)})`,
				border: `1.5px dashed ${alpha(CASE_PREP_BRAND.cpLight, 0.35)}`,
			},
		},
	};
};

export default getCasePreparationTheme;
