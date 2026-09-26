
import type { SchemaFormValues } from "@/data/models/shared/sectionFormTypes";
import {
  qcRawMaterialValidationConfig,
  toQcRawMaterialValidationTarget,
  type QcRawMaterialValidationTarget,
} from "../configs/qcRawMaterial.validation.config";
import { runValidation } from "../runValidation";
import type { ValidationErrors, ValidationTier } from "../submissionIntent";
import { fieldError, firstValidationError, hasValidationErrors } from "../validationErrors";

export type { ValidationErrors, ValidationTier, QcRawMaterialValidationTarget };
export { fieldError, firstValidationError, hasValidationErrors };

export function validateQcRawMaterial(
  target: QcRawMaterialValidationTarget,
  tier: ValidationTier,
): ValidationErrors {
  return runValidation(target, tier, qcRawMaterialValidationConfig);
}

/** Validate one division entry's schemaValues (REVALIDATION / Raw Material). */
export function validateQcRawMaterialValues(
  values: SchemaFormValues | Record<string, unknown> | null | undefined,
  tier: ValidationTier = "SUBMIT",
  entryId?: string,
): ValidationErrors {
  return validateQcRawMaterial(toQcRawMaterialValidationTarget(values, entryId), tier);
}

export function isQcRawMaterialUnitComplete(
  values: SchemaFormValues | Record<string, unknown> | null | undefined,
): boolean {
  const target = toQcRawMaterialValidationTarget(values);
  if (qcRawMaterialValidationConfig.isUnitComplete) {
    return qcRawMaterialValidationConfig.isUnitComplete(target);
  }
  return Object.keys(validateQcRawMaterial(target, "UNIT")).length === 0;
}

export { qcRawMaterialValidationConfig };
