import type {
  QcApiDivision,
  QcApiSubType,
  QcInhibitorType,
} from "../../../schema-engine/adapters/qc.adapter";
import { STRINGS } from "../../../app/config/strings";

const S = STRINGS.QUALITY_CONTROL.QC_DIVISION;

export const QC_POST_CURE_API_DIVISION = "POST_CURE" as const satisfies QcApiDivision;

export const QC_POST_CURE_SUB_TYPE_LOOSE_FLAP = "LOOSE_FLAP_FILLING" as const;
export const QC_POST_CURE_SUB_TYPE_INHIBITION = "INHIBITION" as const;

export const QC_POST_CURE_OPERATION_LOOSE_FLAP = "LOOSE_FLAP_FILLING" as const;
export const QC_POST_CURE_OPERATION_INHIBITION = "INHIBITION" as const;

export type QcPostCureOperation =
  | typeof QC_POST_CURE_OPERATION_LOOSE_FLAP
  | typeof QC_POST_CURE_OPERATION_INHIBITION;

export type { QcInhibitorType };

export const QC_POST_CURE_OPERATION_OPTIONS = [
  { value: QC_POST_CURE_OPERATION_LOOSE_FLAP, label: S.POST_CURE_OPERATION_LOOSE_FLAP },
  { value: QC_POST_CURE_OPERATION_INHIBITION, label: S.POST_CURE_OPERATION_INHIBITION },
];

export const QC_INHIBITOR_TYPE_OPTIONS = [
  { value: "IR1", label: S.INHIBITOR_TYPE_IR1 },
  { value: "HEMCOAT-3K", label: S.INHIBITOR_TYPE_HEMCOAT_3K },
  { value: "NOT_APPLICABLE", label: S.INHIBITOR_TYPE_NOT_APPLICABLE },
];

export type QcPostCureSchemaSelection = {
  division: QcApiDivision;
  subType: QcApiSubType;
  inhibitorType?: QcInhibitorType;
};

export const isQcPostCureOperation = (value: string): value is QcPostCureOperation =>
  value === QC_POST_CURE_OPERATION_LOOSE_FLAP || value === QC_POST_CURE_OPERATION_INHIBITION;

export const isQcPostCureInhibitionOperation = (operation: string) =>
  operation === QC_POST_CURE_OPERATION_INHIBITION;

export const isQcInhibitorType = (value: string): value is QcInhibitorType =>
  value === "IR1" || value === "HEMCOAT-3K" || value === "NOT_APPLICABLE";

export const resolveQcPostCureSchemaSelection = (
  operation: string,
  inhibitorType: string,
): QcPostCureSchemaSelection | null => {
  if (operation === QC_POST_CURE_OPERATION_LOOSE_FLAP) {
    return {
      division: QC_POST_CURE_API_DIVISION,
      subType: QC_POST_CURE_SUB_TYPE_LOOSE_FLAP,
    };
  }

  if (operation === QC_POST_CURE_OPERATION_INHIBITION) {
    const resolvedInhibitorType = mapQcInhibitorTypeToApi(inhibitorType);
    if (!resolvedInhibitorType) return null;
    return {
      division: QC_POST_CURE_API_DIVISION,
      subType: QC_POST_CURE_SUB_TYPE_INHIBITION,
      inhibitorType: resolvedInhibitorType,
    };
  }

  return null;
};

export const mapQcInhibitorTypeToApi = (value: string): QcInhibitorType | null => {
  if (isQcInhibitorType(value)) return value;
  return null;
};

export const getQcInhibitorTypeLabel = (value: string) =>
  QC_INHIBITOR_TYPE_OPTIONS.find((option) => option.value === value)?.label ?? value;

export const getQcPostCureOperationLabel = (value: string) =>
  QC_POST_CURE_OPERATION_OPTIONS.find((option) => option.value === value)?.label ?? value;
