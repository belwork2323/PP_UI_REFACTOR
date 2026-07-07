import { STRINGS } from "../../../app/config/strings";
import { resolveTrimmingMotorStageNumber } from "../../../schema-engine";

const S = STRINGS.MANUFACTURING.TRIMMING;

export type TrimmingMotorOption = {
  value: string;
  label: string;
};

export type TrimmingAddedMotor = {
  motorId: string;
  motorStage: string;
  motorReceivedAt: string;
};

export type TrimmingMotorStageOption = {
  value: string;
  label: string;
  noOfmotors: number;
};

export const resolveTrimmingMotorOptions = (batch?: {
  motorId?: string;
  motorIds?: Array<string | number>;
} | null): TrimmingMotorOption[] => {
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

export const mapApprovedMotorsToOptions = (
  motors: Array<{ motorId?: string; motorNo?: string }>,
): TrimmingMotorOption[] =>
  motors
    .map((motor) => {
      const id = String(motor.motorId ?? motor.motorNo ?? "").trim();
      return id ? { value: id, label: id } : null;
    })
    .filter((item): item is TrimmingMotorOption => Boolean(item));

export const getTrimmingMotorCountOptions = (maxCount: number) => {
  const count = Math.max(maxCount, 0);
  return Array.from({ length: count }, (_, idx) => ({
    value: String(idx + 1),
    label: String(idx + 1),
  }));
};

export const getSelectedTrimmingDraftMotorIds = (
  count: number,
  draftMotorIds: string[],
): string[] =>
  Array.from({ length: count }, (_, idx) => String(draftMotorIds[idx] ?? "").trim()).filter(Boolean);

/** When count is unset but a motor is picked, treat as a single-motor selection. */
export const resolveEffectiveTrimmingMotorCount = (
  motorCount: number | "",
  draftMotorIds: string[],
): number => {
  const count = motorCount === "" ? 0 : Number(motorCount);
  if (count > 0) return count;
  return draftMotorIds.some((id) => String(id ?? "").trim().length > 0) ? 1 : 0;
};

export const mergeTrimmingMotorOptions = (
  approved: TrimmingMotorOption[],
  batch: TrimmingMotorOption[],
): TrimmingMotorOption[] => {
  const seen = new Set<string>();
  const merged: TrimmingMotorOption[] = [];

  for (const option of [...approved, ...batch]) {
    const value = String(option.value ?? "").trim();
    if (!value || seen.has(value)) continue;
    seen.add(value);
    merged.push({ value, label: option.label || value });
  }

  return merged;
};

export const resolveTrimmingMotorCountLimit = ({
  selectedStage,
  availableMotorOptions,
  batchNumberOfMotors,
}: {
  selectedStage?: TrimmingMotorStageOption | null;
  availableMotorOptions: TrimmingMotorOption[];
  batchNumberOfMotors?: number;
}) => {
  const stageLimit = Number(selectedStage?.noOfmotors ?? 0);
  const optionLimit = availableMotorOptions.length;
  const batchLimit = Number(batchNumberOfMotors ?? 0);

  if (stageLimit > 0 && optionLimit > 0) return Math.min(stageLimit, optionLimit);
  if (stageLimit > 0) return stageLimit;
  if (batchLimit > 0) return batchLimit;
  return Math.max(optionLimit, 1);
};

export const canLoadTrimmingForm = ({
  selectedMotorStage,
  motorCount,
  draftMotorIds,
  motorReceivedAt,
  usedMotorIds,
  trimmingFormLoaded,
  availableMotorOptions,
  maxMotorCount,
}: {
  selectedMotorStage: string;
  motorCount: number | "";
  draftMotorIds: string[];
  motorReceivedAt: string;
  usedMotorIds: string[];
  trimmingFormLoaded: boolean;
  availableMotorOptions: TrimmingMotorOption[];
  maxMotorCount: number;
}) => {
  if (!String(selectedMotorStage ?? "").trim()) return false;
  if (trimmingFormLoaded) return false;

  const count = resolveEffectiveTrimmingMotorCount(motorCount, draftMotorIds);
  if (count <= 0 || count > maxMotorCount) return false;
  if (availableMotorOptions.length === 0) return false;

  const selectedIds = getSelectedTrimmingDraftMotorIds(count, draftMotorIds);
  const hasUniqueIds = new Set(selectedIds).size === selectedIds.length;

  return (
    selectedIds.length === count &&
    hasUniqueIds &&
    motorReceivedAt.trim().length > 0 &&
    selectedIds.every((id) => !usedMotorIds.includes(id))
  );
};

export const canAddTrimmingMotors = ({
  selectedMotorStage,
  motorCount,
  draftMotorIds,
  motorReceivedAt,
  usedMotorIds,
  trimmingFormLoaded,
  availableMotorOptions,
  maxMotorCount,
}: {
  selectedMotorStage: string;
  motorCount: number | "";
  draftMotorIds: string[];
  motorReceivedAt: string;
  usedMotorIds: string[];
  trimmingFormLoaded: boolean;
  availableMotorOptions: TrimmingMotorOption[];
  maxMotorCount: number;
}) => {
  if (!trimmingFormLoaded) return false;
  if (!String(selectedMotorStage ?? "").trim()) return false;

  const count = resolveEffectiveTrimmingMotorCount(motorCount, draftMotorIds);
  if (count <= 0 || count > maxMotorCount) return false;
  if (availableMotorOptions.length === 0) return false;

  const selectedIds = getSelectedTrimmingDraftMotorIds(count, draftMotorIds);
  const hasUniqueIds = new Set(selectedIds).size === selectedIds.length;

  return (
    selectedIds.length === count &&
    hasUniqueIds &&
    motorReceivedAt.trim().length > 0 &&
    selectedIds.every((id) => !usedMotorIds.includes(id))
  );
};

export const resolveTrimmingSchemaMotorStage = (motorStage: string | number | null | undefined) =>
  resolveTrimmingMotorStageNumber({ motorStage });

export const TRIMMING_FLOW_LABELS = {
  motorStage: S.MOTOR_STAGE_LABEL,
  motorStagePlaceholder: S.MOTOR_STAGE_PLACEHOLDER,
  motorCount: S.MOTOR_COUNT_LABEL,
  motorCountPlaceholder: S.MOTOR_COUNT_PLACEHOLDER,
  motorId: S.MOTOR_ID_LABEL,
  motorIdPlaceholder: S.MOTOR_ID_PLACEHOLDER,
  motorReceivedAt: S.MOTOR_RECEIVED_AT_LABEL,
  motorReceivedAtPlaceholder: S.MOTOR_RECEIVED_AT_PLACEHOLDER,
  loadForm: S.LOAD_FORM_ACTION,
  addMotors: S.ADD_MOTORS_ACTION,
  schemaLoading: S.SCHEMA_LOADING,
  motorStagesLoading: S.MOTOR_STAGES_LOADING,
  approvedMotorsLoading: S.APPROVED_MOTORS_LOADING,
};
