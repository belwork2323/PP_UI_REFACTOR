import { post } from "../httpClient";
import { APPROVER_ENDPOINTS } from "../endPoints";
import type { ApproverFormActionType } from "./approverApi";

export type CastingCuringApproverMotorChangeStatusPayload = {
  formId: string;
  motorId: string;
  subDepartmentId: number;
  actionType: ApproverFormActionType;
  remarks?: string | null;
  rejectionReason?: string | null;
};

export type CastingCuringApproverMotorChangeStatusResponse = {
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

export const changeCastingCuringApproverMotorStatus = async (
  payload: CastingCuringApproverMotorChangeStatusPayload,
) => post(APPROVER_ENDPOINTS.MOTOR_CHANGE_STATUS, payload);
