import getProjectManagementTheme from "@app/theme/custom_themes/admin/ProjectManagement/projectManagement_theme";

const getMasterDataTheme = (mode: "light" | "dark" = "light") => {
  const base = getProjectManagementTheme(mode);

  return {
    ...base,
    pageHeader: {
      ...base.pageHeader,
      newProjectButton: base.pageHeader.newProjectButton,
    },
    toolbarRow: {
      mb: 2,
      display: "flex",
      gap: 2,
      flexWrap: "wrap",
      alignItems: "center",
    },
    toolbarTypeSelect: {
      minWidth: { xs: "100%", sm: 260 },
      maxWidth: { sm: 320 },
    },
    toolbarFilterSelect: {
      minWidth: { xs: "100%", sm: 160 },
      maxWidth: { sm: 180 },
    },
    statusRowAboveTable: {
      display: "flex",
      flexWrap: "wrap",
      gap: 1.5,
      alignItems: "center",
      mb: 1,
    },
    statusChip: {
      height: 28,
      fontSize: 12,
      fontWeight: 600,
      borderRadius: 1.5,
    },
    content: {
      display: "flex",
      flexDirection: "column",
      gap: 1,
      minWidth: 0,
      width: "100%",
    },
    tableSearchBar: {
      px: 1.25,
      py: 1,
      m: 0,
    },
    searchField: {
      maxWidth: "100%",
      m: 0,
    },
    addRowBar: {
      display: "flex",
      justifyContent: "flex-start",
      pt: 1,
      mt: 0,
    },
    inlineFormCell: {
      "& .MuiOutlinedInput-root": {
        fontSize: "0.8rem",
        bgcolor: "background.paper",
      },
      "& .MuiOutlinedInput-input": {
        py: 0.75,
        px: 1,
      },
    },
  };
};

export default getMasterDataTheme;
