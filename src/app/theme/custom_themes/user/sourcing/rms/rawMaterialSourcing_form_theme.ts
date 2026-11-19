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
	const border = palette.border;
	const primary = palette.primary;
	const primaryLight = palette.primaryLight;
	// Hard-code dark text — MUI light ThemeProvider keeps near-black fill otherwise.
	const fieldText = isDark ? "#f0f2f8" : (palette.text ?? "#111111");
	const fieldPlaceholder = isDark
		? "rgba(240,242,248,0.65)"
		: (palette.textSub ?? "rgba(0,0,0,0.5)");
	const resultInputTextSx = {
		color: `${fieldText} !important`,
		WebkitTextFillColor: `${fieldText} !important`,
		caretColor: fieldText,
		"&::placeholder": {
			color: `${fieldPlaceholder} !important`,
			WebkitTextFillColor: `${fieldPlaceholder} !important`,
			opacity: 1,
		},
		"&::-webkit-input-placeholder": {
			color: `${fieldPlaceholder} !important`,
			WebkitTextFillColor: `${fieldPlaceholder} !important`,
			opacity: 1,
		},
	};
	const resultAutofillSx = {
		WebkitTextFillColor: `${fieldText} !important`,
		caretColor: fieldText,
		// Keep autofill from painting a light yellow box + black text over dark inputs.
		transition: "background-color 99999s ease-in-out 0s",
		boxShadow: `0 0 0 1000px ${fieldBg} inset`,
	};

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
			progressChipIconFilled: {
				fontSize: "13px !important",
				color: `${palette.accent} !important`,
			},
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
			/** Nested lot / preparation panels inside a material card. */
			lotSubCard: {
				borderRadius: 1.5,
				border: `1px solid ${alpha(border, 0.55)}`,
				overflow: "hidden",
				mb: 2,
			},
			lotSubCardHeader: {
				px: 2,
				py: 1.25,
				display: "flex",
				alignItems: "center",
				justifyContent: "space-between",
				flexWrap: "wrap",
				gap: 1,
				background: alpha(primary, 0.04),
				borderBottom: `1px solid ${alpha(border, 0.45)}`,
			},
			lotSubCardTitle: {
				fontSize: "0.85rem",
				fontWeight: 700,
				color: palette.text,
			},
			/** ACEM / HTPB preparation bordered panels. */
			subPanel: {
				mx: 2,
				mb: 2,
				p: 2,
				borderRadius: 1.5,
				border: `1px solid ${alpha(border, 0.55)}`,
				bgcolor: isDark
					? alpha(palette.surface ?? "#1e1e1e", 0.65)
					: alpha(primary, 0.03),
			},
			subPanelTitle: {
				fontSize: "0.78rem",
				fontWeight: 700,
				color: palette.text,
				mb: 1.5,
			},
			addLotButton: {
				textTransform: "none",
				fontWeight: 700,
				borderRadius: 2,
				borderColor: primaryLight,
				color: primaryLight,
				"&:hover": { background: alpha(primaryLight, 0.06) },
			},
			deleteLotButton: {
				textTransform: "none",
				fontWeight: 700,
				borderRadius: 2,
				flexShrink: 0,
			},
			lockedLotNoText: {
				fontSize: "0.78rem",
				fontWeight: 600,
				color: palette.text,
				lineHeight: 1.35,
				wordBreak: "break-word",
			},
			lockedLotNoHint: {
				mx: 0,
				mt: 0.5,
				fontSize: "0.68rem",
				color: palette.textSub,
			},
			fieldErrorHint: {
				mx: 0,
				mt: 0.5,
				fontSize: "0.68rem",
			},
			cellHelperText: {
				mx: 0,
				fontSize: "0.65rem",
			},
			cellHelperTextWarning: {
				mx: 0,
				fontSize: "0.65rem",
				color: "error.main",
			},
			allMaterialsAddedText: {
				fontSize: "0.8rem",
				color: palette.textSub,
				mb: 2,
			},
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
					color: fieldText,
					"&.Mui-focused": { backgroundColor: fieldBg, background: fieldBg },
					"&:hover": { backgroundColor: fieldBg, background: fieldBg },
				},
				"& .MuiInputBase-input, & .MuiOutlinedInput-input, & input": {
					backgroundColor: fieldBg,
					...resultInputTextSx,
				},
				"& input:-webkit-autofill, & input:-webkit-autofill:hover, & input:-webkit-autofill:focus, & input:-webkit-autofill:active":
					resultAutofillSx,
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
					color: fieldText,
					"&.Mui-focused": { backgroundColor: fieldBg, background: fieldBg },
					"&:hover": { backgroundColor: fieldBg, background: fieldBg },
				},
				"& .MuiInputBase-input, & .MuiOutlinedInput-input, & input": {
					backgroundColor: fieldBg,
					...resultInputTextSx,
				},
				"& input:-webkit-autofill, & input:-webkit-autofill:hover, & input:-webkit-autofill:focus, & input:-webkit-autofill:active":
					resultAutofillSx,
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
			 * Material picker chrome (height + dark outline). Shared AppDropdown dark
			 * tokens handle text; this layer keeps the denser 36px selector row.
			 */
			materialDropdownField: {
				mb: 0,
				"& .MuiOutlinedInput-root": {
					minHeight: 36,
					height: 36,
					background: isDark ? alpha("#fff", 0.1) : "#fff",
					...(isDark
						? {
								boxShadow: "inset 0 0 0 1.5px rgba(255,255,255,0.7)",
								"& .MuiOutlinedInput-notchedOutline": {
									borderColor: "rgba(255,255,255,0.7) !important",
									borderWidth: "1.5px !important",
								},
								"&:hover": {
									boxShadow: `inset 0 0 0 1.5px ${primaryLight}`,
								},
								"&:hover .MuiOutlinedInput-notchedOutline": {
									borderColor: `${primaryLight} !important`,
								},
								"&.Mui-focused": {
									boxShadow: `inset 0 0 0 1.5px ${primaryLight}`,
								},
								"&.Mui-focused .MuiOutlinedInput-notchedOutline": {
									borderColor: `${primaryLight} !important`,
									borderWidth: "1.5px !important",
								},
								"&.Mui-disabled": {
									opacity: 1,
									bgcolor: "rgba(255,255,255,0.06)",
									boxShadow: "inset 0 0 0 1.5px rgba(255,255,255,0.4)",
								},
								"&.Mui-disabled .MuiOutlinedInput-notchedOutline": {
									borderColor: "rgba(255,255,255,0.4) !important",
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
				border: `1px solid ${alpha(border, 0.45)}`,
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
