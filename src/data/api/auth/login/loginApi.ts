import { post, get } from "../../httpClient";
import { AUTH_ENDPOINTS } from "../../endPoints";
import type { LoginRequestPayload } from "@data/models/auth/login/LoginCredentialsModel";

export type LogoutRequestPayload = { refreshToken: string };
export type RefreshTokenRequestPayload = { refreshToken: string };
export type ResetPasswordRequestPayload = { userId: string; reason: string };

export const loginApi = (payload: LoginRequestPayload) =>
  post(AUTH_ENDPOINTS.LOGIN, payload, { skipAuth: true });

export const logoutApi = (payload: LogoutRequestPayload) =>
  post(AUTH_ENDPOINTS.LOGOUT, payload);

export const refreshTokenApi = (payload: RefreshTokenRequestPayload) =>
  post(AUTH_ENDPOINTS.REFRESH_TOKEN, payload, { skipAuth: true });

export const resetPasswordApi = (payload: ResetPasswordRequestPayload) =>
  post(AUTH_ENDPOINTS.RESET_PASSWORD, payload, { skipAuth: true });

export const generateCaptchaApi = () =>
  get(AUTH_ENDPOINTS.GENERATE_CAPTCHA, {}, { skipAuth: true });
