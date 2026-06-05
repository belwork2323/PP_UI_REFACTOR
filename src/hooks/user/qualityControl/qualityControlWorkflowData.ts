import { OPERATION_STATUS } from "../../operationStatus";

export const QUALITY_CONTROL_STATUS = OPERATION_STATUS;

export type QualityControlStatus =
  (typeof QUALITY_CONTROL_STATUS)[keyof typeof QUALITY_CONTROL_STATUS];

export type QualityControlWorkflowView = "list" | "form";
