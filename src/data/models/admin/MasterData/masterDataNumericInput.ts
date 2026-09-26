/** Optional minus, digits, one decimal point — no precision limit while typing. */
export const MASTER_DATA_DECIMAL_INPUT_PATTERN = /^-?\d*\.?\d*$/;

export const isMasterDataDecimalInputIncomplete = (value: string): boolean => {
  const trimmed = value.trim();
  return trimmed === "-" || trimmed === "." || trimmed.endsWith(".");
};

export const parseMasterDataOptionalNumber = (raw: string): number | null => {
  const value = String(raw ?? "").trim();
  if (!value) return null;
  if (isMasterDataDecimalInputIncomplete(value)) return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

export const masterDataNumericFieldHasValue = (raw: string): boolean =>
  String(raw ?? "").trim().length > 0;

export const sanitizeMasterDataDecimalInput = (value: string): string | null => {
  if (value === "") return "";
  if (!MASTER_DATA_DECIMAL_INPUT_PATTERN.test(value)) return null;
  return value;
};
