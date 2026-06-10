import { STRINGS } from "../../../app/config/strings";

const S = STRINGS.MANUFACTURING.CASE_PREP;

export type CasePrepMotorOption = {
  value: string;
  label: string;
};

/** Mock motor list until API is available. */
export const MOCK_CASE_PREP_MOTOR_OPTIONS: CasePrepMotorOption[] = [
  { value: "Motor-076", label: "Motor-076" },
];

export type CasePrepAddedMotor = {
  motorId: string;
  prrcClearanceDate: string;
};

export const getCasePrepMotorLabel = (motorId: string) =>
  MOCK_CASE_PREP_MOTOR_OPTIONS.find((m) => m.value === motorId)?.label ?? motorId;

export const getCasePrepMotorCountOptions = (motorOptions: CasePrepMotorOption[]) => {
  const count = Math.max(motorOptions.length, 1);
  return Array.from({ length: count }, (_, idx) => ({
    value: String(idx + 1),
    label: String(idx + 1),
  }));
};

export const isMainMotorBatch = (batchType: string | undefined | null) => {
  const normalized = String(batchType ?? "").toUpperCase();
  return normalized === "MAIN" || normalized === "MAIN_BATCH";
};

export const isSubscaleBatch = (batchType: string | undefined | null) => {
  const normalized = String(batchType ?? "").toUpperCase();
  return normalized === "SUBSCALE" || normalized === "SUBSCALE_BATCH";
};

export const supportsCasePrepSchemaFlow = (batchType: string | undefined | null) =>
  isMainMotorBatch(batchType) || isSubscaleBatch(batchType);

export const CASE_PREP_FLOW_LABELS = {
  motorCount: S.MOTOR_COUNT_LABEL,
  motorCountPlaceholder: S.MOTOR_COUNT_PLACEHOLDER,
  motorId: S.MOTOR_ID_LABEL,
  motorIdPlaceholder: S.MOTOR_ID_PLACEHOLDER,
  prrcDate: S.PRRC_CLEARANCE_DATE_LABEL,
  prrcDatePlaceholder: S.PRRC_CLEARANCE_DATE_PLACEHOLDER,
  addMotors: S.ADD_MOTORS_ACTION,
  nonMainBatchMessage: S.NON_MAIN_BATCH_MESSAGE,
  schemaLoading: S.SCHEMA_LOADING,
};
