import getDashboardTheme from "../admin/Dashboard/dashboard_theme";

/** Shared active-batch table filter tokens for admin Dashboard + System Manager. */
export const getDashboardTableTheme = (mode: "light" | "dark" = "light") =>
  getDashboardTheme(mode).table;

export default getDashboardTableTheme;
