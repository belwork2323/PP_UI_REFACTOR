
import type { SchemaFormValues } from "@/data/models/shared/sectionFormTypes";
import {
  qcMixingValidationConfig,
  toQcMixingValidationTarget,
  type QcMixingValidationTarget,
} from "../configs/qcMixing.validation.config";
import { runValidation } from "../runValidation";
import type { ValidationErrors, ValidationTier } from "../submissionIntent";
import { fieldError, firstValidationError, hasValidationErrors } from "../validationErrors";

export type { ValidationErrors, ValidationTier, QcMixingValidationTarget };
export { fieldError, firstValidationError, hasValidationErrors };

export function validateQcMixing(
  target: QcMixingValidationTarget,
  tier: ValidationTier,
): ValidationErrors {
  return runValidation(target, tier, qcMixingValidationConfig);
}

export function validateQcMixingValues(
  values: SchemaFormValues | Record<string, unknown> | null | undefined,
  variant: QcMixingValidationTarget["variant"],
  tier: ValidationTier = "SUBMIT",
  entryId?: string,
): ValidationErrors {
  return validateQcMixing(toQcMixingValidationTarget(values, variant, entryId), tier);
}

/** Premix / final-mix details + viscosity merged for one entry submit. */
export function validateQcMixingEntry(
  detailsValues: SchemaFormValues | null | undefined,
  viscosityValues: SchemaFormValues | null | undefined,
  options: {
    hasPremixDetails?: boolean;
    hasFinalMixDetails?: boolean;
    hasViscosity?: boolean;
    tier?: ValidationTier;
    entryId?: string;
  } = {},
): ValidationErrors {
  const tier = options.tier ?? "SUBMIT";
  const errors: ValidationErrors = {};

  if (options.hasPremixDetails !== false && detailsValues) {
    Object.assign(
      errors,
      validateQcMixingValues(detailsValues, "premix", tier, options.entryId),
    );
  }
  if (options.hasFinalMixDetails && detailsValues) {
    Object.assign(
      errors,
      validateQcMixingValues(detailsValues, "finalMix", tier, options.entryId),
    );
  }
  if (options.hasViscosity && viscosityValues) {
    Object.assign(
      errors,
      validateQcMixingValues(viscosityValues, "viscosity", tier, options.entryId),
    );
  }

  return errors;
}

export function isQcMixingUnitComplete(
  values: SchemaFormValues | null | undefined,
  variant: QcMixingValidationTarget["variant"],
): boolean {
  const target = toQcMixingValidationTarget(values, variant);
  return qcMixingValidationConfig.isUnitComplete?.(target) ?? false;
}

export { qcMixingValidationConfig };
