export type MasterDataFieldDef = {
  key: string;
  label: string;
  dataType: string;
  required?: boolean;
  maxLength?: number | null;
  min?: number | null;
  max?: number | null;
  pattern?: string | null;
  readOnlyOnUpdate?: boolean;
  serverGenerated?: boolean;
  attribute?: boolean;
};

export type MasterDataTypeDescriptor = {
  type: string;
  label: string;
  fields: MasterDataFieldDef[];
};

export type MasterDataRecord = {
  id: number;
  code: string;
  name: string;
  isActive: boolean;
  attributes: Record<string, unknown>;
};

export type MasterDataStats = {
  total: number;
  active: number;
  inactive: number;
};

export type MasterDataListPayload = {
  type: string;
  schema: MasterDataTypeDescriptor | null;
  items: MasterDataRecord[];
  stats: MasterDataStats;
};

export type MasterDataFormState = {
  id: number | null;
  code: string;
  name: string;
  isActive: boolean;
  attributes: Record<string, string | number | boolean>;
};

export const emptyMasterDataStats = (): MasterDataStats => ({
  total: 0,
  active: 0,
  inactive: 0,
});

export const MasterDataRecordModel = {
  fromApi: (raw: any): MasterDataRecord => ({
    id: Number(raw?.id),
    code: String(raw?.code ?? ""),
    name: String(raw?.name ?? ""),
    isActive: raw?.isActive !== false,
    attributes: raw?.attributes && typeof raw.attributes === "object" ? { ...raw.attributes } : {},
  }),
};

export const MasterDataTypeModel = {
  fromApi: (raw: any): MasterDataTypeDescriptor => ({
    type: String(raw?.type ?? ""),
    label: String(raw?.label ?? ""),
    fields: Array.isArray(raw?.fields)
      ? raw.fields.map((f: any) => ({
          key: String(f?.key ?? ""),
          label: String(f?.label ?? ""),
          dataType: String(f?.dataType ?? "STRING"),
          required: Boolean(f?.required),
          maxLength: f?.maxLength ?? null,
          min: f?.min ?? null,
          max: f?.max ?? null,
          pattern: f?.pattern ?? null,
          readOnlyOnUpdate: Boolean(f?.readOnlyOnUpdate),
          serverGenerated: Boolean(f?.serverGenerated),
          attribute: Boolean(f?.attribute),
        }))
      : [],
  }),
};

export const MasterDataListModel = {
  fromApi: (res: any): MasterDataListPayload => {
    const data = res?.data ?? {};
    return {
      type: String(data?.type ?? ""),
      schema: data?.schema ? MasterDataTypeModel.fromApi(data.schema) : null,
      items: Array.isArray(data?.items) ? data.items.map(MasterDataRecordModel.fromApi) : [],
      stats: {
        total: Number(data?.stats?.total ?? 0),
        active: Number(data?.stats?.active ?? 0),
        inactive: Number(data?.stats?.inactive ?? 0),
      },
    };
  },
};

export const createEmptyMasterDataForm = (schema?: MasterDataTypeDescriptor | null): MasterDataFormState => {
  const attributes: Record<string, string | number | boolean> = {};
  (schema?.fields ?? [])
    .filter((f) => f.attribute)
    .forEach((f) => {
      attributes[f.key] = f.dataType === "INTEGER" ? "" : f.dataType === "NUMBER" || f.dataType === "DOUBLE" ? "" : f.dataType === "BOOLEAN" ? true : "";
    });
  return {
    id: null,
    code: "",
    name: "",
    isActive: true,
    attributes,
  };
};

export const mapRecordToForm = (
  record: MasterDataRecord,
  schema?: MasterDataTypeDescriptor | null,
): MasterDataFormState => {
  const base = createEmptyMasterDataForm(schema);
  return {
    ...base,
    id: record.id,
    code: record.code,
    name: record.name,
    isActive: record.isActive,
    attributes: {
      ...base.attributes,
      ...Object.fromEntries(
        Object.entries(record.attributes ?? {}).map(([k, v]) => [k, v as string | number | boolean]),
      ),
    },
  };
};

export const getMasterDataErrorMessage = (resp: any, fallback: string) =>
  resp?.message || resp?.error?.message || fallback;

/** Same wording as backend MasterDataValidation. */
export const MASTER_DATA_CODE_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._/-]*$/;
export const MASTER_DATA_CODE_FORMAT_MESSAGE =
  "Code must start with a letter or digit and contain only letters, digits, . _ / -";

export type MasterDataFieldErrors = Record<string, string>;

const fieldErrorForCode = (codeRaw: string, maxLength?: number | null): string | null => {
  const code = codeRaw.trim();
  if (!code) return "Code is required";
  if (maxLength && code.length > maxLength) return "Code must not exceed 64 characters";
  if (!MASTER_DATA_CODE_PATTERN.test(code)) return MASTER_DATA_CODE_FORMAT_MESSAGE;
  return null;
};

const fieldErrorForName = (nameRaw: string, maxLength?: number | null): string | null => {
  const name = nameRaw.trim();
  if (!name) return "Name is required";
  if (maxLength && name.length > maxLength) return "Name must not exceed 255 characters";
  return null;
};

const fieldErrorForAttribute = (
  field: MasterDataFieldDef,
  raw: string | number | boolean | undefined,
): string | null => {
  if (field.dataType === "INTEGER") {
    if (raw === "" || raw === null || raw === undefined) {
      return field.required ? `${field.label} is required` : null;
    }
    if (typeof raw === "string" || typeof raw === "boolean") {
      return `${field.label} must be an integer`;
    }
    const num = Number(raw);
    if (!Number.isInteger(num)) return `${field.label} must be an integer`;
    if (field.min != null && num < field.min) {
      return `${field.label} must be at least ${field.min}`;
    }
    if (field.max != null && num > field.max) {
      return `${field.label} must be at most ${field.max}`;
    }
    return null;
  }
  if (field.dataType === "NUMBER" || field.dataType === "DOUBLE") {
    if (raw === "" || raw === null || raw === undefined) {
      return field.required ? `${field.label} is required` : null;
    }
    if (typeof raw === "boolean") return `${field.label} must be a number`;
    const num = typeof raw === "number" ? raw : Number(raw);
    if (!Number.isFinite(num)) return `${field.label} must be a number`;
    return null;
  }
  const value = String(raw ?? "").trim();
  if (!value) {
    return field.required ? `${field.label} is required` : null;
  }
  if (field.maxLength && value.length > field.maxLength) {
    return `${field.label} must not exceed ${field.maxLength} characters`;
  }
  if (field.pattern && !new RegExp(field.pattern).test(value)) {
    return `${field.label} has an invalid format`;
  }
  return null;
};

/** Per-field errors using the same messages as backend validation. */
export const getMasterDataFieldErrors = (
  form: MasterDataFormState,
  schema: MasterDataTypeDescriptor | null,
  isEdit: boolean,
): MasterDataFieldErrors => {
  const errors: MasterDataFieldErrors = {};
  if (!schema) return errors;

  for (const field of schema.fields) {
    if (field.key === "code") {
      if (isEdit || field.serverGenerated) continue;
      const err = fieldErrorForCode(form.code, field.maxLength);
      if (err) errors.code = err;
      continue;
    }
    if (field.key === "name") {
      const err = fieldErrorForName(form.name, field.maxLength);
      if (err) errors.name = err;
      continue;
    }
    if (field.key === "isActive" || !field.attribute) continue;
    const err = fieldErrorForAttribute(field, form.attributes[field.key]);
    if (err) errors[field.key] = err;
  }
  return errors;
};

export const validateMasterDataForm = (
  form: MasterDataFormState,
  schema: MasterDataTypeDescriptor | null,
  isEdit: boolean,
): string | null => {
  if (!schema) return "Schema not loaded";
  const errors = getMasterDataFieldErrors(form, schema, isEdit);
  return Object.values(errors)[0] ?? null;
};

export const buildCreatePayload = (form: MasterDataFormState, schema: MasterDataTypeDescriptor | null) => {
  const attributes: Record<string, unknown> = {};
  (schema?.fields ?? [])
    .filter((f) => f.attribute)
    .forEach((f) => {
      const raw = form.attributes[f.key];
      if (f.dataType === "INTEGER" || f.dataType === "NUMBER" || f.dataType === "DOUBLE") {
        attributes[f.key] = Number(raw);
      } else {
        attributes[f.key] = String(raw ?? "").trim();
      }
    });
  const codeField = schema?.fields?.find((f) => f.key === "code");
  const payload: Record<string, unknown> = {
    name: form.name.trim(),
    isActive: form.isActive,
    attributes,
  };
  if (!codeField?.serverGenerated && form.code.trim()) {
    payload.code = form.code.trim();
  }
  return payload;
};

export const buildUpdatePayload = (form: MasterDataFormState, schema: MasterDataTypeDescriptor | null) => ({
  id: form.id,
  code: form.code.trim(),
  ...buildCreatePayload(form, schema),
});

export const isMasterDataFormComplete = (
  form: MasterDataFormState,
  schema: MasterDataTypeDescriptor | null,
  isEdit: boolean,
): boolean => validateMasterDataForm(form, schema, isEdit) === null;
