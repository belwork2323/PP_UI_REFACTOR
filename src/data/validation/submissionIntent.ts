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
  if (tier === "FORMAT") return false;
  if (tier === "UNIT") return requiredIn.includes("UNIT");
  return requiredIn.includes("UNIT") || requiredIn.includes("SUBMIT");
};
