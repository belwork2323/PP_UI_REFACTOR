import getSourcingTheme from "../../../../app/theme/custom_themes/user/sourcing/sourcing_theme";

/** Match user sourcing batch-list filter field sizing (operations theme). */
export const getApproverSourcingFilterStyles = (mode = "light") => {
  const sourcingTheme = getSourcingTheme(mode);
  const field = sourcingTheme.batchList.filterPanelField;
  const menuItem = sourcingTheme.batchList.filterPanelMenuItem;

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

export default getApproverSourcingFilterStyles;
