import type { StfSubType } from "../../../schema-engine";
import { mapStfSubType } from "../../../schema-engine";

export type STFBatch = {
  id: number | string;
  batchId: string;
  lotId: string;
  motorId: string;
  motorType: string;
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

export const STF_MOTOR_TYPE_OPTIONS: StfMotorTypeOption[] = [
  { value: "BEM", label: "BEM" },
  { value: "MAIN_MOTOR", label: "Main Motor" },
];

export const STF_FLOW_LABELS = {
  motorType: "Motor Type",
  motorTypePlaceholder: "Select motor type",
  motorIdNo: "Motor Id No.",
  motorIdNoPlaceholder: "Enter motor id",
  loadForm: "Load Form",
  loadingSchema: "Loading schema...",
};

export const mergeStfMockBatches = (apiBatches: STFBatch[]): STFBatch[] => apiBatches;

export const canLoadStfForm = (subType: string, motorIdNo: string) => {
  if (!String(subType ?? "").trim()) return false;
  if (mapStfSubType(subType) === "MAIN_MOTOR") {
    return String(motorIdNo ?? "").trim().length > 0;
  }
  return true;
};
