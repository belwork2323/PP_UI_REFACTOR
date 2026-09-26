import {
  getSchemaFieldRule,
  isFieldRequiredOnSubmit,
  type SchemaValidationMaterialContext,
} from "@/data/validation/configs/rawMaterialPreparation.validation.config";
import type { DefaultSolidProcessForm, RmpMaterialProcessForm } from "./defaultSolidProcessForm";
import type { RmpMaterialUiKey } from "./rmpMaterialUiRegistry";

export type MaterialProcessValidationIntent = "DRAFT" | "SUBMIT";

const str = (v: unknown) => (v == null ? "" : String(v)).trim();

const isFiniteNumber = (value: unknown): boolean => {
  const text = str(value).replace(/,/g, "");
  return Boolean(text) && Number.isFinite(Number(text));
};

const isValidUiDate = (value: unknown): boolean => {
  const text = str(value);
  if (!text) return false;
  if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(text)) {
    const [d, m, y] = text.split("-").map(Number);
    const dt = new Date(y, m - 1, d);
    return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) {
    return !Number.isNaN(Date.parse(text.slice(0, 10)));
  }
  return false;
};

const isValidUiDateTime = (value: unknown): boolean => {
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

type DefaultSolidFieldSpec = {
  fieldId: string;
  path: string;
  fieldType: "text" | "number" | "datetime";
  label: string;
};

const DEFAULT_SOLID_FIELD_SPECS: DefaultSolidFieldSpec[] = [
  { fieldId: "OVEN_TYPE", path: "drying.ovenType", fieldType: "text", label: "Oven type" },
  { fieldId: "OVEN_NUMBER", path: "drying.ovenNumber", fieldType: "text", label: "Oven number" },
  {
    fieldId: "OVEN_SET_TEMPERATURE",
    path: "drying.ovenSetTemperature",
    fieldType: "number",
    label: "Set temperature",
  },
  {
    fieldId: "START_DATETIME",
    path: "drying.startDatetime",
    fieldType: "datetime",
    label: "Start date/time",
  },
  {
    fieldId: "END_DATETIME",
    path: "drying.endDatetime",
    fieldType: "datetime",
    label: "End date/time",
  },
  { fieldId: "MOISTURE", path: "drying.moisture", fieldType: "number", label: "Moisture" },
  {
    fieldId: "SIEVING_DISPATCH_DATETIME",
    path: "sieving.sievingDispatchDatetime",
    fieldType: "datetime",
    label: "Sieving / dispatch date/time",
  },
  {
    fieldId: "SIEVED_QUANTITY",
    path: "sieving.sievedQuantity",
    fieldType: "number",
    label: "Sieved quantity",
  },
  {
    fieldId: "SIEVE_MESH_SIZE",
    path: "sieving.sieveMeshSize",
    fieldType: "text",
    label: "Sieve mesh size",
  },
];

const readDefaultSolidPath = (form: DefaultSolidProcessForm, path: string): unknown => {
  const [section, field] = path.split(".");
  if (section === "drying" && field in form.drying) {
    return form.drying[field as keyof DefaultSolidProcessForm["drying"]];
  }
  if (section === "sieving" && field in form.sieving) {
    return form.sieving[field as keyof DefaultSolidProcessForm["sieving"]];
  }
  return "";
};

const validateDefaultSolidField = (
  spec: DefaultSolidFieldSpec,
  raw: unknown,
  intent: MaterialProcessValidationIntent,
  errors: Record<string, string>,
  materialContext?: SchemaValidationMaterialContext,
) => {
  const text = str(raw);
  const rule = getSchemaFieldRule(spec.fieldId);
  const required =
    intent === "SUBMIT" &&
    isFieldRequiredOnSubmit(spec.fieldId, spec.fieldType, materialContext, {
      validation: { required: spec.fieldId === "OBSERVATION" ? false : undefined },
      label: spec.label,
    });

  if (!text) {
    if (required) {
      errors[spec.path] = rule?.requiredMessage ?? `${spec.label} is required.`;
    }
    return;
  }

  if (spec.fieldType === "number") {
    if (!isFiniteNumber(text)) {
      errors[spec.path] = rule?.invalidMessage ?? `${spec.label} must be numeric.`;
    }
    return;
  }

  if (spec.fieldType === "datetime") {
    if (!isValidUiDateTime(text)) {
      errors[spec.path] = rule?.invalidMessage ?? `${spec.label} must be a valid date/time.`;
    }
    return;
  }

  if (rule?.pattern && !rule.pattern.test(text)) {
    errors[spec.path] = rule.invalidMessage ?? `${spec.label} is invalid.`;
  }
};

export const validateMaterialProcessForm = (
  uiKey: RmpMaterialUiKey,
  processForm: RmpMaterialProcessForm,
  intent: MaterialProcessValidationIntent,
  materialContext?: SchemaValidationMaterialContext,
): Record<string, string> => {
  if (uiKey !== "defaultSolid" || processForm.uiKey !== "defaultSolid") {
    return {};
  }

  const errors: Record<string, string> = {};
  const validationIntent = intent === "SUBMIT" ? "SUBMIT" : "DRAFT";

  DEFAULT_SOLID_FIELD_SPECS.forEach((spec) => {
    const raw = readDefaultSolidPath(processForm, spec.path);
    if (validationIntent === "DRAFT" && !str(raw)) return;
    validateDefaultSolidField(spec, raw, validationIntent, errors, materialContext);
  });

  return errors;
};
