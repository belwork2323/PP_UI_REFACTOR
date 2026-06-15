import { STRINGS } from "../../../app/config/strings";
import { normalizeBatchScale } from "./rawMaterialPrepFlowConfig";

const S = STRINGS.MANUFACTURING.CASE_PREP;

export type CasePrepMotorOption = {
  value: string;
  label: string;
};

export type CasePrepAddedMotor = {
  motorId: string;
  prrcClearanceDate: string;
};

export const getCasePrepMotorLabel = (motorId: string) => motorId;

export const getCasePrepMotorCountOptions = (motorOptions: CasePrepMotorOption[]) => {
  const optionCount = Math.max(motorOptions.length, 1);
  return Array.from({ length: optionCount }, (_, idx) => ({
    value: String(idx + 1),
    label: String(idx + 1),
  }));
};

export const isMainMotorBatch = (batchType: string | undefined | null) =>
  normalizeBatchScale(batchType) === "mainscale";

export const isSubscaleBatch = (batchType: string | undefined | null) =>
  normalizeBatchScale(batchType) === "subscale";

export const resolveCasePrepMotorOptions = (batch?: {
  motorId?: string;
  motorIds?: Array<string | number>;
} | null): CasePrepMotorOption[] => {
  const ids = Array.isArray(batch?.motorIds)
    ? batch.motorIds.map((id) => String(id).trim()).filter(Boolean)
    : [];

  if (ids.length > 0) {
    return ids.map((id) => ({ value: id, label: id }));
  }

  const singleId = String(batch?.motorId ?? "").trim();
  if (!singleId) return [];

  const parsed = singleId
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  if (parsed.length > 1) {
    return parsed.map((id) => ({ value: id, label: id }));
  }

  return [{ value: singleId, label: singleId }];
};

export const getSelectedCasePrepDraftMotorIds = (
  count: number,
  draftMotorIds: string[],
): string[] =>
  Array.from({ length: count }, (_, idx) => String(draftMotorIds[idx] ?? "").trim()).filter(Boolean);

export const canAddCasePrepMotors = ({
  batchType,
  motorCount,
  draftMotorIds,
  prrcClearanceDate,
  usedMotorIds,
  hasSchema,
  availableMotorOptions,
}: {
  batchType?: string | null;
  motorCount: number | "";
  draftMotorIds: string[];
  prrcClearanceDate: string;
  usedMotorIds: string[];
  hasSchema: boolean;
  availableMotorOptions: CasePrepMotorOption[];
}) => {
  const count = motorCount === "" ? 0 : Number(motorCount);
  const hasMotorOptions = availableMotorOptions.length > 0;
  const isSubscale = isSubscaleBatch(batchType);

  if (isSubscale && hasSchema) {
    return false;
  }

  if (!hasMotorOptions) {
    return isSubscale;
  }

  const selectedIds = getSelectedCasePrepDraftMotorIds(count, draftMotorIds);
  const hasUniqueIds = new Set(selectedIds).size === selectedIds.length;

  return (
    count > 0 &&
    selectedIds.length === count &&
    hasUniqueIds &&
    prrcClearanceDate.trim().length > 0 &&
    selectedIds.every((id) => !usedMotorIds.includes(id))
  );
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
