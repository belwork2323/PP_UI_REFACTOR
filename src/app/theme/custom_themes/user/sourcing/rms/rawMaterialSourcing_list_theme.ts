import { alpha } from "@mui/material";

/** RMS lot list action button tokens. */
export const createRawMaterialSourcingListTheme = (
	palette: Record<string, any>,
	baseTheme: any,
) => {
	const iconAction = (color: string) => ({
		color,
		border: `1px solid ${alpha(color, 0.35)}`,
		borderRadius: 1.5,
		"&:hover": { background: alpha(color, 0.08) },
	});
	return {
		applyButton: { ...baseTheme?.batchList?.action?.primary, textTransform: "none" },
		viewDetailsButton: iconAction(palette.primaryLight ?? "#2E86C1"),
		deleteButton: { flexShrink: 0, ...iconAction(palette.danger ?? "#C0392B") },
	};
};

export const createRawMaterialSourcingHeaderTheme = (palette: Record<string, any>) => ({
	accentChip: {
		background: alpha(palette.primaryLight ?? "#2E86C1", 0.1),
		color: palette.primary ?? "#1B4F72",
		border: `1px solid ${alpha(palette.primaryLight ?? "#2E86C1", 0.25)}`,
	},
});
