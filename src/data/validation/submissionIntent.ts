export type ValidationTier = "FORMAT" | "UNIT" | "SUBMIT";

export type ValidationErrors = Record<string, string>;

/** @deprecated Use ValidationTier — kept for migration from DRAFT/SUBMIT callers */
export type SubmissionIntent = "DRAFT" | "SUBMIT";

export const tierToLegacyIntent = (tier: ValidationTier): SubmissionIntent =>
  tier === "SUBMIT" ? "SUBMIT" : "DRAFT";

export const legacyIntentToTier = (intent: SubmissionIntent): ValidationTier =>
  intent === "SUBMIT" ? "SUBMIT" : "FORMAT";

export const isRequiredForTier = (
  requiredIn: ValidationTier[],
  tier: ValidationTier,
): boolean => {
  // FORMAT = live/draft format checks only — never enforce mandatory
  if (tier === "FORMAT") return false;
  // UNIT = optional legacy "min fields to persist" (manufacturing); QC draft uses FORMAT
  if (tier === "UNIT") return requiredIn.includes("UNIT");
  // SUBMIT = full mandatory set (UNIT + SUBMIT listed fields)
  return requiredIn.includes("UNIT") || requiredIn.includes("SUBMIT");
};
