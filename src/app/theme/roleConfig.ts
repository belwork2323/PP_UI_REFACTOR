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

export const stageConfig: Record<string, RoleChipConfig> = {
  Sourcing: { Icon: icons.batchMgmt.sourcingStage, color: "#0369a1", bg: "rgba(3,105,161,0.10)" },
  Manufacturing: { Icon: icons.batchMgmt.manufacturingStage, color: "#7c3aed", bg: "rgba(124,58,237,0.10)" },
  "Quality Control": { Icon: icons.batchMgmt.qcStage, color: "#b45309", bg: "rgba(180,83,9,0.10)" },
  Dispatch: { Icon: icons.batchMgmt.dispatchStage, color: "#047857", bg: "rgba(4,120,87,0.10)" },
};

/** Batch workflow statuses (subdepartment batch lists) */
export const batchStatusConfig: Record<string, RoleChipConfig> = {
  Initiated: { Icon: icons.batchMgmt.pendingStatus, color: "#475569", bg: "rgba(71,85,105,0.08)" },
  "In Progress": { Icon: icons.batchMgmt.inProgressStatus, color: "#2E86C1", bg: "rgba(46,134,193,0.10)" },
  "Waiting for Approval": { Icon: icons.batchMgmt.waitingForApprovalStatus, color: "#D4AC0D", bg: "rgba(212,172,13,0.10)" },
  Approved: { Icon: icons.batchMgmt.approvedStatus, color: "#148F77", bg: "rgba(20,143,119,0.10)" },
  Rejected: { Icon: icons.batchMgmt.rejectedStatus, color: "#C0392B", bg: "rgba(192,57,43,0.10)" },
};

export const priorityConfig: Record<string, { color: string; bg: string }> = {
  Low: { color: "#16a34a", bg: "rgba(22,163,74,0.10)" },
  Medium: { color: "#b45309", bg: "rgba(180,83,9,0.10)" },
  High: { color: "#dc2626", bg: "rgba(220,38,38,0.10)" },
  Critical: { color: "#7c3aed", bg: "rgba(124,58,237,0.10)" },
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
