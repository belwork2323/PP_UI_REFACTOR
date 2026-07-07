import { OPERATION_STATUS } from "../../operationStatus";

export const MANUFACTURING_STATUS = OPERATION_STATUS;

export type ManufacturingStatus = (typeof MANUFACTURING_STATUS)[keyof typeof MANUFACTURING_STATUS];

export const SUB_DEPT_LABELS: Record<string, string> = {
  "raw-material-prep": "Raw Material Preparation",
  "case-preparation": "Case Preparation",
  mixing: "Mixing",
  "casting-and-curing": "Casting and Curing",
  "post-cure-operations": "Post-Cure Operations",
  subscale: "Subscale",
  trimming: "Trimming",
};

/**
 * Per-sub-department metadata used to configure batch lists and pages.
 * Each entry maps a route slug to its status field name and display labels.
 */
export const SUB_DEPT_CONFIG: Record<string, {
  statusField: string;
  statusLabel: string;
  tableLabel: string;
  emptyText: string;
}> = {
  "raw-material-prep": {
    statusField: "rmStatus",
    statusLabel: "RM Status",
    tableLabel: "Raw material preparation batch list",
    emptyText: "No raw material preparation batches found",
  },
  "case-preparation": {
    statusField: "cpStatus",
    statusLabel: "CP Status",
    tableLabel: "Case preparation batch list",
    emptyText: "No case preparation batches found",
  },
  mixing: {
    statusField: "mxStatus",
    statusLabel: "MX Status",
    tableLabel: "Mixing batch list",
    emptyText: "No mixing batches found",
  },
  "casting-and-curing": {
    statusField: "ccStatus",
    statusLabel: "CC Status",
    tableLabel: "Casting and curing batch list",
    emptyText: "No casting and curing batches found",
  },
  "post-cure-operations": {
    statusField: "pcStatus",
    statusLabel: "PC Status",
    tableLabel: "Post-cure operation batch list",
    emptyText: "No post-cure operation batches found",
  },
  subscale: {
    statusField: "ssStatus",
    statusLabel: "SS Status",
    tableLabel: "Subscale batch list",
    emptyText: "No subscale batches found",
  },
  trimming: {
    statusField: "trStatus",
    statusLabel: "TR Status",
    tableLabel: "Trimming batch list",
    emptyText: "No trimming batches found",
  },
};
