
import { alpha } from "@mui/material/styles";
export const TRIMMING_BRAND = {
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
  tr: "#6A1B9A",
  trLight: "#8E24AA",
  
} as const;

export const getTrimmingTheme = (baseTheme: any) => {
  const palette = baseTheme?.palette ?? {};
	const accentColor = palette.primaryLight ?? TRIMMING_BRAND.trLight;

	return {
		brand: {
			...TRIMMING_BRAND,
			primary: palette.primary ?? TRIMMING_BRAND.primary,
			primaryLight: palette.primaryLight ?? TRIMMING_BRAND.primaryLight,
			accent: palette.accent ?? TRIMMING_BRAND.accent,
			warn: palette.warn ?? TRIMMING_BRAND.warn,
			danger: palette.danger ?? TRIMMING_BRAND.danger,
			surface: palette.surface ?? TRIMMING_BRAND.surface,
			border: palette.border ?? TRIMMING_BRAND.border,
			text: palette.text ?? TRIMMING_BRAND.text,
			textSub: palette.textSub ?? TRIMMING_BRAND.textSub,
		},
		flowBar: {
			container: {
				mb: 2,
				p: 1.5,
				borderRadius: 3,
				border: `1px solid ${alpha(palette.border ?? TRIMMING_BRAND.border, 0.9)}`,
				background: alpha(palette.surface ?? TRIMMING_BRAND.surface, 0.6),
				...baseTheme.workflow?.animatedContainer,
			},
			selectField: (width: number | string = "100%") => ({
				width,
				flexShrink: 0,
			}),
			selectLabel: {
				fontSize: "0.72rem",
				fontWeight: 700,
				color: TRIMMING_BRAND.tr,
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
						borderColor: alpha(palette.border ?? TRIMMING_BRAND.border, 0.95),
					},
					"&:hover fieldset": {
						borderColor: alpha(accentColor, 0.55),
					},
					"&.Mui-focused fieldset": {
						borderColor: accentColor,
						borderWidth: 2,
					},
					"&.Mui-disabled": {
						background: alpha(palette.surface ?? TRIMMING_BRAND.surface, 0.8),
					},
				},
				"& .MuiSelect-select": {
					fontWeight: hasValue ? 600 : 500,
					color: hasValue ? palette.text ?? TRIMMING_BRAND.text : palette.textSub ?? TRIMMING_BRAND.textSub,
					py: 1,
				},
				"& .MuiSelect-icon": {
					color: hasValue ? accentColor : alpha(palette.textSub ?? TRIMMING_BRAND.textSub, 0.6),
				},
			}),
			selectPlaceholder: {
				color: palette.textSub ?? TRIMMING_BRAND.textSub,
				fontSize: "0.82rem",
				fontWeight: 500,
			},
			selectMenuPaper: {
				borderRadius: 2.5,
				mt: 0.5,
				maxHeight: 320,
				boxShadow: `0 10px 28px ${alpha(TRIMMING_BRAND.tr, 0.14)}`,
				border: `1px solid ${alpha(palette.border ?? TRIMMING_BRAND.border, 0.85)}`,
				"& .MuiMenuItem-root": {
					fontSize: "0.82rem",
					py: 1,
					px: 1.5,
					borderRadius: 1.5,
					tr: 0.75,
					my: 0.25,
				},
			},
			menuItem: (selected: boolean) => ({
				fontWeight: selected ? 700 : 500,
				color: selected ? accentColor : palette.text ?? TRIMMING_BRAND.text,
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
				background: `linear-gradient(135deg, ${alpha(TRIMMING_BRAND.tr, 0.04)}, ${alpha(TRIMMING_BRAND.trLight, 0.03)})`,
				border: `1.5px dashed ${alpha(TRIMMING_BRAND.trLight, 0.35)}`,
			},
		},
		details: {
			bannerStatusConfig: (() => {
				const primary = palette.primary ?? TRIMMING_BRAND.primary;
				const primaryLight = palette.primaryLight ?? TRIMMING_BRAND.primaryLight;
				const success = palette.accent ?? TRIMMING_BRAND.accent;
				const danger = palette.danger ?? TRIMMING_BRAND.danger;
				const warnBase = palette.warn ?? TRIMMING_BRAND.warn;
				return {
					["Initiated"]: { color: "#334155", bg: "#F8FAFC", border: "#CBD5E1" },
					["In Progress"]: { color: primary, bg: "#E8F4FC", border: alpha(primaryLight, 0.5) },
					["Waiting for Approval"]: { color: "#7D6608", bg: "#FFF4D6", border: warnBase },
					["Approved"]: { color: success, bg: "#E8F8F5", border: alpha(success, 0.5) },
					["Rejected"]: { color: danger, bg: "#FDEDEC", border: alpha(danger, 0.5) },
				} as Record<string, { color: string; bg: string; border: string }>;
			})(),
			page: { animation: "fadeIn 0.35s ease both" },
			document: {
				borderRadius: 3,
				border: `1px solid ${palette.border ?? TRIMMING_BRAND.border}`,
				boxShadow: `0 4px 24px ${alpha(palette.primary ?? TRIMMING_BRAND.primary, 0.08)}`,
				overflow: "hidden",
				background: palette.pageBg ?? "#fff",
			},
			banner: {
				p: "18px 24px",
				background: `linear-gradient(135deg, ${palette.primary ?? TRIMMING_BRAND.primary}, ${palette.primaryLight ?? TRIMMING_BRAND.primaryLight})`,
				color: "#fff",
			},
			bannerIcon: { fontSize: 28, color: "#fff", opacity: 0.95 },
			bannerTitle: { fontWeight: 800, fontSize: "1.05rem", color: "#fff" },
			bannerSubtitle: { fontSize: "0.78rem", color: alpha("#fff", 0.78), mt: 0.35 },
			body: { p: { xs: 2, sm: 3 }, background: palette.surface ?? palette.pageBg },
			section: {
				mb: 3,
				p: 2,
				borderRadius: 2,
				border: `1px solid ${alpha(palette.border ?? TRIMMING_BRAND.border, 0.65)}`,
				background: palette.pageBg ?? "#fff",
			},
			sectionTitle: {
				fontSize: "0.72rem",
				fontWeight: 800,
				letterSpacing: "0.08em",
				textTransform: "uppercase",
				color: palette.primaryLight ?? TRIMMING_BRAND.primaryLight,
				mb: 1.5,
				display: "flex",
				alignItems: "center",
				gap: 0.75,
			},
			metaGrid: {
				display: "grid",
				gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(3, 1fr)" },
				gap: 1.5,
			},
			metaItem: {
				p: 1.25,
				borderRadius: 1.5,
				background: alpha(palette.primaryLight ?? TRIMMING_BRAND.primaryLight, 0.04),
				border: `1px solid ${alpha(palette.primaryLight ?? TRIMMING_BRAND.primaryLight, 0.12)}`,
			},
			metaLabel: { fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: palette.textSub ?? TRIMMING_BRAND.textSub },
			metaValue: { fontSize: "0.88rem", fontWeight: 700, color: palette.text ?? TRIMMING_BRAND.text, mt: 0.35 },
			blockWrapper: (isLast: boolean) => ({ mb: isLast ? 0 : 2.5 }),
			blockMeta: { fontSize: "0.72rem", color: palette.textSub ?? TRIMMING_BRAND.textSub },
			blockMetaStrong: { color: palette.text ?? TRIMMING_BRAND.text, fontWeight: 700 },
			materialChip: {
				height: 22,
				fontSize: "0.68rem",
				fontWeight: 800,
				background: `linear-gradient(135deg, ${palette.primary ?? TRIMMING_BRAND.primary}, ${palette.primaryLight ?? TRIMMING_BRAND.primaryLight})`,
				color: "#fff",
			},
			tableContainer: {
				borderRadius: 1.5,
				border: `1px solid ${palette.border ?? TRIMMING_BRAND.border}`,
				overflow: "hidden",
			},
			tableHeaderCell: (isLead: boolean) => ({
				background: isLead
					? `linear-gradient(135deg, ${palette.primary ?? TRIMMING_BRAND.primary}, ${palette.primaryLight ?? TRIMMING_BRAND.primaryLight})`
					: alpha(palette.primary ?? TRIMMING_BRAND.primary, 0.06),
				color: isLead ? "#fff" : palette.textSub ?? TRIMMING_BRAND.textSub,
				fontWeight: 700,
				fontSize: "0.63rem",
				letterSpacing: "0.05em",
				textTransform: "uppercase",
				py: 1,
				px: 1.5,
				borderBottom: `1px solid ${palette.border ?? TRIMMING_BRAND.border}`,
				whiteSpace: "nowrap",
			}),
			tableRow: (idx: number) => ({
				background: idx % 2 === 0 ? palette.pageBg ?? "#fff" : alpha(palette.surface ?? TRIMMING_BRAND.surface, 0.5),
			}),
			tableCell: { fontSize: "0.82rem", py: 1.1, px: 1.5, color: palette.text ?? TRIMMING_BRAND.text },
			specText: { fontWeight: 600 },
			resultText: { fontWeight: 600, color: palette.text ?? TRIMMING_BRAND.text },
			remarksText: { fontSize: "0.8rem", color: palette.textSub ?? TRIMMING_BRAND.textSub },
			emptyText: { fontSize: "0.85rem", color: palette.textSub ?? TRIMMING_BRAND.textSub, textAlign: "center", py: 4 },
			loadingBox: { minHeight: 320, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1.5 },
		},
	};
};

export default getTrimmingTheme;
