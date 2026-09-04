/**
 * Schema-driven form validation (Raw Material Prep / SchemaUI).
 *
 * DRAFT  → type/format only for non-empty values
 * SUBMIT → required + type for process fields; table rows partially filled must complete
 *
 * Note: SchemaFieldBlock in this codebase often has NO `validation.required`.
 * SUBMIT therefore treats empty number/date/datetime/text process fields as required
 * unless explicitly optional (observation / remarks / notes / helper display).
 */

import type { SchemaBlock, SchemaDocumentV2, SchemaFieldBlock, SchemaSection } from "../../../schema-engine/types";
import type { SchemaFormValues } from "../../../schema-engine/state/formState";
import { scopedFormKey } from "../../../schema-engine/state/formState";
import { isBlockVisible, buildFlatVisibilityContext } from "../../../schema-engine/rules/visibility";
import { resolveTableRows } from "../../../schema-engine/utils/tableRowUtils";
import { buildTableRows } from "../../../schema-engine/state/formState";
import {
  getSchemaFieldRule,
  isFieldRequiredOnSubmit,
  type SchemaValidationMaterialContext,
} from "../../validation/configs/rawMaterialPreparation.validation.config";

export type SchemaValidationIntent = "DRAFT" | "SUBMIT";
export type SchemaValidationErrors = Record<string, string>;

export type SchemaValidationContext = SchemaValidationMaterialContext;

const str = (v: unknown) => (v == null ? "" : String(v)).trim();

const isFiniteNumber = (value: unknown): boolean => {
  const text = str(value).replace(/,/g, "");
  if (!text) return false;
  return Number.isFinite(Number(text));
};

const parseNum = (value: unknown): number | null => {
  const text = str(value).replace(/,/g, "");
  if (!text) return null;
  const n = Number(text);
  return Number.isFinite(n) ? n : null;
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

const meetsLooseSpecification = (result: number, specification: string): boolean => {
  const spec = str(specification).replace(/\s+/g, "");
  if (!spec) return true;

  const range = spec.match(/^(-?\d+(?:\.\d+)?)\s*[-–]\s*(-?\d+(?:\.\d+)?)$/);
  if (range) {
    const lo = Number(range[1]);
    const hi = Number(range[2]);
    if (Number.isFinite(lo) && Number.isFinite(hi)) return result >= lo && result <= hi;
  }

  const pm = spec.match(/^(-?\d+(?:\.\d+)?)\s*±\s*(-?\d+(?:\.\d+)?)$/);
  if (pm) {
    const center = Number(pm[1]);
    const tol = Number(pm[2]);
    if (Number.isFinite(center) && Number.isFinite(tol)) {
      return result >= center - tol && result <= center + tol;
    }
  }

  const cmp = spec.match(/^(>=|<=|>|<|=|==)?(-?\d+(?:\.\d+)?)$/);
  if (cmp) {
    const op = cmp[1] || ">=";
    const bound = Number(cmp[2]);
    if (!Number.isFinite(bound)) return true;
    switch (op) {
      case ">=":
        return result >= bound;
      case "<=":
        return result <= bound;
      case ">":
        return result > bound;
      case "<":
        return result < bound;
      case "=":
      case "==":
        return result === bound;
      default:
        return result >= bound;
    }
  }

  return true;
};

const OPTIONAL_ID_RE =
  /^(observation|remarks?|notes?|comment|anyObservation|description|helper)$/i;

const isExplicitlyOptional = (id: string, label?: string): boolean =>
  OPTIONAL_ID_RE.test(id) || OPTIONAL_ID_RE.test(String(label ?? ""));

const applyPatternValidation = (
  fieldId: string,
  text: string,
  path: string,
  errors: SchemaValidationErrors,
  fallbackLabel: string,
): boolean => {
  const rule = getSchemaFieldRule(fieldId);
  if (!rule?.pattern || !text) return true;
  if (!rule.pattern.test(text)) {
    errors[path] = rule.invalidMessage ?? `${fallbackLabel} is invalid.`;
    return false;
  }
  return true;
};

const fieldLabel = (block: SchemaFieldBlock) => block.label || block.id;

const validateFieldValue = (
  block: SchemaFieldBlock,
  raw: unknown,
  intent: SchemaValidationIntent,
  path: string,
  errors: SchemaValidationErrors,
  materialContext?: SchemaValidationContext,
) => {
  const type = String(block.fieldType ?? "text").toLowerCase();
  const required =
    intent === "SUBMIT" &&
    isFieldRequiredOnSubmit(block.id, type, materialContext, block as {
      validation?: { required?: boolean };
      required?: boolean;
      ui?: { required?: boolean };
    });
  const text = str(raw);
  const label = fieldLabel(block);
  const rule = getSchemaFieldRule(block.id);

  if (!text) {
    if (required) {
      errors[path] = rule?.requiredMessage ?? `${label} is required.`;
    }
    return;
  }

  if (type === "number" || type === "decimal") {
    if (!isFiniteNumber(text)) {
      errors[path] = rule?.invalidMessage ?? `${label} must be numeric.`;
      return;
    }
    const n = parseNum(text);
    const min = (block as { validation?: { min?: number } }).validation?.min;
    const max = (block as { validation?: { max?: number } }).validation?.max;
    if (n != null && typeof min === "number" && n < min) {
      errors[path] = `${label} must be ≥ ${min}.`;
    }
    if (n != null && typeof max === "number" && n > max) {
      errors[path] = `${label} must be ≤ ${max}.`;
    }
    return;
  }
  if (type === "date") {
    if (!isValidUiDate(text)) errors[path] = rule?.invalidMessage ?? `${label} must be a valid date.`;
    return;
  }
  if (type === "datetime" || type === "time") {
    if (!isValidUiDateTime(text)) {
      errors[path] = rule?.invalidMessage ?? `${label} must be a valid date/time.`;
    }
    return;
  }

  applyPatternValidation(block.id, text, path, errors, label);
};

type LeafCol = {
  id?: string;
  label?: string;
  fieldType?: string;
  type?: string;
  required?: boolean;
  validation?: { required?: boolean; min?: number; max?: number; pattern?: string };
  ui?: { required?: boolean };
};

type WalkCtx = {
  values: SchemaFormValues;
  intent: SchemaValidationIntent;
  errors: SchemaValidationErrors;
  visibilityContext: Record<string, unknown>;
  valueScope?: string;
  materialContext?: SchemaValidationContext;
};

const walkBlock = (block: SchemaBlock, ctx: WalkCtx) => {
  if (!isBlockVisible(block, ctx.visibilityContext)) return;

  switch (block.type) {
    case "field": {
      const path = scopedFormKey(ctx.valueScope, block.id);
      const raw = ctx.values[path] ?? ctx.values[block.id];
      validateFieldValue(block, raw, ctx.intent, path, ctx.errors, ctx.materialContext);
      // Also write under unscoped id if different (display path may match either)
      if (path !== block.id && ctx.errors[path] && !ctx.errors[block.id]) {
        ctx.errors[block.id] = ctx.errors[path];
      }
      return;
    }
    case "table": {
      const path = scopedFormKey(ctx.valueScope, block.id);
      const stored = ctx.values[path] ?? ctx.values[block.id];
      const rows = resolveTableRows(stored, block, buildTableRows);
      const columns = (block.columns ?? []) as LeafCol[];

      const leafColumns = columns.filter(
        (col): col is LeafCol & { id: string } => Boolean(col && typeof col.id === "string" && col.id),
      );

      // SUBMIT: empty table that is part of the process → require at least one data row
      // (skip if table is purely optional / observation-only)
      if (ctx.intent === "SUBMIT" && rows.length === 0) {
        const hasRequiredCol = leafColumns.some((col) =>
          isFieldRequiredOnSubmit(
            col.id,
            String(col.fieldType ?? col.type ?? "text"),
            ctx.materialContext,
            col,
          ),
        );
        if (hasRequiredCol) {
          ctx.errors[path] = `${(block as { title?: string; label?: string }).title || (block as { label?: string }).label || block.id} requires at least one row.`;
          if (path !== block.id) ctx.errors[block.id] = ctx.errors[path];
        }
      }

      rows.forEach((row, rowIndex) => {
        const rowHasAny = leafColumns.some((col) => str(row[col.id]) !== "");

        leafColumns.forEach((col) => {
          const colId = col.id;
          const cellPath = `${path}.${rowIndex}.${colId}`;
          const cellVal = row[colId];
          const text = str(cellVal);
          const label = col.label || colId;
          const colType = String(col.fieldType ?? col.type ?? "text").toLowerCase();

          const required =
            ctx.intent === "SUBMIT" &&
            isFieldRequiredOnSubmit(colId, colType, ctx.materialContext, col);

          const colRule = getSchemaFieldRule(colId);

          if (!text) {
            if (required) {
              ctx.errors[cellPath] = colRule?.requiredMessage ?? `${label} is required.`;
            }
            return;
          }

          if (colType === "number" || colType === "decimal") {
            if (!isFiniteNumber(text)) {
              ctx.errors[cellPath] = colRule?.invalidMessage ?? `${label} must be numeric.`;
            }
          } else if (colType === "date") {
            if (!isValidUiDate(text)) {
              ctx.errors[cellPath] = colRule?.invalidMessage ?? `${label} must be a valid date.`;
            }
          } else if (colType === "datetime" || colType === "time") {
            if (!isValidUiDateTime(text)) {
              ctx.errors[cellPath] = colRule?.invalidMessage ?? `${label} must be a valid date/time.`;
            }
          } else {
            applyPatternValidation(colId, text, cellPath, ctx.errors, label);
          }
        });

        if (ctx.intent === "SUBMIT") {
          const resultKey = leafColumns.find((c) =>
            /^(result|actual|actualParameter)$/i.test(c.id),
          )?.id;
          const specKey = leafColumns.find((c) =>
            /^(specification|spec|psdRequirement)$/i.test(c.id),
          )?.id;
          // Prefer specification column over psdRequirement for bound text
          const specCol =
            leafColumns.find((c) => /^(specification|spec)$/i.test(c.id))?.id ?? specKey;
          if (resultKey && specCol) {
            const result = parseNum(row[resultKey]);
            const spec = str(row[specCol]);
            if (result != null && spec && !meetsLooseSpecification(result, spec)) {
              ctx.errors[`${path}.${rowIndex}.${resultKey}`] =
                `Result must satisfy specification (${spec}).`;
            }
          }
        }
      });
      return;
    }
    case "section":
    case "group": {
      if ((block as { repeat?: unknown }).repeat) {
        const instances = (
          Array.isArray(ctx.values[block.id]) ? ctx.values[block.id] : []
        ) as Record<string, unknown>[];
        instances.forEach((instance) => {
          const childValues: SchemaFormValues = {
            ...ctx.values,
            ...Object.fromEntries(
              ((block as { children?: SchemaBlock[] }).children ?? []).map((child) => [
                child.id,
                instance[child.id],
              ]),
            ),
          };
          ((block as { children?: SchemaBlock[] }).children ?? []).forEach((child) => {
            walkBlock(child, {
              ...ctx,
              values: childValues,
              valueScope: undefined,
            });
          });
        });
        return;
      }
      const nextScope = block.type === "section" ? block.id : ctx.valueScope;
      ((block as { children?: SchemaBlock[] }).children ?? []).forEach((child) => {
        walkBlock(child, { ...ctx, valueScope: nextScope });
      });
      return;
    }
    default:
      return;
  }
};

export function validateSchemaFormValues(
  schema: SchemaDocumentV2 | null | undefined,
  values: SchemaFormValues,
  intent: SchemaValidationIntent = "SUBMIT",
  materialContext?: SchemaValidationContext,
): SchemaValidationErrors {
  const errors: SchemaValidationErrors = {};
  if (!schema?.data?.sections?.length) return errors;

  const visibilityContext = buildFlatVisibilityContext(values);
  const sections = schema.data.sections as SchemaSection[];

  sections.forEach((section) => {
    (section.children ?? []).forEach((block) => {
      walkBlock(block, {
        values,
        intent,
        errors,
        visibilityContext,
        valueScope: section.id,
        materialContext,
      });
    });
  });

  return errors;
}

export function firstSchemaValidationError(errors: SchemaValidationErrors): string | null {
  const vals = Object.values(errors);
  return vals.length ? vals[0] : null;
}

export function schemaFieldError(
  errors: SchemaValidationErrors | null | undefined,
  path: string,
): string | undefined {
  return errors?.[path];
}

/** Collect errors for a table block (path prefix match) for UI summary. */
export function tableErrorsForPath(
  errors: SchemaValidationErrors | null | undefined,
  tablePath: string,
): string[] {
  if (!errors) return [];
  const prefix = `${tablePath}.`;
  return Object.entries(errors)
    .filter(([k]) => k === tablePath || k.startsWith(prefix))
    .map(([, v]) => v);
}
