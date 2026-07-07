import * as axiosNS from "axios";
import { AppError } from "../utils/AppError";
import { HTTP_STATUS } from "../app/config/constants";
import { STRINGS } from "../app/config/strings";

/* Axios ships CJS-oriented typings (`export =`); the ESM bundle exposes `default`. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
