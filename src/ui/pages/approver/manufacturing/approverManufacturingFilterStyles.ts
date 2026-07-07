import getManufacturingTheme from "../../../../app/theme/custom_themes/user/manufacturing/manufacturing_theme";

/** Match user manufacturing batch-list filter field sizing. */
export const getApproverManufacturingFilterStyles = (mode = "light") => {
  const theme = getManufacturingTheme(mode);
  const field = theme.batchList.filterPanelField;
  const menuItem = theme.batchList.filterPanelMenuItem;

  return {
    field,
    fieldWide: { ...field, minWidth: { xs: "100%", sm: 160 } },
    fieldDate: { ...field, minWidth: { xs: "100%", sm: 140 } },
    selectProps: {
      MenuProps: {
        PaperProps: {
          sx: { "& .MuiMenuItem-root": menuItem },
        },
      },
    },
  };
};

export default getApproverManufacturingFilterStyles;
