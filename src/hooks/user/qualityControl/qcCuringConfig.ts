import { STRINGS } from "../../../app/config/strings";
import type { QcApiSubType } from "../../../schema-engine/adapters/qc.adapter";

const S = STRINGS.QUALITY_CONTROL.QC_DIVISION;

export const QC_CURING_TYPE_OPTIONS = [
  { value: "NORMAL", label: S.CURING_TYPE_NORMAL },
  { value: "CONFINED", label: S.CURING_TYPE_CONFINED },
  { value: "N2_PRESSURE", label: S.CURING_TYPE_N2_PRESSURE },
] as const;

export type QcCuringSubType = (typeof QC_CURING_TYPE_OPTIONS)[number]["value"];

export const isQcCuringSubType = (value: string): value is QcCuringSubType =>
  QC_CURING_TYPE_OPTIONS.some((option) => option.value === value);

export const getQcCuringTypeLabel = (subType: string) =>
  QC_CURING_TYPE_OPTIONS.find((option) => option.value === subType)?.label ?? subType;

export const mapQcCuringTypeToSubType = (value: string): QcApiSubType =>
  isQcCuringSubType(value) ? value : null;
