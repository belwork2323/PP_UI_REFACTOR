import type { QcApiSubType } from "../../../schema-engine/adapters/qc.adapter";
import { getTrimmingMotorCountOptions } from "../manufacturing/trimmingFlowConfig";
import { resolveQcMotorIdOptions } from "./qcHardwareConfig";

export const QC_TRIMMING_MAIN_BATCH_SUB_TYPE = "MAIN_BATCH" as const;
export const QC_TRIMMING_SUBSCALE_SUB_TYPE = "SUBSCALE" as const;

export type QcTrimmingSubType =
  | typeof QC_TRIMMING_MAIN_BATCH_SUB_TYPE
  | typeof QC_TRIMMING_SUBSCALE_SUB_TYPE;

export const isQcTrimmingSubType = (value: string): value is QcTrimmingSubType =>
  value === QC_TRIMMING_MAIN_BATCH_SUB_TYPE || value === QC_TRIMMING_SUBSCALE_SUB_TYPE;

/** Main-batch trimming only until subscale schema is available. */
export const resolveQcTrimmingSubType = (): QcTrimmingSubType => QC_TRIMMING_MAIN_BATCH_SUB_TYPE;

export const mapQcTrimmingSubTypeToApi = (value: QcTrimmingSubType): QcApiSubType => value;

export const resolveQcTrimmingMotorCountOptions = (
  batch?: { motorId?: string; motorIds?: string[] } | null,
) => {
  const motorOptions = resolveQcMotorIdOptions(batch);
  const maxCount = Math.max(motorOptions.length, 1);
  return getTrimmingMotorCountOptions(maxCount);
};
