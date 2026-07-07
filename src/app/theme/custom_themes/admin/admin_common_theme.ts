import { getSharedTheme } from "../shared/shared_theme";

/** Admin CRUD chrome tokens shared by Batch, User, and Project management pages. */
export const getAdminCommonTheme = (mode: "light" | "dark" = "light") => {
  return getSharedTheme(mode).adminManagement;
};

export default getAdminCommonTheme;
