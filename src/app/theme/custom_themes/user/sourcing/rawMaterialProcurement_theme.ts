import { alpha } from "@mui/material";
import fonts from "../../../fonts";

export const getRawMaterialProcurementTheme = (baseTheme: any) => {
	const palette = baseTheme?.palette ?? {};
	const warnBase = palette.warn ?? "#D4AC0D";
	/** Stronger amber chips — ref range & partial-fill counts (default warn tint was too pale) */
	const amberChipSx = {
		background: alpha(warnBase, 0.24),
		color: "#7D6608",
		border: `1px solid ${alpha(warnBase, 0.5)}`,
	};

	return {
		header: {
			accentChip: {
				background: alpha(palette.primaryLight ?? "#2E86C1", 0.1),
				color: palette.primary ?? "#1B4F72",
				border: `1px solid ${alpha(palette.primaryLight ?? "#2E86C1", 0.25)}`,
			},
		},
		specificationForm: {
			animatedBlockCard: (idx: number) => ({ animation: "fadeIn 0.3s ease both", animationDelay: `${idx * 0.06}s` }),
			editModeIcon: { fontSize: 18, flexShrink: 0 },
			iconBadge: {
				width: 30,
				height: 30,
				borderRadius: "8px",
				background: `linear-gradient(135deg, ${palette.primary}, ${palette.primaryLight})`,
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				boxShadow: `0 3px 8px ${alpha(palette.primary, 0.3)}`,
			},
			headerIconBadge: {
				width: 32,
				height: 32,
				borderRadius: "10px",
				background: `linear-gradient(135deg, ${palette.primary}, ${palette.primaryLight})`,
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				boxShadow: `0 4px 10px ${alpha(palette.primary, 0.3)}`,
			},
			headerScienceIcon: { fontSize: 17 },
			headerTitle: { fontWeight: fonts.weight.bold, fontSize: fonts.size.sm, color: palette.text },
			headerSubtitle: { fontSize: fonts.size.xs, color: palette.textSub, mt: 0.3 },
			whiteIcon: { color: "#fff" },
			blockScienceIcon: { fontSize: 16 },
			progressChipIcon: { fontSize: "13px !important" },
			blockTitle: { fontWeight: fonts.weight.bold, fontSize: fonts.size.xs, color: palette.text },
			blockMeta: { fontSize: "0.68rem", color: palette.textSub },
			progressChip: (allFilled: boolean) => ({
				height: 22,
				fontSize: "0.65rem",
				fontWeight: 700,
				...(allFilled
					? {
							background: alpha(palette.accent, 0.1),
							color: palette.accent,
							border: `1px solid ${alpha(palette.accent, 0.25)}`,
						}
					: amberChipSx),
			}),
			removeIconButton: { color: palette.danger, "&:hover": { background: alpha(palette.danger, 0.08) } },
			lotField: { minWidth: 0 },
			specText: { fontSize: "0.8rem", color: palette.text, fontWeight: 500 },
			refRangeChip: {
				mt: { xs: 1.5, md: 0 },
				minWidth: 150,
				fontSize: fonts.size.xs,
				fontWeight: fonts.weight.bold,
				...amberChipSx,
			},
			analyzedField: {
				maxWidth: 160,
				"& input[type=number]": {
					MozAppearance: "textfield",
				},
				"& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button": {
					WebkitAppearance: "none",
					margin: 0,
				},
			},
			failedAnalyzedField: {
				"& .MuiOutlinedInput-root": {
					background: alpha(palette.danger, 0.05),
					"& fieldset": { borderColor: alpha(palette.danger, 0.45) },
					"&:hover fieldset": { borderColor: palette.danger },
					"&.Mui-focused fieldset": { borderColor: palette.danger, borderWidth: 1.5 },
				},
			},
			failedSpecChip: {
				height: 20,
				fontSize: "0.62rem",
				fontWeight: 800,
				background: alpha(palette.danger, 0.1),
				color: palette.danger,
				border: `1px solid ${alpha(palette.danger, 0.28)}`,
			},
			remarksField: { minWidth: 0 },
			editModeBanner: {
				mb: 2.5,
				px: 2,
				py: 1.5,
				borderRadius: 2,
				background: alpha(palette.danger, 0.05),
				border: `1.5px solid ${alpha(palette.danger, 0.2)}`,
				display: "flex",
				alignItems: "center",
				gap: 1.2,
			},
			editModeBannerText: { fontSize: "0.8rem", color: palette.danger, fontWeight: 600, lineHeight: 1.5 },
			summaryChip: { fontWeight: 700, fontSize: "0.7rem" },
			summaryPrimaryChip: {
				fontWeight: 700,
				fontSize: "0.7rem",
				background: alpha(palette.primaryLight, 0.12),
				color: palette.primary,
			},
			resultSummaryChip: (allFilled: boolean) => ({
				fontWeight: 700,
				fontSize: "0.7rem",
				...(allFilled
					? {
							background: alpha(palette.accent, 0.12),
							color: palette.accent,
						}
					: amberChipSx),
			}),
			materialSelectorBox: {
				p: "14px 18px",
				borderRadius: 3,
				mb: 2.5,
				background: `linear-gradient(135deg, ${alpha(palette.primary, 0.04)}, ${alpha(palette.primaryLight, 0.03)})`,
				border: `1.5px dashed ${alpha(palette.primaryLight, 0.35)}`,
			},
			materialOption: { fontWeight: 600, fontSize: "0.85rem" },
			materialOptionMeta: { ml: 1, fontSize: "0.72rem", color: palette.textSub },
			addButton: {
				borderRadius: 2.5,
				fontWeight: 800,
				fontSize: "0.8rem",
				textTransform: "none",
				px: 3,
				py: "9px",
				background: `linear-gradient(135deg, ${palette.primary}, ${palette.primaryLight})`,
				boxShadow: `0 4px 14px ${alpha(palette.primary, 0.35)}`,
				whiteSpace: "nowrap",
				minWidth: 140,
				"&:hover": { boxShadow: `0 6px 18px ${alpha(palette.primary, 0.45)}`, transform: "translateY(-1px)" },
				"&:disabled": { background: palette.border, boxShadow: "none", color: palette.textSub },
				transition: "all 0.25s cubic-bezier(0.34,1.56,0.64,1)",
			},
			emptyStateTitle: { fontWeight: 600, color: palette.textSub, fontSize: "0.88rem" },
			emptyStateSubtitle: { fontSize: "0.75rem", color: alpha(palette.textSub, 0.7), mt: 0.5 },
			emptyStateIcon: { fontSize: 36, color: palette.border, mb: 1.5 },
			footerInfoContainer: { mt: 2.5, px: 2, py: 1.2 },
			footerInfoIcon: { fontSize: 15, color: palette.primaryLight, flexShrink: 0 },
			footerInfoText: { fontSize: "0.72rem", color: palette.textSub, lineHeight: 1.5 },
			tableHeader: {
				material: { minWidth: 80 },
				lotBatch: { minWidth: 150 },
				specification: { minWidth: 200 },
				refRange: { minWidth: 130 },
				analysedResult: { minWidth: 140 },
				remarks: { minWidth: 200 },
			},
			dataRow: (rowIndex: number, isFailed = false) => ({
				"&:hover": {
					background: isFailed ? alpha(palette.danger, 0.09) : alpha(palette.primaryLight, 0.03),
				},
				"&:last-child td": { borderBottom: "none" },
				background: isFailed
					? alpha(palette.danger, 0.06)
					: rowIndex % 2 === 0
						? palette.surface
						: alpha(palette.surface, 0.6),
				boxShadow: isFailed ? `inset 3px 0 0 ${palette.danger}` : "none",
			}),
		},
		specification: {
			panelBorder: alpha(palette.primaryLight ?? "#2E86C1", 0.28),
		},
		lotDetails: {
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
			bannerTitle: { fontWeight: 800, fontSize: "1.05rem", color: "#fff" },
			bannerSubtitle: { fontSize: "0.78rem", color: alpha("#fff", 0.78), mt: 0.35 },
			bannerIcon: { fontSize: 28, color: "#fff", opacity: 0.95 },
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
			tableContainer: {
				borderRadius: 1.5,
				border: `1px solid ${palette.border ?? "#D5D8DC"}`,
				overflow: "hidden",
			},
			tableHeaderCell: {
				background: alpha(palette.primary ?? "#1B4F72", 0.06),
				fontWeight: 700,
				fontSize: "0.65rem",
				letterSpacing: "0.05em",
				textTransform: "uppercase",
				color: palette.textSub,
				py: 1,
				px: 1.5,
				borderBottom: `1px solid ${palette.border}`,
			},
			tableRow: (idx: number, failed?: boolean) => ({
				background: failed
					? alpha(palette.danger, 0.06)
					: idx % 2 === 0
						? palette.pageBg ?? "#fff"
						: alpha(palette.surface ?? "#F4F6F8", 0.5),
				boxShadow: failed ? `inset 3px 0 0 ${palette.danger}` : "none",
			}),
			tableCell: { fontSize: "0.82rem", py: 1.1, px: 1.5, color: palette.text },
			specText: { fontWeight: 600 },
			refChip: {
				height: 22,
				fontSize: "0.65rem",
				fontWeight: 600,
				...amberChipSx,
			},
			resultText: { fontWeight: 700, color: palette.primary },
			failedResult: { fontWeight: 700, color: palette.danger },
			remarksText: { fontSize: "0.8rem", color: palette.textSub },
			certRow: {
				display: "flex",
				alignItems: "center",
				gap: 1,
				p: 1,
				borderRadius: 1.5,
				border: `1px solid ${alpha(palette.border ?? "#D5D8DC", 0.8)}`,
				"&:hover": { background: alpha(palette.primaryLight, 0.05) },
			},
			certLink: { fontSize: "0.82rem", fontWeight: 600, color: palette.primaryLight, textDecoration: "none" },
			emptyText: { fontSize: "0.85rem", color: palette.textSub, textAlign: "center", py: 4 },
			loadingBox: { minHeight: 320, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1.5 },
		},
	};
};

export default getRawMaterialProcurementTheme;
