import type { ElementType } from "react";
import { icons } from "./icons";

export type RoleChipConfig = {
  Icon: ElementType;
  color: string;
  bg: string;
};

export const roleConfig: Record<string, RoleChipConfig> = {
  Admin: {
    Icon: icons.userMgmt.adminRole,
    color: "#7c3aed",
    bg: "rgba(124,58,237,0.10)",
  },
  "System Manager": {
    Icon: icons.userMgmt.managerRole,
    color: "#0369a1",
    bg: "rgba(3,105,161,0.10)",
  },
  Approver: {
    Icon: icons.userMgmt.approverRole,
    color: "#b45309",
    bg: "rgba(180,83,9,0.10)",
  },
  User: {
    Icon: icons.userMgmt.userRole,
    color: "#047857",
    bg: "rgba(4,120,87,0.10)",
  },
};

export const statusConfig: Record<string, RoleChipConfig> = {
  Active: {
    Icon: icons.userMgmt.activeStatus,
    color: "#16a34a",
    bg: "rgba(22,163,74,0.10)",
  },
  Inactive: {
    Icon: icons.userMgmt.inactiveStatus,
    color: "#dc2626",
    bg: "rgba(220,38,38,0.10)",
  },
};

const deptColorMap = [
  { color: "#0369a1", bg: "rgba(3,105,161,0.10)" },
  { color: "#7c3aed", bg: "rgba(124,58,237,0.10)" },
  { color: "#b45309", bg: "rgba(180,83,9,0.10)" },
  { color: "#047857", bg: "rgba(4,120,87,0.10)" },
  { color: "#9d174d", bg: "rgba(157,23,77,0.10)" },
];

export const getDeptConfig = (deptName: string, departments: { departmentName?: string }[]) => {
  const idx = departments.findIndex((d) => d.departmentName === deptName);
  return deptColorMap[idx >= 0 ? idx % deptColorMap.length : 0];
};

export const ROLE_ICON_MAP: Record<string, ElementType> = {
  ADMIN: icons.userMgmt.adminRole,
  SYSTEM_MANAGER: icons.userMgmt.managerRole,
  APPROVER: icons.userMgmt.approverRole,
  USER: icons.userMgmt.userRole,
};

export const normalizeRoleKey = (role = "") =>
  String(role).trim().replace(/\s+/g, "_").toUpperCase();

export const getInitials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

export const formatRoleLabel = (role = "") =>
  String(role)
    .toLowerCase()
    .replace(/\s+/g, "_")
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
