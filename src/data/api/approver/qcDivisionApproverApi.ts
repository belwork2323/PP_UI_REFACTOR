import { post } from "../httpClient";
import { APPROVER_ENDPOINTS } from "../endPoints";
import type { ApproverFormActionType } from "./approverApi";

export type QcDivisionApproverMotorChangeStatusPayload = {
  formId: string;
  motorId: string;
  division: string;
  subDepartmentId: number;
  actionType: ApproverFormActionType;
  remarks?: string | null;
  rejectionReason?: string | null;
};

export type QcDivisionApproverPremixChangeStatusPayload = {
  formId: string;
  premixNo: number;
  stageType: "PREMIX" | "FINAL_MIX";
  division: string;
  subDepartmentId: number;
  actionType: ApproverFormActionType;
  remarks?: string | null;
  rejectionReason?: string | null;
};

export type QcDivisionApproverDivisionChangeStatusPayload = {
  formId: string;
  division: string;
  subDepartmentId: number;
  actionType: ApproverFormActionType;
  remarks?: string | null;
  rejectionReason?: string | null;
};

export type QcDivisionApproverUnitChangeStatusResponse = {
  formId: string;
  batchId: string;
  actionType: string;
  status: string;
  batchStatus: string;
  division?: string;
  motorId?: string;
  premixNo?: number;
  stageType?: string;
  motorSubmissionStatus?: string;
  premixSubmissionStatus?: string;
  allMotorsApproved?: boolean;
  allPremixesApproved?: boolean;
  allDivisionsApproved?: boolean;
  actionBy?: string;
  actionAt?: string;
  remarks?: string | null;
  rejectionReason?: string | null;
};

export const changeQcDivisionApproverMotorStatus = async (
  payload: QcDivisionApproverMotorChangeStatusPayload,
) => post(APPROVER_ENDPOINTS.MOTOR_CHANGE_STATUS, payload);

export const changeQcDivisionApproverPremixStatus = async (
  payload: QcDivisionApproverPremixChangeStatusPayload,
) => post(APPROVER_ENDPOINTS.PREMIX_CHANGE_STATUS, payload);

export const changeQcDivisionApproverDivisionStatus = async (
  payload: QcDivisionApproverDivisionChangeStatusPayload,
) => post(APPROVER_ENDPOINTS.CHANGE_STATUS, payload);
