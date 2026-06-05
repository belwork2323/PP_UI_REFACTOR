import * as axiosNS from "axios";
import { useAuthStore } from "../../app/store/authStore";
import { mapToAppError } from "../../utils/errorMapper";
import { refreshQueue } from "./tokenRefreshQueue";

/* Axios ships CJS-oriented typings (`export =`); the ESM bundle exposes `default`. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const axios: any = (axiosNS as any).default ?? axiosNS;

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://172.16.69.74:8080/";

const api: any = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: new axios.AxiosHeaders({
    "Content-Type": "application/json",
  }),
});

/* ===========================
   Request Interceptor
   Attaches access token to every request
=========================== */
api.interceptors.request.use(
  (config: any) => {
    const skipAuth = config.skipAuth === true;

    if (!skipAuth) {
      const token = useAuthStore.getState().getAccessToken();

      if (token) {
        config.headers =
          config.headers instanceof axios.AxiosHeaders
            ? config.headers
            : new axios.AxiosHeaders(config.headers);

        config.headers.set("Authorization", `Bearer ${token}`);
      }
    }

    return config;
  },
  (error: unknown) => {
    return Promise.reject(error);
  }
);

/* ===========================
   Response Interceptor
   Handles 401 errors by refreshing token and retrying request
=========================== */
api.interceptors.response.use(
  (response: unknown) => response,
  async (error: any) => {
    const originalRequest = error?.config as any;

    // Skip 401 refresh handling for endpoints with skipAuth: true
    const skipAuth = originalRequest?.skipAuth === true;

    // Only handle 401 errors that haven't already been retried AND are not skipping auth
    if (
      error?.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !skipAuth
    ) {
      originalRequest._retry = true;

      // ── If already refreshing, queue this request and wait ──
      if (refreshQueue.isRefreshing_()) {
        try {
          await refreshQueue.addToQueue();
          // Queue resolved = refresh succeeded, retry with updated store token
          const freshToken = useAuthStore.getState().getAccessToken();
          if (freshToken && originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${freshToken}`;
          }
          return api(originalRequest);
        } catch (refreshError) {
          return Promise.reject(refreshError);
        }
      }

      // ── Start the refresh ──
      refreshQueue.setRefreshing(true);

      try {
        // Dynamically import to avoid circular dependency
        const { refreshAuthToken } = await import(
          "../../controllers/auth/authController"
        );

        // ✅ refreshAuthToken now returns ApiResponseModel on success, null on failure
        const refreshResult = await refreshAuthToken();

        // ✅ Check success explicitly — refreshResult is null on any failure
        if (refreshResult?.success && refreshResult?.data) {
          // ✅ Resolve all queued requests (they will read from store)
          refreshQueue.resolveQueue();

          // ✅ Read token directly from refreshResult.data — avoids store timing issue
          const freshToken = refreshResult.data.accessToken;
          if (freshToken && originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${freshToken}`;
          }

          // ✅ Retry the original failed request with the new token
          return api(originalRequest);
        } else {
          // ✅ Refresh failed — reject all queued requests and logout
          refreshQueue.rejectQueue(error);
          useAuthStore.getState().logout();
          return Promise.reject(error);
        }
      } catch (refreshError) {
        // ✅ Refresh threw an exception — reject all queued requests and logout
        refreshQueue.rejectQueue(refreshError);
        useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      } finally {
        // ✅ Always mark refresh as complete
        refreshQueue.setRefreshing(false);
      }
    }

    // For all other errors or already-retried requests, map to AppError format
    throw mapToAppError(error);
  }
);

/* ===========================
   HTTP Helpers
=========================== */

/**
 * POST
 */
export const post = async (
  url: string,
  payload = {},
  options: object = {}
) => {
  const response = await api.post(url, payload, options);
  return response.data;
};

/**
 * GET
 */
export const get = async (
  url: string,
  params = {},
  options: object = {}
) => {
  const response = await api.get(url, {
    params,
    ...options,
  });
  return response.data;
};

/**
 * PUT
 */
export const put = async (
  url: string,
  payload = {},
  options: object = {}
) => {
  const response = await api.put(url, payload, options);
  return response.data;
};

/**
 * PATCH
 */
export const patch = async (
  url: string,
  payload = {},
  options: object = {}
) => {
  const response = await api.request({
    method: "PATCH",
    url,
    data: payload,
    ...options,
  });
  return response.data;
};

/**
 * DELETE
 */
export const del = async (url: string, options: object = {}) => {
  const response = await api.delete(url, options);
  return response.data;
};

export default api;