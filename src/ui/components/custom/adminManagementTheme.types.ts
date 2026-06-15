/**
 * Theme contract for Admin Management shared UI components.
 * Feature themes (userManagement_theme, batchManagement_theme) extend
 * `getSharedTheme(mode).adminManagement` and pass slices via the `t` prop.
 */
export type {
  AdminManagementColumn,
  AdminManagementTableTheme,
  AdminManagementDataTableProps,
} from "./AdminManagementDataTable";

export type { AdminManagementStatItem } from "./AdminManagementStatsGrid";
