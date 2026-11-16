import { formatValidationDetailsMessage } from "@data/validation/validationErrors";

type ApiErrorShape = {
  errorDetails?: unknown;
  error?: unknown;
  data?: unknown;
  details?: unknown;
  message?: unknown;
} | null | undefined;

/**
 * Prefer structured field maps from the API envelope.
 * RMS / AcemException VALIDATION_ERROR puts the map in `data`;
 * AppError path stores the same map on `errorDetails` / `error`.
 */
export function extractApiErrorDetails(response: ApiErrorShape): unknown {
  if (!response) return null;
  return (
    response.errorDetails ?? response.error ?? response.data ?? response.details ?? null
  );
}

function stringDetails(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const details = (value as { details?: unknown }).details;
    if (typeof details === "string" && details.trim()) return details.trim();
  }
  return null;
}

/** Human-readable API failure message for GlobalAlert / validation snackbar. */
export function resolveApiErrorMessage(response: ApiErrorShape, fallbackMessage: string): string {
  const details = extractApiErrorDetails(response);
  return (
    formatValidationDetailsMessage(details) ||
    formatValidationDetailsMessage(response?.errorDetails) ||
    formatValidationDetailsMessage(response?.error) ||
    formatValidationDetailsMessage(response?.data) ||
    stringDetails(response?.error) ||
    (typeof response?.message === "string" && response.message.trim()
      ? response.message.trim()
      : null) ||
    fallbackMessage
  );
}
