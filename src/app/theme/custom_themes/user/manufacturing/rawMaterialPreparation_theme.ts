import { alpha } from "@mui/material";

export const SOLID_PREP_BRAND = {
	primary: "#1B4F72",
	primaryLight: "#2E86C1",
	accent: "#148F77",
	warn: "#D4AC0D",
	danger: "#C0392B",
	surface: "#F4F6F8",
	border: "#D5D8DC",
	text: "#1C2833",
	textSub: "#5D6D7E",
	solid: "#1565C0",
	solidLight: "#1976D2",
} as const;

export const LIQUID_PREP_BRAND = {
	primary: "#1B4F72",
	primaryLight: "#2E86C1",
	accent: "#148F77",
	warn: "#D4AC0D",
	danger: "#C0392B",
	surface: "#F4F6F8",
	border: "#D5D8DC",
	text: "#1C2833",
	textSub: "#5D6D7E",
	liquid: "#1565C0",
	liquidLight: "#1976D2",
} as const;

export const LINEAR_PREP_BRAND = {
	primary: "#1B4F72",
	primaryLight: "#2E86C1",
	accent: "#148F77",
	warn: "#D4AC0D",
	danger: "#C0392B",
	surface: "#F4F6F8",
	border: "#D5D8DC",
	text: "#1C2833",
	textSub: "#5D6D7E",
	linear: "#1565C0",
	linearLight: "#1976D2",
} as const;

export const getRawMaterialPreparationTheme = (baseTheme: any) => {
	const palette = baseTheme?.palette ?? {};

	const materialColors = {
		solid: "#6D4C41",
		liquid: "#1565C0",
		linear: "#00695C",
	};

	return {
		colors: {
			material: materialColors,
		},
		page: {
			loadingSpinnerSize: 32,
		},
		header: {
			contentPadding: { p: "14px 18px" },
			scaleChip: (color: string) => ({
				height: 22,
				fontSize: "calc(0.65rem + 2px)",
				fontWeight: 700,
				background: alpha(color, 0.1),
				color,
				border: `1px solid ${alpha(color, 0.28)}`,
				"& .MuiChip-label": { px: 1.2 },
			}),
			typeChip: (color: string) => ({
				height: 20,
				fontSize: "0.65rem",
				fontWeight: 700,
				background: alpha(color, 0.1),
				color,
				border: `1px solid ${alpha(color, 0.28)}`,
				transition: "all 0.2s",
			}),
			footerContainer: (isEdit: boolean) => ({
				px: "18px",
				py: "11px",
				borderTop: `1px solid ${isEdit ? alpha(palette.danger, 0.14) : alpha(palette.primaryLight, 0.18)}`,
				background: isEdit ? alpha(palette.danger, 0.025) : alpha(palette.primary, 0.025),
			}),
			selectorGroup: { flexShrink: 0 },
			selectorLabel: (isEdit: boolean) => ({
				fontSize: "0.72rem",
				fontWeight: 700,
				letterSpacing: "0.03em",
				color: isEdit ? palette.danger : palette.primary,
			}),
			selectorHint: { fontSize: "0.68rem", color: palette.textSub },
			noTypeBox: {
				px: 1.3,
				py: 0.5,
				borderRadius: 2,
				background: alpha(palette.warn, 0.08),
				border: `1px dashed ${alpha(palette.warn, 0.4)}`,
			},
			noTypeIcon: { fontSize: 13, color: "#7D6608" },
			noTypeText: { fontSize: "0.68rem", fontWeight: 600, color: "#7D6608" },
			lockBox: {
				px: 1.3,
				py: 0.5,
				borderRadius: 2,
				background: alpha(palette.danger, 0.05),
				border: `1px dashed ${alpha(palette.danger, 0.25)}`,
			},
			lockIcon: { fontSize: 12, color: palette.danger },
			lockText: { fontSize: "0.68rem", color: palette.danger, fontWeight: 500, lineHeight: 1.4 },
			toggle: {
				container: (checked: boolean, locked: boolean, color: string) => ({
					display: "inline-flex",
					alignItems: "center",
					gap: 0.9,
					px: 1.5,
					py: 0.65,
					borderRadius: 2.5,
					border: checked ? `1.5px solid ${alpha(color, 0.5)}` : `1.5px dashed ${alpha(palette.border, 0.9)}`,
					background: checked ? alpha(color, 0.07) : alpha(palette.surface, 0.7),
					cursor: locked ? "not-allowed" : "pointer",
					userSelect: "none",
					transition: "all 0.18s ease",
					"&:hover": !locked
						? {
								background: alpha(color, 0.11),
								border: `1.5px solid ${alpha(color, 0.45)}`,
								transform: "translateY(-1px)",
								boxShadow: `0 3px 10px ${alpha(color, 0.18)}`,
							}
						: {},
				}),
				checkbox: (checked: boolean, color: string) => ({
					width: 15,
					height: 15,
					borderRadius: 0.7,
					flexShrink: 0,
					border: checked ? `2px solid ${color}` : `2px solid ${alpha(palette.textSub, 0.35)}`,
					background: checked ? color : "transparent",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					transition: "all 0.14s",
					boxShadow: checked ? `0 1px 4px ${alpha(color, 0.3)}` : "none",
				}),
				checkMark: {
					width: 8,
					height: 8,
					backgroundImage:
						'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 10 8\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M1 4l3 3 5-6\' stroke=\'white\' stroke-width=\'1.8\' fill=\'none\' stroke-linecap=\'round\' stroke-linejoin=\'round\'/%3E%3C/svg%3E")',
					backgroundRepeat: "no-repeat",
					backgroundPosition: "center",
					backgroundSize: "contain",
					display: "block",
				},
				icon: (checked: boolean, color: string) => ({
					fontSize: 13,
					color: checked ? color : alpha(palette.textSub, 0.55),
					flexShrink: 0,
				}),
				label: (checked: boolean, color: string) => ({
					fontSize: "0.74rem",
					fontWeight: checked ? 700 : 500,
					color: checked ? color : palette.textSub,
					lineHeight: 1,
				}),
				lockIcon: (color: string) => ({ fontSize: 11, color: alpha(color, 0.55), ml: 0.2 }),
			},
		},
		list: {
			materialConfig: {
				solid: { label: "Solid", color: materialColors.solid },
				liquid: { label: "Liquid", color: materialColors.liquid },
				both: { label: "Both", color: "#4A235A" },
				"type not selected yet": { label: "Type not Selected yet", color: "#616A6B", italic: true },
			} as Record<string, { label: string; color: string; italic?: boolean }>,
			fallbackMaterialConfig: { label: "-", color: "#555" },
			materialIcon: (color: string) => ({ fontSize: "12px !important", color: `${color} !important` }),
			materialChip: (cfg: { color: string; italic?: boolean }, isUnselected: boolean) => ({
				height: 22,
				fontSize: "0.68rem",
				fontWeight: isUnselected ? 500 : 700,
				fontStyle: cfg.italic ? "italic" : "normal",
				background: `${cfg.color}14`,
				color: cfg.color,
				border: `1px solid ${cfg.color}33`,
				maxWidth: 160,
			}),
			materialChipLabel: (isUnselected: boolean) => ({ px: isUnselected ? 0.8 : 1 }),
			priorityChip: (cfg: { bg: string; color: string; border: string }) => ({
				height: 22,
				fontSize: "0.68rem",
				fontWeight: 700,
				background: cfg.bg,
				color: cfg.color,
				border: `1px solid ${cfg.border}`,
			}),
		},
		flowBar: {
			container: {
				mb: 2,
				p: 1.5,
				borderRadius: 3,
				border: `1px solid ${alpha(palette.border, 0.9)}`,
				background: alpha(palette.surface, 0.6),
				...baseTheme.workflow.animatedContainer,
			},
			selectField: (width: number | string = "100%") => ({
				width,
				flexShrink: 0,
			}),
			selectLabel: {
				fontSize: "0.72rem",
				fontWeight: 700,
				color: palette.primary,
				letterSpacing: "0.03em",
				mb: 0.65,
				display: "block",
			},
			selectInput: (hasValue: boolean, accentColor: string) => ({
				"& .MuiOutlinedInput-root": {
					borderRadius: 2.5,
					background: palette.pageBg ?? "#fff",
					fontSize: "0.82rem",
					transition: "all 0.2s ease",
					"& fieldset": {
						borderColor: alpha(palette.border, 0.95),
					},
					"&:hover fieldset": {
						borderColor: alpha(accentColor, 0.55),
					},
					"&.Mui-focused fieldset": {
						borderColor: accentColor,
						borderWidth: 2,
					},
					"&.Mui-disabled": {
						background: alpha(palette.surface, 0.8),
					},
				},
				"& .MuiSelect-select": {
					fontWeight: hasValue ? 600 : 500,
					color: hasValue ? palette.text : palette.textSub,
					py: 1,
				},
				"& .MuiSelect-icon": {
					color: hasValue ? accentColor : alpha(palette.textSub, 0.6),
				},
			}),
			selectPlaceholder: {
				color: palette.textSub,
				fontSize: "0.82rem",
				fontWeight: 500,
			},
			selectMenuPaper: {
				borderRadius: 2.5,
				mt: 0.5,
				maxHeight: 320,
				boxShadow: `0 10px 28px ${alpha(palette.primary, 0.14)}`,
				border: `1px solid ${alpha(palette.border, 0.85)}`,
				"& .MuiMenuItem-root": {
					fontSize: "0.82rem",
					py: 1,
					px: 1.5,
					borderRadius: 1.5,
					mx: 0.75,
					my: 0.25,
				},
			},
			premixMenuItem: (selected: boolean, accentColor: string) => ({
				fontWeight: selected ? 700 : 500,
				color: selected ? accentColor : palette.text,
				background: selected ? alpha(accentColor, 0.08) : "transparent",
				"&:hover": { background: alpha(accentColor, 0.1) },
			}),
			materialMenuItem: (selected: boolean) => ({
				alignItems: "flex-start",
				flexDirection: "column",
				gap: 0.2,
				background: selected ? alpha(palette.primaryLight, 0.08) : "transparent",
				"&:hover": { background: alpha(palette.primaryLight, 0.06) },
			}),
			materialMenuPrimary: (selected: boolean) => ({
				fontWeight: 600,
				fontSize: "0.82rem",
				color: selected ? palette.primary : palette.text,
				lineHeight: 1.35,
			}),
			materialMenuMeta: {
				fontSize: "0.7rem",
				color: palette.textSub,
				fontWeight: 500,
			},
			topRow: {
				display: "flex",
				flexWrap: "wrap",
				alignItems: "flex-start",
				gap: 2,
			},
			processField: {
				flex: 1,
				minWidth: 260,
			},
			processControlRow: {
				minHeight: 40,
				display: "flex",
				flexWrap: "wrap",
				alignItems: "center",
				gap: 1.25,
			},
			materialSelectorBox: {
				p: "14px 18px",
				borderRadius: 3,
				background: `linear-gradient(135deg, ${alpha(palette.primary, 0.04)}, ${alpha(palette.primaryLight, 0.03)})`,
				border: `1.5px dashed ${alpha(palette.primaryLight, 0.35)}`,
			},
			fieldLabel: { fontSize: "0.72rem", fontWeight: 700, color: palette.primary, mb: 0.6 },
			processCheckbox: {
				"& .MuiFormControlLabel-label": {
					fontSize: "0.8rem",
					fontWeight: 600,
				},
			},
			materialSelectRow: {
				mt: 0.5,
			},
			select: {
				borderRadius: 2,
				background: palette.surface,
				"& .MuiOutlinedInput-notchedOutline": { borderColor: alpha(palette.border, 0.9) },
				"& .MuiSelect-select": { fontSize: "0.8rem", fontWeight: 600 },
			},
		},
		builder: {
			sectionContainer: {
				...baseTheme.workflow.animatedContainer,
				paddingBottom: 2,
			},
			emptyStateBox: {
				mt: 1,
				py: 6,
				borderRadius: 3,
				textAlign: "center",
				border: `1.5px dashed ${alpha(palette.border, 0.8)}`,
				background: alpha(palette.surface, 0.5),
				...baseTheme.workflow.animatedContainer,
			},
			emptyStateIcon: { fontSize: 34, color: alpha(palette.textSub, 0.35), mb: 1.2 },
			emptyStateTitle: { fontWeight: 700, color: palette.textSub, fontSize: "0.9rem" },
			emptyStateSubtitle: { fontSize: "0.75rem", color: alpha(palette.textSub, 0.65), mt: 0.5 },
		},
		details: {
			bannerStatusConfig: (() => {
				const primary = palette.primary ?? "#1B4F72";
				const primaryLight = palette.primaryLight ?? "#2E86C1";
				const success = palette.accent ?? "#148F77";
				const danger = palette.danger ?? "#C0392B";
				const warnBase = palette.warn ?? "#D4AC0D";
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
				border: `1px solid ${palette.border ?? "#D5D8DC"}`,
				boxShadow: `0 4px 24px ${alpha(palette.primary ?? "#1B4F72", 0.08)}`,
				overflow: "hidden",
				background: palette.pageBg ?? "#fff",
			},
			banner: {
				p: "18px 24px",
				background: `linear-gradient(135deg, ${palette.primary}, ${palette.primaryLight})`,
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
				border: `1px solid ${alpha(palette.border ?? "#D5D8DC", 0.65)}`,
				background: palette.pageBg ?? "#fff",
			},
			sectionTitle: {
				fontSize: "0.72rem",
				fontWeight: 800,
				letterSpacing: "0.08em",
				textTransform: "uppercase",
				color: palette.primaryLight,
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
				background: alpha(palette.primaryLight ?? "#2E86C1", 0.04),
				border: `1px solid ${alpha(palette.primaryLight ?? "#2E86C1", 0.12)}`,
			},
			metaLabel: { fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: palette.textSub },
			metaValue: { fontSize: "0.88rem", fontWeight: 700, color: palette.text, mt: 0.35 },
			blockWrapper: (isLast: boolean) => ({ mb: isLast ? 0 : 2.5 }),
			blockMeta: { fontSize: "0.72rem", color: palette.textSub },
			blockMetaStrong: { color: palette.text, fontWeight: 700 },
			materialChip: {
				height: 22,
				fontSize: "0.68rem",
				fontWeight: 800,
				background: `linear-gradient(135deg, ${palette.primary}, ${palette.primaryLight})`,
				color: "#fff",
			},
			tableContainer: {
				borderRadius: 1.5,
				border: `1px solid ${palette.border ?? "#D5D8DC"}`,
				overflow: "hidden",
			},
			tableHeaderCell: (isLead: boolean) => ({
				background: isLead
					? `linear-gradient(135deg, ${palette.primary}, ${palette.primaryLight})`
					: alpha(palette.primary ?? "#1B4F72", 0.06),
				color: isLead ? "#fff" : palette.textSub,
				fontWeight: 700,
				fontSize: "0.72rem",
				letterSpacing: "0.01em",
				textTransform: "none",
				py: 1,
				px: 1.5,
				borderBottom: `1px solid ${palette.border}`,
				whiteSpace: "nowrap",
			}),
			tableRow: (idx: number) => ({
				background: idx % 2 === 0 ? palette.pageBg ?? "#fff" : alpha(palette.surface ?? "#F4F6F8", 0.5),
			}),
			tableCell: { fontSize: "0.82rem", py: 1.1, px: 1.5, color: palette.text },
			specText: { fontWeight: 600 },
			resultText: { fontWeight: 600, color: palette.text },
			remarksText: { fontSize: "0.8rem", color: palette.textSub },
			emptyText: { fontSize: "0.85rem", color: palette.textSub, textAlign: "center", py: 4 },
			loadingBox: { minHeight: 320, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1.5 },
		},
		solidPreparation: {
			brand: {
				primary: palette.primary ?? SOLID_PREP_BRAND.primary,
				primaryLight: palette.primaryLight ?? SOLID_PREP_BRAND.primaryLight,
				accent: palette.accent ?? SOLID_PREP_BRAND.accent,
				warn: palette.warn ?? SOLID_PREP_BRAND.warn,
				danger: palette.danger ?? SOLID_PREP_BRAND.danger,
				surface: palette.surface ?? SOLID_PREP_BRAND.surface,
				border: palette.border ?? SOLID_PREP_BRAND.border,
				text: palette.text ?? SOLID_PREP_BRAND.text,
				textSub: palette.textSub ?? SOLID_PREP_BRAND.textSub,
				solid: "#1565C0",
				solidLight: "#1976D2",
			},
		},
	};
};

export default getRawMaterialPreparationTheme;
