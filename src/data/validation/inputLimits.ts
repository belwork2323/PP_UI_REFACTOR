/**
 * Shared input length / character-class limits (RMS and reusable elsewhere).
 * Mirrors product table: Short Text, Code/Reference, Remarks, Decimal.
 */

/** Short Text (Name): letters, numbers, spaces */
export const SHORT_TEXT_MIN = 1;
export const SHORT_TEXT_MAX = 100;
export const SHORT_TEXT_PATTERN = /^[A-Za-z0-9][A-Za-z0-9 ]*$/;

/** Code / Reference Number: letters, numbers, hyphen, underscore */
export const CODE_REF_MIN = 1;
export const CODE_REF_MAX = 50;
export const CODE_REF_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]*$/;

/** Remarks: optional; alphanumeric + common specials */
export const REMARKS_MIN = 0;
export const REMARKS_MAX = 500;
export const REMARKS_PATTERN = /^[A-Za-z0-9][A-Za-z0-9 \-_,./:()]*$/;

/** Decimal (+/−): max character length and fraction digits */
export const DECIMAL_MAX_LENGTH = 20;
export const DECIMAL_MAX_LENGTH_SIGNED = 21;
export const DECIMAL_MAX_PLACES = 6;

export function decimalMaxLengthFor(value: string): number {
  const trimmed = String(value ?? "").trim();
  return trimmed.startsWith("-") ? DECIMAL_MAX_LENGTH_SIGNED : DECIMAL_MAX_LENGTH;
}

/** Count digits after the decimal point (ignores trailing incomplete "."). */
export function decimalFractionDigits(value: string): number {
  const trimmed = String(value ?? "").replace(/,/g, "").trim();
  const dot = trimmed.indexOf(".");
  if (dot < 0) return 0;
  const frac = trimmed.slice(dot + 1);
  if (!frac) return 0;
  return frac.length;
}

export function exceedsDecimalLimits(value: string): boolean {
  const trimmed = String(value ?? "").replace(/,/g, "").trim();
  if (!trimmed) return false;
  if (trimmed.length > decimalMaxLengthFor(trimmed)) return true;
  return decimalFractionDigits(trimmed) > DECIMAL_MAX_PLACES;
}
