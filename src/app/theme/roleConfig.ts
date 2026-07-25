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
  "Centre Head": {
    Icon: icons.userMgmt.centreHeadRole,
    color: "#1edd18",
    bg: "rgba(3,105,161,0.10)",
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
  "Yet to Assign": {
    Icon: icons.batchMgmt.pendingStatus,
    color: "#64748b",
    bg: "rgba(100,116,139,0.10)",
  },
  Sourcing: { Icon: icons.batchMgmt.sourcingStage, color: "#0369a1", bg: "rgba(3,105,161,0.10)" },
  Manufacturing: {
    Icon: icons.batchMgmt.manufacturingStage,
    color: "#7c3aed",
    bg: "rgba(124,58,237,0.10)",
  },
  "Quality Control": { Icon: icons.batchMgmt.qcStage, color: "#b45309", bg: "rgba(180,83,9,0.10)" },
  Dispatch: { Icon: icons.batchMgmt.dispatchStage, color: "#047857", bg: "rgba(4,120,87,0.10)" },
};

export const batchTypeChipConfig: Record<string, RoleChipConfig> = {
  Main: { Icon: icons.batchMgmt.batchIcon, color: "#1565c0", bg: "#e3f2fd" },
  Subscale: { Icon: icons.batchMgmt.batchIcon, color: "#6a1b9a", bg: "#f3e5f5" },
  Qualification: { Icon: icons.batchMgmt.batchIcon, color: "#6a1b9a", bg: "#f3e5f5" },
  Experimental: { Icon: icons.batchMgmt.batchIcon, color: "#6a1b9a", bg: "#f3e5f5" },
};

/** Chip colors for admin batch list type column */
export const getBatchTypeChipConfig = (batch: {
  batchType?: string | null;
  subBatchType?: string | null;
}) => {
  const type = String(batch?.batchType ?? "")
    .trim()
    .toUpperCase();
  if (type === "MAIN") return batchTypeChipConfig.Main;

  const subType = String(batch?.subBatchType ?? "")
    .trim()
    .toLowerCase()
    .split(/[\s_]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
  if (subType && batchTypeChipConfig[subType]) return batchTypeChipConfig[subType];

  return batchTypeChipConfig.Subscale;
};

/** Batch workflow status (subdepartment batch lists) */
export const batchStatusConfig: Record<string, RoleChipConfig> = {
  // Backend values
  YET_TO_START: {
    Icon: icons.batchMgmt.pendingStatus,
    color: "#64748b",
    bg: "rgba(100,116,139,0.10)",
  },
  TO_BE_INITIATED: {
    Icon: icons.batchMgmt.pendingStatus,
    color: "#475569",
    bg: "rgba(71,85,105,0.08)",
  },
  INITIATED: {
    Icon: icons.batchMgmt.pendingStatus,
    color: "#475569",
    bg: "rgba(71,85,105,0.08)",
  },
  IN_PROGRESS: {
    Icon: icons.batchMgmt.inProgressStatus,
    color: "#2E86C1",
    bg: "rgba(46,134,193,0.10)",
  },
  WAITING_FOR_APPROVAL: {
    Icon: icons.batchMgmt.waitingForApprovalStatus,
    color: "#D4AC0D",
    bg: "rgba(212,172,13,0.10)",
  },
  APPROVED: {
    Icon: icons.batchMgmt.approvedStatus,
    color: "#148F77",
    bg: "rgba(20,143,119,0.10)",
  },
  REJECTED: {
    Icon: icons.batchMgmt.rejectedStatus,
    color: "#C0392B",
    bg: "rgba(192,57,43,0.10)",
  },

  // UI values (aliases)
  "Yet To Start": {
    Icon: icons.batchMgmt.pendingStatus,
    color: "#64748b",
    bg: "rgba(100,116,139,0.10)",
  },
  "To Be Initiated": {
    Icon: icons.batchMgmt.pendingStatus,
    color: "#475569",
    bg: "rgba(71,85,105,0.08)",
  },
  "In Progress": {
    Icon: icons.batchMgmt.inProgressStatus,
    color: "#2E86C1",
    bg: "rgba(46,134,193,0.10)",
  },
  "Waiting for Approval": {
    Icon: icons.batchMgmt.waitingForApprovalStatus,
    color: "#D4AC0D",
    bg: "rgba(212,172,13,0.10)",
  },
  Approved: { Icon: icons.batchMgmt.approvedStatus, color: "#148F77", bg: "rgba(20,143,119,0.10)" },
  Rejected: { Icon: icons.batchMgmt.rejectedStatus, color: "#C0392B", bg: "rgba(192,57,43,0.10)" },
  Draft: { Icon: icons.batchMgmt.pendingStatus, color: "#64748b", bg: "rgba(100,116,139,0.10)" },
  Submitted: {
    Icon: icons.batchMgmt.inProgressStatus,
    color: "#2563eb",
    bg: "rgba(37,99,235,0.10)",
  },
  Completed: {
    Icon: icons.batchMgmt.approvedStatus,
    color: "#148F77",
    bg: "rgba(20,143,119,0.10)",
  },
  "Not Started": {
    Icon: icons.batchMgmt.pendingStatus,
    color: "#475569",
    bg: "rgba(71,85,105,0.08)",
  },
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

/** Named sub-department chip colors — keep in sync across dashboard / batch tables */
export const subDeptConfig: Record<string, { color: string; bg: string }> = {
  "Yet to Assign": { color: "#64748b", bg: "rgba(100,116,139,0.10)" },
  // Sourcing
  "Raw Material": { color: "#0369a1", bg: "rgba(3,105,161,0.10)" },
  "Raw Material Sourcing": { color: "#0369a1", bg: "rgba(3,105,161,0.10)" },
  "Rocket Motor Casing": { color: "#0e7490", bg: "rgba(14,116,144,0.10)" },
  // Manufacturing
  "Raw Material Preparation": { color: "#1d4ed8", bg: "rgba(29,78,216,0.10)" },
  "Case Preparation": { color: "#7c3aed", bg: "rgba(124,58,237,0.10)" },
  Mixing: { color: "#c026d3", bg: "rgba(192,38,211,0.10)" },
  "Casting and Curing": { color: "#b45309", bg: "rgba(180,83,9,0.10)" },
  "Post-Cure Operations": { color: "#ea580c", bg: "rgba(234,88,12,0.10)" },
  Subscale: { color: "#047857", bg: "rgba(4,120,87,0.10)" },
  Trimming: { color: "#0f766e", bg: "rgba(15,118,110,0.10)" },
  // Quality
  "Quality Control": { color: "#b45309", bg: "rgba(180,83,9,0.10)" },
  "Raw Material Revalidation": { color: "#a16207", bg: "rgba(161,98,7,0.10)" },
  "QC Division": { color: "#ca8a04", bg: "rgba(202,138,4,0.10)" },
  NDT: { color: "#d97706", bg: "rgba(217,119,6,0.10)" },
  "Static Test Facility": { color: "#c2410c", bg: "rgba(194,65,12,0.10)" },
  // Dispatch
  Dispatch: { color: "#047857", bg: "rgba(4,120,87,0.10)" },
};

const hashString = (value: string) => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (Math.imul(31, hash) + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
};

/** Stable chip color for a sub-department name (named map first, then hash fallback). */
export const getSubDeptChipConfig = (subDeptName: string | null | undefined) => {
  const name = String(subDeptName ?? "").trim();
  if (!name || name === "NA" || name === "—") {
    return deptColorMap[0];
  }
  if (subDeptConfig[name]) return subDeptConfig[name];

  const normalized = name.toLowerCase();
  const namedHit = Object.entries(subDeptConfig).find(([key]) => key.toLowerCase() === normalized);
  if (namedHit) return namedHit[1];

  return deptColorMap[hashString(normalized) % deptColorMap.length];
};

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
