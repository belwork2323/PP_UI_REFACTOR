/**
 * UserConfigs.tsx
 *
 * Pure data-accessor helpers for the User Management module.
 * Visual style configs (roleConfig, statusConfig, getDeptConfig) now live in
 * userManagement_theme.ts and are re-exported here for backwards compatibility.
 */

// Re-export style configs from their canonical home in the theme
export { roleConfig, statusConfig, getDeptConfig } from "../../../../../../app/theme/custom_themes/admin/userManagement_theme";

// ── Pure field accessor helpers ──────────────────────────────────────────────
export const getDisplayName = (u: any): string => u.fullName || u.name || "—";
export const getUsername    = (u: any): string => u.username || u.userId || "—";
export const getDept        = (u: any): string => u.department || u.dept || "—";
export const getSubDepts    = (u: any): any[] => Array.isArray(u.subDepartments) ? u.subDepartments : [];
export const getStatus      = (u: any): string =>
  u.isActive !== undefined
    ? (u.isActive ? "Active" : "Inactive")
    : (u.status || "Active");
export const getCreatedOn   = (u: any) => u.createdOn || u.createdAt || null;
export const getCreatedBy   = (u: any) => u.createdBy ?? null;