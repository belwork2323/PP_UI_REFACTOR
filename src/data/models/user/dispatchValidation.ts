/**
 * @deprecated Prefer `@/data/validation/adapters/dispatch.validation`
 * Kept so older imports keep resolving during migration.
 */

export {
  validateDispatchMotorSession,
  validateDispatchBlocks,
  validateDispatchMotorData,
  isDispatchUnitComplete,
  fieldError as dispatchFieldError,
  firstValidationError as firstDispatchValidationError,
  hasValidationErrors,
  type ValidationErrors as DispatchValidationErrors,
  type ValidationTier,
  type DispatchValidationIntent} from "@/data/validation/adapters/dispatch.validation";

import {
  validateDispatchBlocks,
  type DispatchValidationIntent,
} from "@/data/validation/adapters/dispatch.validation";
import type { DispatchMotorSession } from "./DispatchFormModel";

/** Legacy DRAFT | SUBMIT signature (DRAFT → FORMAT). Prefer tier-based API. */
export function validateDispatchMotorSessionCompat(
  motor: DispatchMotorSession | null | undefined,
  intent: DispatchValidationIntent = "SUBMIT",
) {
  return validateDispatchBlocks(motor, intent);
}

/** Alias used by some early call sites. */
export const validateDispatchMotorSessionWithIntent = validateDispatchMotorSessionCompat;
