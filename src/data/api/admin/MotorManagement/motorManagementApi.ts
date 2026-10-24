import { post } from "@data/api/httpClient";
import { MOTOR_MANAGEMENT } from "@data/api/endPoints";

export const fetchAllMotors = (payload: any) => post(MOTOR_MANAGEMENT.LIST, payload);

export const fetchMotorStats = (payload: any) => post(MOTOR_MANAGEMENT.STATS, payload ?? {});

export const fetchMotorDetails = (payload: { motorId: string }) =>
  post(MOTOR_MANAGEMENT.DETAILS, payload);

export const discardMotor = (payload: { motorId: string; reason: string }) =>
  post(MOTOR_MANAGEMENT.DISCARD, payload);

