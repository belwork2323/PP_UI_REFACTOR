import { alpha } from "@mui/material";
import fonts from "@app/theme/fonts";

/** RMS create/fill specification form tokens. */
export const createRawMaterialSourcingFormTheme = (
	palette: Record<string, any>,
	amberChipSx: Record<string, unknown>,
	mode: string = "light",
) => {
	const isDark = mode === "dark";
	const fieldBg = isDark ? (palette.pageBg ?? "#0f1117") : "#fff";

	return ({
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
			specText: { fontSize: "0.8rem", color: palette.text, fontWeight: 500, lineHeight: 1.35 },
			refRangeChip: {
				display: "inline-flex",
				maxWidth: "100%",
				height: 26,
				fontSize: fonts.size.xs,
				fontWeight: fonts.weight.bold,
				...amberChipSx,
				"& .MuiChip-label": {
					px: 1,
					overflow: "hidden",
					textOverflow: "ellipsis",
					whiteSpace: "nowrap",
				},
			},
			analyzedField: {
				width: "100%",
				minWidth: 0,
				"& .MuiOutlinedInput-root": {
					minHeight: 36,
					minWidth: 0,
					backgroundColor: fieldBg,
					background: fieldBg,
					"&.Mui-focused": { backgroundColor: fieldBg, background: fieldBg },
					"&:hover": { backgroundColor: fieldBg, background: fieldBg },
				},
				"& .MuiInputBase-input": {
					backgroundColor: fieldBg,
				},
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
					backgroundColor: alpha(palette.danger, 0.05),
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
			remarksField: {
				width: "100%",
				minWidth: 0,
				"& .MuiOutlinedInput-root": {
					minHeight: 36,
					minWidth: 0,
					backgroundColor: fieldBg,
					background: fieldBg,
					"&.Mui-focused": { backgroundColor: fieldBg, background: fieldBg },
					"&:hover": { backgroundColor: fieldBg, background: fieldBg },
				},
				"& .MuiInputBase-input": {
					backgroundColor: fieldBg,
				},
			},
			tableCellCompact: {
				padding: "8px 10px",
				verticalAlign: "middle",
			},
			specCell: {
				padding: "8px 10px",
				verticalAlign: "middle",
				minWidth: 0,
				overflowWrap: "anywhere",
			},
			refRangeCell: {
				padding: "8px 10px",
				verticalAlign: "middle",
				textAlign: "center",
				minWidth: 0,
			},
			inputCell: {
				padding: "8px 10px",
				verticalAlign: "middle",
				minWidth: 0,
			},
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
				background: isDark
					? alpha("#fff", 0.04)
					: `linear-gradient(135deg, ${alpha(palette.primary, 0.04)}, ${alpha(palette.primaryLight, 0.03)})`,
				border: `1.5px dashed ${isDark ? "rgba(255,255,255,0.35)" : alpha(palette.primaryLight, 0.35)}`,
			},
			/**
			 * Explicit field chrome. MUI ThemeProvider stays light, so default
			 * `.MuiOutlinedInput-notchedOutline` is rgba(0,0,0,0.23) — invisible on dark.
			 * Target notchedOutline with !important so it actually wins.
			 */
			materialDropdownField: {
				mb: 0,
				"& .MuiOutlinedInput-root": {
					minHeight: 36,
					height: 36,
					background: isDark ? alpha("#fff", 0.1) : "#fff",
					...(isDark
						? {
								"& .MuiOutlinedInput-notchedOutline": {
									borderColor: "rgba(255,255,255,0.55) !important",
									borderWidth: "1.5px",
								},
								"&:hover .MuiOutlinedInput-notchedOutline": {
									borderColor: `${palette.primaryLight ?? "#64b5f6"} !important`,
								},
								"&.Mui-focused .MuiOutlinedInput-notchedOutline": {
									borderColor: `${palette.primaryLight ?? "#64b5f6"} !important`,
									borderWidth: "1.5px",
								},
								"&.Mui-disabled .MuiOutlinedInput-notchedOutline": {
									borderColor: "rgba(255,255,255,0.35) !important",
								},
							}
						: {}),
				},
				"& .MuiSelect-select": {
					color: palette.text,
					WebkitTextFillColor: `${palette.text} !important`,
				},
				"& .MuiSelect-icon": { color: isDark ? "#b0bec5" : palette.textSub },
			},
			materialOption: {
				fontWeight: 600,
				fontSize: "0.85rem",
				color: palette.text,
				"&:hover": {
					background: isDark ? "rgba(255,255,255,0.06)" : alpha(palette.primaryLight, 0.08),
				},
				"&.Mui-selected": {
					background: isDark
						? alpha(palette.primaryLight, 0.18)
						: alpha(palette.primaryLight, 0.12),
					"&:hover": {
						background: isDark
							? alpha(palette.primaryLight, 0.24)
							: alpha(palette.primaryLight, 0.16),
					},
				},
			},
			materialOptionMeta: { ml: 1, fontSize: "0.72rem", color: palette.textSub },
			/** Dark: solid surface + light text — MUI default paper is light and washes out page-theme text. */
			materialMenuPaper: (isDarkMode: boolean) => ({
				borderRadius: 2,
				mt: 0.5,
				bgcolor: isDarkMode ? palette.surface : "#fff",
				backgroundImage: "none",
				border: `1px solid ${isDarkMode ? alpha(palette.border, 0.9) : alpha(palette.primaryLight, 0.2)}`,
				boxShadow: `0 8px 24px ${isDarkMode ? "rgba(0,0,0,0.55)" : "rgba(27,79,114,0.12)"}`,
				color: palette.text,
				"& .MuiMenuItem-root": {
					color: palette.text,
					fontSize: "0.85rem",
				},
				"& .MuiMenuItem-root em": {
					color: palette.textSub,
				},
			}),
			materialSelectIcon: (selected: boolean) => ({
				fontSize: 16,
				color: selected ? palette.primaryLight : isDark ? "#b0bec5" : palette.textSub,
			}),
			addButton: {
				borderRadius: 2.5,
				fontWeight: 800,
				fontSize: "0.8rem",
				textTransform: "none",
				px: 2.5,
				py: 0,
				minHeight: 36,
				height: 36,
				// Dark: deep fills — palette.primary* are light accents for text, not button fills.
				background: isDark
					? "linear-gradient(135deg, #0d47a1, #1565c0)"
					: `linear-gradient(135deg, ${palette.primary}, ${palette.primaryLight})`,
				boxShadow: `0 4px 14px ${alpha(isDark ? "#1565c0" : palette.primary, 0.35)}`,
				whiteSpace: "nowrap",
				minWidth: 140,
				color: "#fff",
				"&:hover": {
					boxShadow: `0 6px 18px ${alpha(isDark ? "#1565c0" : palette.primary, 0.45)}`,
					transform: "translateY(-1px)",
				},
				"&:disabled": {
					background: isDark ? "rgba(255,255,255,0.12)" : palette.border,
					boxShadow: "none",
					color: isDark ? "rgba(255,255,255,0.55)" : palette.textSub,
				},
				transition: "all 0.25s cubic-bezier(0.34,1.56,0.64,1)",
			},
			emptyStateTitle: { fontWeight: 600, color: palette.textSub, fontSize: "0.88rem" },
			emptyStateSubtitle: { fontSize: "0.75rem", color: alpha(palette.textSub, 0.7), mt: 0.5 },
			emptyStateIcon: { fontSize: 36, color: palette.border, mb: 1.5 },
			footerInfoContainer: { mt: 2.5, px: 2, py: 1.2 },
			footerInfoIcon: { fontSize: 15, color: palette.primaryLight, flexShrink: 0 },
			footerInfoText: { fontSize: "0.72rem", color: palette.textSub, lineHeight: 1.5 },
			/** Percent widths for the 6-col specs table (table-layout: fixed). */
			tableHeader: {
				material: { width: "12%", minWidth: 0 },
				lotBatch: { width: "14%", minWidth: 0 },
				specification: {
					width: "24%",
					minWidth: 0,
					whiteSpace: "normal",
					lineHeight: 1.3,
				},
				refRange: {
					width: "14%",
					minWidth: 0,
					textAlign: "center",
					whiteSpace: "normal",
					lineHeight: 1.3,
				},
				analysedResult: {
					width: "18%",
					minWidth: 0,
					whiteSpace: "normal",
					lineHeight: 1.3,
				},
				remarks: {
					width: "18%",
					minWidth: 0,
					whiteSpace: "normal",
					lineHeight: 1.3,
				},
			},
			/** 4-column lot table (no material/lot columns). */
			lotTableHeader: {
				specification: {
					width: "34%",
					minWidth: 0,
					whiteSpace: "normal",
					lineHeight: 1.3,
				},
				refRange: {
					width: "18%",
					minWidth: 0,
					textAlign: "center",
					whiteSpace: "normal",
					lineHeight: 1.3,
				},
				analysedResult: {
					width: "24%",
					minWidth: 0,
					whiteSpace: "normal",
					lineHeight: 1.3,
				},
				remarks: {
					width: "24%",
					minWidth: 0,
					whiteSpace: "normal",
					lineHeight: 1.3,
				},
			},
			/** Shared outer wrap so the table stays inside the card (avoids width 100% + mx overflow). */
			specsTableWrap: {
				px: 2,
				mb: 1.5,
				minWidth: 0,
				maxWidth: "100%",
				boxSizing: "border-box",
			},
			specsTableContainer: {
				width: "100%",
				maxWidth: "100%",
				borderRadius: 1.5,
				overflowX: "auto",
				boxSizing: "border-box",
			},
			specsTable: {
				tableLayout: "fixed",
				width: "100%",
				minWidth: 0,
			},
			dataRow: (rowIndex: number, isFailed = false) => ({
				"&:hover": {
					background: isFailed ? alpha(palette.danger, 0.09) : alpha(palette.primaryLight, 0.04),
				},
				"&:last-child td": { borderBottom: "none" },
				// Match fieldBg so Analyze / ACEM inputs never inherit a grey row tint.
				background: isFailed ? alpha(palette.danger, 0.06) : fieldBg,
				boxShadow: isFailed ? `inset 3px 0 0 ${palette.danger}` : "none",
			}),
		});
};
