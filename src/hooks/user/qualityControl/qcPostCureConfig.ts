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

export const QC_POST_CURE_SECTION_IDS = {
  LOOSE_FLAP_FILLING: "LOOSE_FLAP_FILLING",
  IR1_QUALIFICATION: "INHIBITOR_QUALIFICATION_DETAILS",
  HEMCOAT_QUALIFICATION: "HEMCOAT_3K_QUALIFICATION",
  APPLICATION: "INHIBITION_APPLICATION_DETAILS",
  NOT_APPLICABLE: "INHIBITION_NOT_APPLICABLE",
} as const;

export const QC_POST_CURE_TABLE_IDS = {
  BELLOW_BONDING: "BELLOW_BONDING_DETAILS",
  LF_EPOXY_QUALIFICATION: "LF_EPOXY_QUALIFICATION",
  LF_EPOXY_FILLING: "LF_EPOXY_FILLING_DETAILS",
  IR1_QUALIFICATION: "IR1_QUALIFICATION",
  HEMCOAT_QUALIFICATION: "HEMCOAT_3K_QUALIFICATION",
  APPLICATION: "INHIBITION_APPLICATION_DETAILS",
} as const;

export const QC_POST_CURE_SECTION_TITLES: Record<string, string> = {
  [QC_POST_CURE_SECTION_IDS.LOOSE_FLAP_FILLING]: "Loose Flap Filling",
  [QC_POST_CURE_SECTION_IDS.IR1_QUALIFICATION]: "IR-1 Qualification Details",
  [QC_POST_CURE_SECTION_IDS.HEMCOAT_QUALIFICATION]: "HEMCOAT-3K Qualification Details",
  [QC_POST_CURE_SECTION_IDS.APPLICATION]: "Inhibition Application Details",
  [QC_POST_CURE_SECTION_IDS.NOT_APPLICABLE]: "Inhibition Not Applicable",
};

export const QC_POST_CURE_GROUP_TITLES = {
  BELLOW_BONDING: "Bellow Bonding Details",
  LF_EPOXY_DETAILS: "Loose Flap Epoxy Details",
  LF_EPOXY_QUALIFICATION: "Qualification Details",
  LF_EPOXY_FILLING: "LF Epoxy Filling Details",
} as const;

export const QC_POST_CURE_FIELD_LABELS = {
  LF_EPOXY_BATCH_NO: "Batch No",
  LF_EPOXY_PREPARATION_DATE: "Date of Preparation",
  LF_EPOXY_QC_REPORT: "Upload QC Report",
  IR1_BATCH_NO: "Batch No",
  IR1_PREPARATION_DATE: "Date of Preparation",
  IR1_QC_REPORT: "Upload QC Report",
  HEMCOAT_3K_BATCH_NO: "Batch No",
  HEMCOAT_3K_PREPARATION_DATE: "Date of Preparation",
  DISPATCH_DATE: "Date of Dispatch",
  DISPATCH_STATION: "Station",
  REMARKS: "Remarks",
} as const;

export type QcPostCureLocationRow = {
  SR_NO: number;
  LOCATION: string;
  FROM_DATE: string;
  TO_DATE: string;
  OBSERVATIONS: string;
  QTY_FILLED?: string;
  QTY_APPLIED?: string;
};

export type QcPostCureQualificationRow = {
  SR_NO: number;
  PARAMETER: string;
  SPECIFICATION: string;
  RESULT: string;
  QC_REPORT?: string;
};

export const QC_POST_CURE_HE_NE_PRESET: Array<Pick<QcPostCureLocationRow, "SR_NO" | "LOCATION">> = [
  { SR_NO: 1, LOCATION: "HE Side" },
  { SR_NO: 2, LOCATION: "NE Side" },
];

export const QC_POST_CURE_LF_QUALIFICATION_PRESET: Array<
  Pick<QcPostCureQualificationRow, "SR_NO" | "PARAMETER" | "SPECIFICATION">
> = [
  { SR_NO: 1, PARAMETER: "Tensile Strength, ksc", SPECIFICATION: "≥40" },
  { SR_NO: 2, PARAMETER: "% Elongation", SPECIFICATION: "≥25" },
];

export const QC_POST_CURE_IR1_QUALIFICATION_PRESET: Array<
  Pick<QcPostCureQualificationRow, "SR_NO" | "PARAMETER" | "SPECIFICATION">
> = [
  { SR_NO: 1, PARAMETER: "Tensile Strength, ksc", SPECIFICATION: ">8" },
  { SR_NO: 2, PARAMETER: "% Elongation", SPECIFICATION: ">30" },
];

export const QC_POST_CURE_HEMCOAT_QUALIFICATION_PRESET: Array<
  Pick<QcPostCureQualificationRow, "SR_NO" | "PARAMETER" | "SPECIFICATION">
> = [
  { SR_NO: 1, PARAMETER: "Tensile Strength, ksc", SPECIFICATION: ">25" },
  { SR_NO: 2, PARAMETER: "% Elongation", SPECIFICATION: ">100" },
];

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

export const resolveQcSectionInhibitorType = (
  division: QcApiDivision,
  sectionSubType: QcApiSubType,
  inhibitorType?: string | null,
): QcInhibitorType | undefined => {
  if (
    division !== QC_POST_CURE_API_DIVISION ||
    sectionSubType !== QC_POST_CURE_SUB_TYPE_INHIBITION ||
    !inhibitorType
  ) {
    return undefined;
  }
  return mapQcInhibitorTypeToApi(inhibitorType) ?? undefined;
};

export const getQcInhibitorTypeLabel = (value: string) =>
  QC_INHIBITOR_TYPE_OPTIONS.find((option) => option.value === value)?.label ?? value;

export const getQcPostCureOperationLabel = (value: string) =>
  QC_POST_CURE_OPERATION_OPTIONS.find((option) => option.value === value)?.label ?? value;

export const getQcPostCureMotorLabel = (
  motorId?: string | null,
  subType?: string | null,
  inhibitorType?: string | null,
) => {
  const motor = motorId?.trim() || "Motor";
  if (subType === QC_POST_CURE_SUB_TYPE_LOOSE_FLAP) {
    return `${motor} — ${S.POST_CURE_OPERATION_LOOSE_FLAP}`;
  }
  if (subType === QC_POST_CURE_SUB_TYPE_INHIBITION) {
    const inhibitor = inhibitorType ? getQcInhibitorTypeLabel(inhibitorType) : S.POST_CURE_OPERATION_INHIBITION;
    return `${motor} — ${S.POST_CURE_OPERATION_INHIBITION} (${inhibitor})`;
  }
  return motor;
};
