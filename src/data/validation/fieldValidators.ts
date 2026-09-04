export const ALPHA_NUM = /^[A-Za-z0-9][A-Za-z0-9 /_-]*$/;
export const ALPHA_NUM_LOOSE = /^[A-Za-z0-9][A-Za-z0-9 \-_/.,()]*$/i;

export type FieldValueType = "text" | "date" | "number" | "file";

export type FieldValidationState = "valid" | "required" | "invalid";

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
  },
): FieldValidationState => {
  if (options.valueType === "file") {
    return hasFileValue(value) ? "valid" : options.required ? "required" : "valid";
  }

  const text = str(value);
  if (!text) return options.required ? "required" : "valid";

  if (options.valueType === "number") {
    return isFiniteNumber(text) ? "valid" : "invalid";
  }
  if (options.valueType === "date") {
    return isValidUiDate(text) ? "valid" : "invalid";
  }
  if (options.pattern && !options.pattern.test(text)) return "invalid";
  return "valid";
};

export const stateToMessage = (
  state: FieldValidationState,
  required: boolean,
  requiredMessage: string,
  invalidMessage: string,
): string | undefined => {
  if (state === "invalid") return invalidMessage;
  if (state === "required" && required) return requiredMessage;
  return undefined;
};
