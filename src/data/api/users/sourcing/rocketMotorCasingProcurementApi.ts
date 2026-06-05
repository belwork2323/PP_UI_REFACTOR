import { del, patch, post } from "../../httpClient";
import { USER_ROCKET_MOTOR_CASING_ENDPOINTS } from "../../endPoints";
import type { RocketMotorCasingFormPayload } from "../../../models/user/RocketMotorCasingFormModel";

export type RocketMotorCasingListRequest = {
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

export const createRocketMotorCasingFormApi = async (payload: Record<string, unknown>) => {
  return await post(USER_ROCKET_MOTOR_CASING_ENDPOINTS.CREATE_FORM, payload);
};

export const fetchRocketMotorCasingFormDetailsApi = async (payload: { motorCasingId: string }) => {
  return await post(USER_ROCKET_MOTOR_CASING_ENDPOINTS.FORM_DETAILS, payload);
};

export const updateRocketMotorCasingFormApi = async (
  payload: RocketMotorCasingFormPayload & { motorCasingId: string }
) => {
  return await patch(USER_ROCKET_MOTOR_CASING_ENDPOINTS.UPDATE_FORM, payload);
};

export const fetchRocketMotorCasingListApi = async (payload: RocketMotorCasingListRequest) => {
  return await post(USER_ROCKET_MOTOR_CASING_ENDPOINTS.CASING_LIST, payload);
};

export const deleteRocketMotorCasingFormApi = async (payload: { motorCasingId: string }) => {
  return await del(USER_ROCKET_MOTOR_CASING_ENDPOINTS.DELETE_FORM, { data: payload });
};

export const fetchRocketMotorCasingStatsApi = async (payload: { subDepartmentId: number }) => {
  return await post(USER_ROCKET_MOTOR_CASING_ENDPOINTS.STATS, payload);
};
