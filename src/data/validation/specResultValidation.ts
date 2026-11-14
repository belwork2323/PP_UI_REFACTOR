import { parseMixingSpecificationBounds } from "./specificationBounds";

/** Min/max shape used by RMS reference ranges and structured master specs. */
export type SpecReferenceRange = {
  minValue?: number | null;
  maxValue?: number | null;
};

/** Spec-row result columns validated against the specification reference range. */
export type SpecResultField = "analysedResult" | "acemQcResult";

export const isSpecResultField = (field: string): field is SpecResultField =>
  field === "analysedResult" || field === "acemQcResult";

/** True when both min and max are absent (N/A / unbound spec). */
export function isReferenceRangeNotApplicable(
  referenceRange?: SpecReferenceRange | null,
): boolean {
  if (!referenceRange) return true;
  return referenceRange.minValue == null && referenceRange.maxValue == null;
}

/** Restrict numeric spec inputs to digits, one decimal point, and optional leading minus. */
export function sanitizeNumericAnalysedResultInput(value: string): string {
  const raw = String(value ?? "");
  if (!raw) return "";

  let result = "";
  let hasDecimal = false;
  let index = 0;

  if (raw[0] === "-") {
    result = "-";
    index = 1;
  }

  for (; index < raw.length; index += 1) {
    const char = raw[index];
    if (char >= "0" && char <= "9") {
      result += char;
      continue;
    }
    if (char === "." && !hasDecimal) {
      hasDecimal = true;
      result += char;
    }
  }

  return result;
}

/** Numeric-range specs only accept numeric input; N/A specs keep free text. */
export function sanitizeSpecResultInput(
  value: string,
  referenceRange?: SpecReferenceRange | null,
): string {
  return isReferenceRangeNotApplicable(referenceRange)
    ? value
    : sanitizeNumericAnalysedResultInput(value);
}

/** Inclusive out-of-range check against a structured reference range (non-blocking UI flag). */
export function computeIsOutOfRange(
  value: string,
  referenceRange?: SpecReferenceRange | null,
): boolean {
  const trimmed = String(value ?? "").trim();
  if (!trimmed || !referenceRange || isReferenceRangeNotApplicable(referenceRange)) return false;
  const num = Number(trimmed);
  if (Number.isNaN(num)) return false;
  const { minValue, maxValue } = referenceRange;
  if (minValue != null && num < minValue) return true;
  if (maxValue != null && num > maxValue) return true;
  return false;
}

export function isAcemQcOutOfRange(
  row: { acemQcResult?: string; referenceRange?: SpecReferenceRange | null },
): boolean {
  return computeIsOutOfRange(String(row.acemQcResult ?? ""), row.referenceRange);
}

/**
 * Rule-key suffix for RMS field rules: numeric when range applies, alphanumeric when N/A.
 * Example: specResultRuleKey("analysedResult", range) → "analysedResult" | "analysedResultAlphanumeric"
 */
export function specResultRuleKey(
  kind: SpecResultField,
  referenceRange?: SpecReferenceRange | null,
): string {
  return isReferenceRangeNotApplicable(referenceRange) ? `${kind}Alphanumeric` : kind;
}

/** Specs with a parsed min/max (from object or display string) → numeric ACEM/result. */
export function specificationImpliesNumeric(spec: unknown): boolean {
  const { min, max } = parseMixingSpecificationBounds(spec);
  return min != null || max != null;
}

/** Sanitize ACEM input when the specification label/object implies a numeric range. */
export function sanitizeAcemQcResultInput(spec: unknown, value: string): string {
  return specificationImpliesNumeric(spec) ? sanitizeNumericAnalysedResultInput(value) : value;
}

/** Non-blocking out-of-range for string/object specs (inclusive/exclusive bounds). */
export function isAcemQcResultOutOfRange(spec: unknown, value: unknown): boolean {
  const text = String(value ?? "").trim();
  if (!text) return false;
  const { min, max, minExclusive, maxExclusive } = parseMixingSpecificationBounds(spec);
  if (min == null && max == null) return false;
  const num = Number(text);
  if (!Number.isFinite(num)) return false;
  if (min != null && (minExclusive ? num <= min : num < min)) return true;
  if (max != null && (maxExclusive ? num >= max : num > max)) return true;
  return false;
}
