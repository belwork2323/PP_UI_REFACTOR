import { OPERATION_STATUS } from "../../operationStatus";

export type DispatchBatch = {
  id: number | string;
  batchId: string;
  projectId?: string;
  projectName?: string;
  motorId: string;
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
  ndtMomNo: "Enter MOM No.",
  ndtMomNoPlaceholder: "Enter NDT MOM number",
  finalAcceptanceClearance: "Final Acceptance Committee Clearance Accorded",
  finalAcceptanceMomNo: "Enter MOM No.",
  finalAcceptanceMomNoPlaceholder: "Enter final acceptance MOM number",
  loadForm: "Load Form",
  loadingSchema: "Loading schema...",
};


export const getDispatchMotorOptions = (
  motors: string[] = [],
): Array<{ value: string; label: string }> =>
  motors.map((motorId) => ({
    value: motorId,
    label: motorId,
  }));


export const canLoadDispatchForm = (setup: {
  motorStage: string;
  motorId: string;
  castingDate: string;
  dispatchDate: string;
  dispatchLocation: string;
  ndtClearance: string;
  ndtMomNo: string;
  finalAcceptanceClearance: string;
  finalAcceptanceMomNo: string;
}) => {
  if (!setup.motorStage.trim() || !setup.motorId.trim()) return false;
  if (!setup.castingDate.trim() || !setup.dispatchDate.trim()) return false;
  if (!setup.dispatchLocation.trim()) return false;
  if (!setup.ndtClearance.trim() || !setup.finalAcceptanceClearance.trim()) return false;
  if (setup.ndtClearance === "YES" && !setup.ndtMomNo.trim()) return false;
  if (setup.finalAcceptanceClearance === "YES" && !setup.finalAcceptanceMomNo.trim()) return false;
  return true;
};
