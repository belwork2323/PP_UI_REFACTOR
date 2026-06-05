import { post, put, get } from "../httpClient";
import { AUTH_ENDPOINTS } from "../endPoints";

export const loginApi = (payload) => post(AUTH_ENDPOINTS.LOGIN, payload, { skipAuth: true });
export const logoutApi = (payload) => post(AUTH_ENDPOINTS.LOGOUT, payload);
export const refreshTokenApi = (payload) =>
  post(AUTH_ENDPOINTS.REFRESH_TOKEN, payload, { skipAuth: true });
export const resetPasswordApi = (payload) =>
  post(AUTH_ENDPOINTS.RESET_PASSWORD, payload, { skipAuth: true });
export const generateCaptchaApi = () => 
  get(AUTH_ENDPOINTS.GENERATE_CAPTCHA, {}, { skipAuth: true });
