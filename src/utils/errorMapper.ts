import * as axiosNS from "axios";
import { AppError } from "./AppError";
import { HTTP_STATUS } from "@app/config/constants";
import { STRINGS } from "@app/config/strings";

/* Axios ships CJS-oriented typings (`export =`); the ESM bundle exposes `default`. */
const axios: any = (axiosNS as any).default ?? axiosNS;

/** Backend JSON: `{ success, statusCode?, message, error?, data }` */
function backendMessage(data: unknown): string | null {
  if (data && typeof data === "object" && "message" in data && data.message != null) {
    return String((data as { message: unknown }).message);
  }
  return null;
}

export function mapToAppError(error: unknown) {
  /* Non-Axios error */
  if (!axios.isAxiosError(error)) {
    return new AppError({
      status: 0,
      message: STRINGS.SYSTEM.UNEXPECTED_ERROR,
    });
  }

  // Type assertion after isAxiosError check
  const axiosError = error as any;

  /* Network / no response */
  if (!axiosError.response) {
    return new AppError({
      status: 0,
      message: STRINGS.SYSTEM.SERVER_NOT_REACHABLE,
    });
  }

  const { status, data } = axiosError.response;

  switch (status) {
    case HTTP_STATUS.BAD_REQUEST:
      return new AppError({
        status,
        message: backendMessage(data) ?? STRINGS.SYSTEM.INVALID_REQUEST,
        details: typeof data === "object" && data !== null ? (
          // Field-level validation errors are in the "data" field
          (data as { data?: unknown }).data ||
          // General error code is in the "error" field
          ((data as { error: unknown }).error ?? null)
        ) : null,
      });

    case HTTP_STATUS.UNAUTHORIZED:
      return new AppError({
        status,
        message: backendMessage(data) ?? STRINGS.SYSTEM.SESSION_EXPIRED,
        details:
          typeof data === "object" && data !== null
            ? (data as { errorCode?: unknown }).errorCode ??
            (data as { error?: unknown }).error ??
            null
            : null,
      });

    case HTTP_STATUS.FORBIDDEN:
      return new AppError({
        status,
        message: backendMessage(data) ?? STRINGS.SYSTEM.ACCESS_DENIED,
      });

    case HTTP_STATUS.NOT_FOUND:
      return new AppError({
        status,
        message: backendMessage(data) ?? STRINGS.SYSTEM.RESOURCE_NOT_FOUND,
        details: typeof data === "object" && data !== null && "error" in data ? (data as { error: unknown }).error : null,
      });

    case HTTP_STATUS.CONFLICT:
      return new AppError({
        status,
        message: backendMessage(data) ?? STRINGS.SYSTEM.CONFLICT,
        details: typeof data === "object" && data !== null && "error" in data ? (data as { error: unknown }).error : null,
      });

    case HTTP_STATUS.METHOD_NOT_ALLOWED:
      return new AppError({
        status,
        message: backendMessage(data) ?? STRINGS.SYSTEM.INVALID_REQUEST,
        details: typeof data === "object" && data !== null && "error" in data ? (data as { error: unknown }).error : null,
      });

    case HTTP_STATUS.TOO_MANY_REQUESTS:
      return new AppError({
        status,
        message: backendMessage(data) ?? STRINGS.SYSTEM.TOO_MANY_REQUESTS,
        details: typeof data === "object" && data !== null && "error" in data ? (data as { error: unknown }).error : null,
      });

    case HTTP_STATUS.INTERNAL_SERVER_ERROR:
      return new AppError({
        status,
        message: backendMessage(data) ?? STRINGS.SYSTEM.SERVER_ERROR,
        details: typeof data === "object" && data !== null && "error" in data ? (data as { error: unknown }).error : null,
      });

    default:
      return new AppError({
        status,
        message: backendMessage(data) ?? STRINGS.SYSTEM.SERVER_NOT_REACHABLE,
        details: typeof data === "object" && data !== null && "error" in data ? (data as { error: unknown }).error : null,
      });
  }
}

/** Maps reset-password API error detail codes to user-facing messages. */
export function mapResetPasswordError(details?: string, fallback?: string): string {
  switch (details) {
    case "INVALID_REQUEST":
      return STRINGS.AUTH.RESET_INVALID_INPUT;
    case "USER_NOT_FOUND":
      return STRINGS.AUTH.RESET_USER_NOT_FOUND;
    case "RESET_REQUEST_ALREADY_EXISTS":
      return STRINGS.AUTH.RESET_ALREADY_EXISTS;
    case "RATE_LIMIT_EXCEEDED":
      return STRINGS.AUTH.RESET_RATE_LIMITED;
    case "INTERNAL_SERVER_ERROR":
      return STRINGS.SYSTEM.SERVER_ERROR;
    default:
      return fallback ?? STRINGS.AUTH.RESET_FAILED;
  }
}

/** Maps an AppError (or error-like object) to a user-facing message for UI components. */
export function mapUiError(error: { status?: number; message?: string }) {
  switch (error.status) {
    case HTTP_STATUS.UNAUTHORIZED:
      return STRINGS.SYSTEM.SESSION_EXPIRED;

    case HTTP_STATUS.FORBIDDEN:
      return STRINGS.SYSTEM.ACCESS_DENIED;

    case HTTP_STATUS.NOT_FOUND:
      return STRINGS.SYSTEM.RESOURCE_NOT_FOUND;

    default:
      return error.message || STRINGS.SYSTEM.UNKNOWN_ERROR;
  }
}
