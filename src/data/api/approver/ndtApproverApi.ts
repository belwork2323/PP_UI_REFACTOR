import { post } from "../httpClient";
import { APPROVER_ENDPOINTS } from "../endPoints";
import type { ApproverFormActionType } from "./approverApi";

export type NDTApproverMotorChangeStatusPayload = {
  formId: string;
  motorId: string;
  subDepartmentId: number;
  actionType: ApproverFormActionType;
  remarks?: string | null;
  rejectionReason?: string | null;
};

export type NDTApproverMotorChangeStatusResponse = {
  formId: string;
  batchId: string;
  motorId: string;
  actionType: string;
  status: string;
  motorSubmissionStatus: string;
  batchStatus: string;
  allMotorsApproved: boolean;
  pendingMotorCount: number;
  approvedMotorCount: number;
  rejectedMotorCount: number;
  totalMotorCount: number;
  actionBy: string;
  actionAt: string;
  remarks: string | null;
  rejectionReason: string | null;
};

export const changeNDTApproverMotorStatus = async (
  payload: NDTApproverMotorChangeStatusPayload,
) => post(APPROVER_ENDPOINTS.MOTOR_CHANGE_STATUS, payload);
