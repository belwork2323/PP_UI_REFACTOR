import colors from "../../colors";
import fonts from "../../fonts";

/** Shared filter widget tokens used by FilterToggleButton, FilterPanelHeader, etc. */
const getFilterTheme = (mode: "light" | "dark" = "light") => {
  const d = colors.dashboard[mode];

  return {
    icon: {
      fontSize: 18,
      color: d.textSecondary,
    },
    chevron: {
      fontSize: 20,
      color: d.textSecondary,
    },
    label: {
      fontSize: fonts.size.sm,
      fontWeight: fonts.weight.semibold,
      color: d.textPrimary,
    },
  };
};

export default getFilterTheme;
