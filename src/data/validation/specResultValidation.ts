import {
  DECIMAL_MAX_PLACES,
  decimalMaxLengthFor,
} from "./inputLimits";
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

/**
 * Restrict numeric inputs to digits, one decimal point, optional leading minus,
 * total length (20 / 21 signed), and ≤6 fraction digits.
 * Pass `allowNegative: false` for quantity fields (positive-only).
 */
export function sanitizeNumericAnalysedResultInput(
  value: string,
  options?: { allowNegative?: boolean },
): string {
  const allowNegative = options?.allowNegative !== false;
  const raw = String(value ?? "");
  if (!raw) return "";

  let result = "";
  let hasDecimal = false;
  let fractionDigits = 0;
  let index = 0;

  if (allowNegative && raw[0] === "-") {
    result = "-";
    index = 1;
  } else if (!allowNegative && raw[0] === "-") {
    index = 1;
  }

  for (; index < raw.length; index += 1) {
    const char = raw[index];
    if (char >= "0" && char <= "9") {
      if (hasDecimal) {
        if (fractionDigits >= DECIMAL_MAX_PLACES) continue;
        fractionDigits += 1;
      }
      const next = result + char;
      if (next.length > decimalMaxLengthFor(next)) continue;
      result = next;
      continue;
    }
    if (char === "." && !hasDecimal) {
      const next = result + char;
      if (next.length > decimalMaxLengthFor(next)) continue;
      hasDecimal = true;
      result = next;
    }
  }

  return result;
}

/** Positive quantity sanitize: same decimal caps, no leading minus. */
export function sanitizePositiveNumericInput(value: string): string {
  return sanitizeNumericAnalysedResultInput(value, { allowNegative: false });
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
  // Don't flag incomplete decimal entry (e.g. typing "1." on the way to "1.008").
  if (trimmed === "-" || trimmed === "-." || trimmed.endsWith(".")) return false;
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
