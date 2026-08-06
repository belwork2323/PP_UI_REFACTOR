import { OPERATION_STATUS } from "../../operationStatus";
import { normalizeMotorStage } from "../../../data/models/admin/BatchManagement/BatchManagementModel";

export type DispatchBatch = {
  id: number | string;
  batchId: string;
  projectId?: string;
  projectName?: string;
  motorId: string;
  motorIds?: string[];
  motorType: string;
  motorStage?: string;
  priority: string;
  assignedTo: { fullName: string } | null;
  createdOn: string;
  dispatchStatus: string;
  formId?: string | null;
  rejectionReason?: string | null;
};

export type DispatchStageOption = {
  value: string;
  label: string;
};

export type DispatchMotorOption = {
  motorId: string;
  motorStage?: string;
};

export type DispatchAddedMotor = {
  motorId: string;
};

export const DISPATCH_STAGE_OPTIONS: DispatchStageOption[] = [
  { value: "0", label: "Stage 0" },
  { value: "1", label: "Stage 1" },
  { value: "2", label: "Stage 2" },
  { value: "3", label: "Stage 3" },
];

export const DISPATCH_YES_NO_OPTIONS = [
  { value: "YES", label: "YES" },
  { value: "NO", label: "NO" },
];

export const DISPATCH_FLOW_LABELS = {
  stage: "Stage",
  stagePlaceholder: "Select stage",
  motorId: "Motor ID",
  motorIdPlaceholder: "Select motor ID",
  castingDate: "Date of Casting",
  dispatchDate: "Dispatch Date",
  dispatchLocation: "Dispatch Location",
  dispatchLocationPlaceholder: "Enter dispatch location",
  ndtClearance: "NDT Clearance Accorded",
  ndtMomNo: "NDT MOM No.",
  ndtMomNoPlaceholder: "Enter NDT MOM number",
  finalAcceptanceClearance: "Final Acceptance Committee Clearance Accorded",
  finalAcceptanceMomNo: "Final Acceptance MOM No.",
  finalAcceptanceMomNoPlaceholder: "Enter final acceptance MOM number",
  loadForm: "Load Form",
  addMotor: "Add Motor",
  loadingSchema: "Loading schema...",
  setupHint: "Select a motor ID, then load the dispatch form.",
  setupHintLoaded: "Select another motor ID below to add more motors.",
  motorNavTitle: "Motor navigation",
  motorNavHint: "Switch between motors to fill dispatch details.",
  motorCardTitle: "Dispatch details",
  detailsFormSection: "Dispatch form details",
  navBack: "Back",
  navNext: "Next",
};

export const parseDispatchMotorIds = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry).trim()).filter(Boolean);
  }

  const raw = String(value ?? "").trim();
  if (!raw) return [];

  return raw
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
};

/** Normalize batch/API motor stage to dispatch stage select values (0, 1, 2, 3). */
export const normalizeDispatchMotorStage = (raw: unknown): string => {
  const normalized = normalizeMotorStage(raw);
  if (normalized === null) return "";

  let value = String(normalized).trim();
  if (!value) return "";

  value = value.replace(/^STAGE[_\s-]*/i, "");
  const asNumber = Number(value);
  if (Number.isFinite(asNumber) && value !== "") {
    return String(asNumber);
  }

  return value;
};

export const dispatchMotorStagesMatch = (optionStage: unknown, selectedStage: unknown) => {
  const normalizedOption = normalizeDispatchMotorStage(optionStage);
  const normalizedSelected = normalizeDispatchMotorStage(selectedStage);

  if (!normalizedOption || !normalizedSelected) return true;
  return normalizedOption === normalizedSelected;
};

export const resolveDispatchMotorOptions = (
  batch?: Pick<DispatchBatch, "motorId" | "motorIds" | "motorStage" | "motorType"> | null,
): DispatchMotorOption[] => {
  const ids =
    Array.isArray(batch?.motorIds) && batch.motorIds.length > 0
      ? batch.motorIds.map((id) => String(id).trim()).filter(Boolean)
      : parseDispatchMotorIds(batch?.motorId);

  const motorStage = normalizeDispatchMotorStage(batch?.motorStage ?? batch?.motorType);
  return ids.map((motorId) => ({ motorId, motorStage }));
};

export const getDispatchMotorOptions = (
  motors: string[] = [],
): Array<{ value: string; label: string }> =>
  motors.map((motorId) => ({
    value: motorId,
    label: motorId,
  }));

export type DispatchSharedSetup = {
  motorStage: string;
  castingDate: string;
  dispatchDate: string;
  dispatchLocation: string;
  ndtClearance: string;
  ndtMomNo: string;
  finalAcceptanceClearance: string;
  finalAcceptanceMomNo: string;
};

export const canCompleteDispatchSetup = (setup: DispatchSharedSetup) => {
  if (!setup.motorStage.trim()) return false;
  if (!setup.castingDate.trim() || !setup.dispatchDate.trim()) return false;
  if (!setup.dispatchLocation.trim()) return false;
  if (!setup.ndtClearance.trim() || !setup.finalAcceptanceClearance.trim()) return false;
  if (setup.ndtClearance === "YES" && !setup.ndtMomNo.trim()) return false;
  if (setup.finalAcceptanceClearance === "YES" && !setup.finalAcceptanceMomNo.trim()) return false;
  return true;
};

export const canLoadDispatchMotor = ({
  setup,
  draftMotorId,
  usedMotorIds,
}: {
  setup: DispatchSharedSetup;
  draftMotorId: string;
  usedMotorIds: string[];
  hasMotors?: boolean;
}) => {
  // 1. Verify shared setup completion
  if (!canCompleteDispatchSetup(setup)) return false;

  // 2. Check if active motor ID is valid and NOT already loaded
  const motorId = String(draftMotorId ?? "").trim();
  if (!motorId || usedMotorIds.includes(motorId)) return false;

  return true;
};

export const canAddDispatchMotor = ({
  setup,
  draftMotorId,
  usedMotorIds,
}: {
  setup: DispatchSharedSetup;
  draftMotorId: string;
  usedMotorIds: string[];
  hasMotors?: boolean;
}) => {
  if (!canCompleteDispatchSetup(setup)) return false;

  const motorId = String(draftMotorId ?? "").trim();
  if (!motorId || usedMotorIds.includes(motorId)) return false;

  return true;
};

/** @deprecated Use canCompleteDispatchSetup + canLoadDispatchMotor */
export const canLoadDispatchForm = (setup: DispatchSharedSetup & { motorId: string }) => {
  if (!setup.motorId.trim()) return false;
  return canCompleteDispatchSetup(setup);
};

export { OPERATION_STATUS };
