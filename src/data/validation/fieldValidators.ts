export const ALPHA_NUM = /^[A-Za-z0-9][A-Za-z0-9 /_-]*$/;
export const ALPHA_NUM_LOOSE = /^[A-Za-z0-9][A-Za-z0-9 \-_/.,()]*$/i;

export type FieldValueType = "text" | "date" | "datetime" | "number" | "file" | "datetime";

export type FieldValidationState =
  "valid" | "required" | "invalid" | "minLength" | "maxLength" | "minVal" | "maxVal";

export const str = (v: unknown) => (v == null ? "" : String(v)).trim();

export const isFiniteNumber = (value: unknown): boolean => {
  const text = str(value).replace(/,/g, "");
  if (!text) return false;
  return Number.isFinite(Number(text));
};

export const isValidUiDate = (value: unknown): boolean => {
  const text = str(value);
  if (!text) return false;
  const dmy = text.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (dmy) {
    const day = Number(dmy[1]);
    const month = Number(dmy[2]);
    const year = Number(dmy[3]);
    const d = new Date(year, month - 1, day);
    return d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === day;
  }
  if (/^\d{2}-\d{2}-\d{4}$/.test(text)) {
    const [day, month, year] = text.split("-").map(Number);
    const candidate = new Date(year, month - 1, day);
    return (
      candidate.getFullYear() === year &&
      candidate.getMonth() === month - 1 &&
      candidate.getDate() === day
    );
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) {
    return !Number.isNaN(Date.parse(text.slice(0, 10)));
  }
  return false;
};

export const isValidUiDateTime = (value: unknown): boolean => {
  const text = str(value);
  if (!text) return false;
  if (/^\d{1,2}-\d{1,2}-\d{4}[ T]\d{1,2}:\d{2}/.test(text)) {
    const [datePart, timePart] = text.split(/[T ]/);
    if (!isValidUiDate(datePart)) return false;
    const tm = timePart.match(/^(\d{1,2}):(\d{2})/);
    if (!tm) return false;
    const h = Number(tm[1]);
    const mi = Number(tm[2]);
    return h >= 0 && h <= 23 && mi >= 0 && mi <= 59;
  }
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(text)) {
    return !Number.isNaN(Date.parse(text));
  }
  if (/^\d{1,2}:\d{2}$/.test(text)) {
    const [h, m] = text.split(":").map(Number);
    return h >= 0 && h <= 23 && m >= 0 && m <= 59;
  }
  return isValidUiDate(text);
};

const hasFileValue = (value: unknown): boolean => {
  if (Array.isArray(value)) {
    return value.some(
      (item) =>
        item &&
        typeof item === "object" &&
        (Boolean(String((item as { fileId?: string }).fileId ?? "").trim()) ||
          Boolean(String((item as { fileUrl?: string }).fileUrl ?? "").trim()) ||
          (item as { file?: File }).file instanceof File) &&
        (item as { status?: string }).status !== "failed",
    );
  }
  if (!value || typeof value !== "object") return false;
  const file = value as { fileId?: unknown; fileUrl?: unknown; file?: unknown; status?: unknown };
  return (
    Boolean(file.file || String(file.fileId ?? "").trim() || String(file.fileUrl ?? "").trim()) &&
    file.status !== "failed"
  );
};

export const validateFieldState = (
  value: unknown,
  options: {
    valueType: FieldValueType;
    required: boolean;
    pattern?: RegExp;
    minLength?: number;
    maxLength?: number;
    minVal?: number;
    maxVal?: number;
  },
): FieldValidationState => {
  if (options.valueType === "file") {
    return hasFileValue(value) ? "valid" : options.required ? "required" : "valid";
  }

  const text = str(value);
  if (!text) return options.required ? "required" : "valid";

  // 1. Number Validation (Validates numerical value)
  if (options.valueType === "number") {
    if (!isFiniteNumber(text)) return "invalid";
    const num = Number(text.replace(/,/g, ""));
    if (options.minVal !== undefined && num < options.minVal) return "minVal";
    if (options.maxVal !== undefined && num > options.maxVal) return "maxVal";
    return "valid";
  }

  // 2. Date Validation
  if (options.valueType === "date") {
    return isValidUiDate(text) ? "valid" : "invalid";
  }

  // 2b. DateTime Validation (DD-MM-YYYY HH:mm from DateTimeField)
  if (options.valueType === "datetime") {
    return isValidUiDateTime(text) ? "valid" : "invalid";
  }

  // 3. Text / String Validation (Validates pattern and character length)
  if (options.pattern && !options.pattern.test(text)) return "invalid";
  if (options.minLength !== undefined && text.length < options.minLength) return "minLength";
  if (options.maxLength !== undefined && text.length > options.maxLength) return "maxLength";

  return "valid";
};

export const stateToMessage = (
  state: FieldValidationState,
  required: boolean,
  requiredMessage: string,
  invalidMessage: string,
  messages?: {
    minLength?: string;
    maxLength?: string;
    minVal?: string;
    maxVal?: string;
  },
  bounds?: {
    minLength?: number;
    maxLength?: number;
    minVal?: number;
    maxVal?: number;
  },
): string | undefined => {
  if (state === "valid") return undefined;
  if (state === "required" && required) return requiredMessage || "Field is required";

  if (state === "minLength") {
    const template = messages?.minLength || `Minimum required characters: {min}`;
    return template.replace("{min}", String(bounds?.minLength ?? ""));
  }

  if (state === "maxLength") {
    const template = messages?.maxLength || `Maximum characters allowed: {max}`;
    return template.replace("{max}", String(bounds?.maxLength ?? ""));
  }

  if (state === "minVal") {
    const template = messages?.minVal || `Value must be ≥ {min}`;
    return template.replace("{min}", String(bounds?.minVal ?? ""));
  }

  if (state === "maxVal") {
    const template = messages?.maxVal || `Value must be ≤ {max}`;
    return template.replace("{max}", String(bounds?.maxVal ?? ""));
  }

  if (state === "invalid") {
    return invalidMessage || "Invalid value";
  }

  return undefined;
};

export const parseNumber = (value: unknown): number | null => {
  const text = str(value).replace(/,/g, "");
  if (!text) return null;
  const n = Number(text);
  return Number.isFinite(n) ? n : null;
};

/**
 * Spec formats supported:
 * - "10" / "10.5"         → exact
 * - "10-20" / "10 – 20"    → inclusive range
 * - "≥10" / ">=10" / "≤10" / "<=10" / ">10" / "<10"
 * - "±0.5 of 10" is not parsed; treat as free text → pass
 */
export const meetsSpecification = (value: number, specification: string): boolean => {
  const spec = str(specification);
  if (!spec) return true;

  // range: 10-20 or 10 – 20
  const range = spec.match(/^(-?\d+(?:\.\d+)?)\s*[-–—]\s*(-?\d+(?:\.\d+)?)$/);
  if (range) {
    const lo = Number(range[1]);
    const hi = Number(range[2]);
    if (!Number.isFinite(lo) || !Number.isFinite(hi)) return true;
    return value >= Math.min(lo, hi) && value <= Math.max(lo, hi);
  }

  // comparison operators
  const cmp = spec.match(/^(>=|≤|<=|≥|>|<)\s*(-?\d+(?:\.\d+)?)$/);
  if (cmp) {
    const op = cmp[1];
    const n = Number(cmp[2]);
    if (!Number.isFinite(n)) return true;
    if (op === ">=") return value >= n;
    if (op === "≥") return value >= n;
    if (op === "<=") return value <= n;
    if (op === "≤") return value <= n;
    if (op === ">") return value > n;
    if (op === "<") return value < n;
  }

  // exact numeric
  if (isFiniteNumber(spec)) {
    const n = Number(str(spec).replace(/,/g, ""));
    return value === n;
  }

  // unknown free-text spec → do not fail
  return true;
};
