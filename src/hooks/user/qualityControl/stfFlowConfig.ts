import type { StfSubType } from "../../../schema-engine";
import { mapStfSubType } from "../../../schema-engine";
import { mapApprovedMotorsToOptions as mapTrimmingApprovedMotorsToOptions } from "../manufacturing/trimmingFlowConfig";

export type STFBatch = {
  id: number | string;
  batchId: string;
  lotId: string;
  motorId: string;
  motorIds?: string[];
  motorType: string;
  motorStage?: string | number;
  projectId?: string;
  projectName?: string;
  numberOfMotors?: number;
  priority: string;
  assignedTo: { fullName: string } | null;
  createdOn: string;
  stfStatus: string;
  formId?: string | null;
  subType?: StfSubType | null;
  motorIdNo?: string | null;
  rejectionReason?: string | null;
};

export type StfMotorTypeOption = {
  value: StfSubType;
  label: string;
};

export type StfMotorOption = { value: string; label: string; disabled?: boolean };

export type StfAddedMotor = { motorId: string; subType: StfSubType };

export const STF_MOTOR_TYPE_OPTIONS: StfMotorTypeOption[] = [
  { value: "BEM", label: "BEM" },
  { value: "MAIN_MOTOR", label: "Main Motor" },
];

export const STF_FLOW_LABELS = {
  motorType: "Motor Type",
  motorTypePlaceholder: "Select motor type",
  motorId: "Motor ID",
  motorIdPlaceholder: "Select motor",
  bemNo: "BEM No.",
  bemNoPlaceholder: "Enter BEM number",
  motorCount: "No. of motors",
  motorCountPlaceholder: "Select count",
  loadForm: "Load Form",
  addMotors: "Add Motors",
  addBem: "Add BEM",
  loadingSchema: "Loading schema...",
  approvedMotorsLoading: "Loading approved motors...",
  setupHint: "Add main motors and BEM motors to the same batch. Switch motor type to add each kind.",
  setupHintMainMotor: "Select approved motor ID(s), then load or add main motors.",
  setupHintMainMotorLoaded: "Select more main motor IDs below to add additional motors.",
  setupHintBem: "Enter a BEM number, then load or add BEM motors.",
  setupHintBemLoaded: "Enter another BEM number below to add more BEM motors.",
  motorNavTitle: "Motor navigation",
  motorNavHint: "Switch between motors to fill static testing details.",
  motorCardTitle: "Motor",
  bemCardTitle: "BEM",
  navBack: "Back",
  navNext: "Next",
};

export const mergeStfMockBatches = (apiBatches: STFBatch[]): STFBatch[] => apiBatches;

export const resolveBatchProjectId = (batch?: STFBatch | null) =>
  String(batch?.projectId ?? batch?.projectName ?? "").trim();

export const resolveBatchMotorStage = (batch?: STFBatch | null) => {
  const stage = batch?.motorStage ?? batch?.motorType;
  if (stage == null || stage === "") return "";
  return String(stage).trim();
};

export const resolveStfMotorOptions = (batch?: STFBatch | null): StfMotorOption[] => {
  const ids = Array.isArray(batch?.motorIds)
    ? batch.motorIds.map((id) => String(id).trim()).filter(Boolean)
    : [];

  if (ids.length > 0) {
    return ids.map((value) => ({ value, label: value }));
  }

  const singleId = String(batch?.motorId ?? "").trim();
  if (!singleId) return [];

  const parsed = singleId
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  if (parsed.length > 1) {
    return parsed.map((value) => ({ value, label: value }));
  }

  return [{ value: singleId, label: singleId }];
};

export const mapApprovedMotorsToOptions = mapTrimmingApprovedMotorsToOptions;

export const mergeStfMotorOptions = (
  approved: StfMotorOption[],
  batch: StfMotorOption[],
): StfMotorOption[] => {
  const seen = new Set<string>();
  const merged: StfMotorOption[] = [];

  for (const option of [...approved, ...batch]) {
    const value = String(option.value ?? "").trim();
    if (!value || seen.has(value)) continue;
    seen.add(value);
    merged.push({ value, label: option.label || value });
  }

  return merged;
};

export const getStfMotorCountOptions = (maxCount: number) =>
  Array.from({ length: Math.max(maxCount, 0) }, (_, idx) => ({
    value: String(idx + 1),
    label: String(idx + 1),
  }));

export const getSelectedStfDraftMotorIds = (count: number, draftMotorIds: string[]): string[] =>
  Array.from({ length: count }, (_, idx) => String(draftMotorIds[idx] ?? "").trim()).filter(Boolean);

export const resolveEffectiveStfMotorCount = (motorCount: number | "", draftMotorIds: string[]): number => {
  const count = motorCount === "" ? 0 : Number(motorCount);
  if (count > 0) return count;
  return draftMotorIds.some((id) => String(id ?? "").trim().length > 0) ? 1 : 0;
};

export const resolveStfMotorCountLimit = ({
  availableMotorOptions,
  batchNumberOfMotors,
}: {
  availableMotorOptions: StfMotorOption[];
  batchNumberOfMotors?: number;
}) => {
  const optionLimit = availableMotorOptions.length;
  const batchLimit = Number(batchNumberOfMotors ?? 0);
  if (batchLimit > 0 && optionLimit > 0) return Math.min(batchLimit, optionLimit);
  if (batchLimit > 0) return batchLimit;
  return Math.max(optionLimit, 1);
};

export const hasStfMotorsOfSubType = (addedMotors: StfAddedMotor[], subType: StfSubType) =>
  addedMotors.some((motor) => motor.subType === subType);

export const canLoadStfMainMotorForm = ({
  motorCount,
  draftMotorIds,
  usedMotorIds,
  hasMainMotors,
  availableMotorOptions,
  maxMotorCount,
}: {
  motorCount: number | "";
  draftMotorIds: string[];
  usedMotorIds: string[];
  hasMainMotors: boolean;
  availableMotorOptions: StfMotorOption[];
  maxMotorCount: number;
}) => {
  if (hasMainMotors) return false;
  if (availableMotorOptions.length === 0 || maxMotorCount <= 0) return false;

  const count = resolveEffectiveStfMotorCount(motorCount, draftMotorIds);
  if (count <= 0 || count > maxMotorCount) return false;

  const selectedIds = getSelectedStfDraftMotorIds(count, draftMotorIds);
  if (selectedIds.length !== count) return false;
  if (new Set(selectedIds).size !== selectedIds.length) return false;
  return !selectedIds.some((id) => usedMotorIds.includes(id));
};

export const canAddStfMainMotors = ({
  motorCount,
  draftMotorIds,
  usedMotorIds,
  usedMainMotorIds,
  hasMainMotors,
  availableMotorOptions,
  maxMotorCount,
}: {
  motorCount: number | "";
  draftMotorIds: string[];
  usedMotorIds: string[];
  usedMainMotorIds: string[];
  hasMainMotors: boolean;
  availableMotorOptions: StfMotorOption[];
  maxMotorCount: number;
}) => {
  if (!hasMainMotors) return false;
  if (availableMotorOptions.length === 0 || maxMotorCount <= 0) return false;

  const count = resolveEffectiveStfMotorCount(motorCount, draftMotorIds);
  if (count <= 0) return false;

  const selectedIds = getSelectedStfDraftMotorIds(count, draftMotorIds);
  if (selectedIds.length !== count) return false;
  if (new Set(selectedIds).size !== selectedIds.length) return false;

  const newIds = selectedIds.filter((id) => !usedMotorIds.includes(id));
  return newIds.length > 0 && usedMainMotorIds.length + newIds.length <= maxMotorCount;
};

export const canLoadStfBemForm = (bemNo: string, usedMotorIds: string[], hasBemMotors: boolean) => {
  if (hasBemMotors) return false;
  const trimmed = String(bemNo ?? "").trim();
  if (!trimmed) return false;
  return !usedMotorIds.includes(trimmed);
};

export const canAddStfBemMotor = (bemNo: string, usedMotorIds: string[], hasBemMotors: boolean) => {
  if (!hasBemMotors) return false;
  const trimmed = String(bemNo ?? "").trim();
  if (!trimmed) return false;
  return !usedMotorIds.includes(trimmed);
};

/** @deprecated Use canLoadStfMainMotorForm / canLoadStfBemForm */
export const canLoadStfForm = (subType: string, motorIdNo: string) => {
  if (!String(subType ?? "").trim()) return false;
  if (mapStfSubType(subType) === "MAIN_MOTOR") {
    return String(motorIdNo ?? "").trim().length > 0;
  }
  return true;
};
