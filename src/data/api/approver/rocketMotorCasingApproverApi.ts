import { post } from "../httpClient";
import { APPROVER_ENDPOINTS } from "../endPoints";

export type RocketMotorCasingApproverListPayload = {
  subDepartmentId: number;
  page: number;
  limit: number;
  status?: string[];
  motorStage?: string[];
  casingType?: string[];
  insulationType?: string[];
  search?: string;
  fromDate?: string;
  toDate?: string;
};

export type RocketMotorCasingApproverChangeStatusPayload = {
  procurementId: string;
  motorCasingId: string;
  subDepartmentId: number;
  actionType: "APPROVED" | "REJECTED";
  remarks?: string | null;
  rejectionReason?: string | null;
};

export const fetchRocketMotorCasingApproverListApi = (
  payload: RocketMotorCasingApproverListPayload,
) => post(APPROVER_ENDPOINTS.ROCKET_MOTOR_CASING_LIST, payload);

export const changeRocketMotorCasingApproverStatusApi = (
  payload: RocketMotorCasingApproverChangeStatusPayload,
) => post(APPROVER_ENDPOINTS.ROCKET_MOTOR_CASING_CHANGE_STATUS, payload);
