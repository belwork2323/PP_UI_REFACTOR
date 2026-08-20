import { STRINGS } from "../../../app/config/strings";

const S = STRINGS.QUALITY_CONTROL.QC_DIVISION;

export const QC_DE_CORING_SECTION_IDS = {
  DETAILS: "DE_CORING_DETAILS",
} as const;

export const QC_DE_CORING_MANUFACTURING_SECTION_ID = "DECORING_DETAILS";

export const QC_DE_CORING_SECTION_TITLES: Record<string, string> = {
  [QC_DE_CORING_SECTION_IDS.DETAILS]: "De-coring Details",
};

export type QcDeCoringField =
  | "DE_CORING_LOAD"
  | "DE_CORING_DATE_TIME"
  | "OBSERVATIONS";

export const QC_DE_CORING_FIELD_LABELS: Record<QcDeCoringField, string> = {
  DE_CORING_LOAD: "De-coring Load",
  DE_CORING_DATE_TIME: "Date & Time of De-coring",
  OBSERVATIONS: "Observations",
};

export const getQcDeCoringMotorLabel = (motorId?: string | null) =>
  motorId?.trim() || S.DE_CORING_MOTOR_ID_LABEL;
