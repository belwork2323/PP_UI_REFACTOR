import type { SchemaField, SchemaFormValues, SchemaSection } from "../models/schema.types";
import { flattenCasePrepSections } from "./casePreparationSchema";

export type SchemaVisibilityCondition = {
  field: string;
  condition?: string;
  value?: unknown;
};

export type SchemaVisibilityRule = SchemaVisibilityCondition | SchemaVisibilityCondition[];

export type SchemaVisibilityTarget = {
  visibleWhen?: SchemaVisibilityRule;
};

const normalizeCondition = (condition: string | undefined) =>
  String(condition ?? "EQUAL").trim().toUpperCase();

const normalizeScalar = (value: unknown) => String(value ?? "").trim();

export const buildFlatVisibilityContext = (
  values: SchemaFormValues,
  extra: Record<string, unknown> = {}
): Record<string, unknown> => {
  const merged: Record<string, unknown> = { ...extra };

  Object.values(values).forEach((rows) => {
    if (!Array.isArray(rows)) return;
    rows.forEach((row) => {
      if (!row || typeof row !== "object") return;
      Object.assign(merged, row as Record<string, unknown>);
    });
  });

  return merged;
};

const evaluateCondition = (
  rule: SchemaVisibilityCondition,
  values: Record<string, unknown>
): boolean => {
  const actual = values[rule.field];
  const expected = rule.value;
  const condition = normalizeCondition(rule.condition);

  switch (condition) {
    case "EQUAL":
    case "EQ":
    case "EQUALS":
      return normalizeScalar(actual) === normalizeScalar(expected);
    case "NOT_EQUAL":
    case "NOT_EQUALS":
    case "NEQ":
    case "NOT_EQ":
      return normalizeScalar(actual) !== normalizeScalar(expected);
    case "EMPTY":
    case "IS_EMPTY":
      return normalizeScalar(actual) === "";
    case "NOT_EMPTY":
    case "IS_NOT_EMPTY":
      return normalizeScalar(actual) !== "";
    case "IN":
      return Array.isArray(expected)
        ? expected.map(normalizeScalar).includes(normalizeScalar(actual))
        : normalizeScalar(actual) === normalizeScalar(expected);
    default:
      return normalizeScalar(actual) === normalizeScalar(expected);
  }
};

export const isSchemaVisible = (
  target: SchemaVisibilityTarget | null | undefined,
  values: Record<string, unknown>
): boolean => {
  if (!target?.visibleWhen) return true;

  const rules = Array.isArray(target.visibleWhen) ? target.visibleWhen : [target.visibleWhen];
  return rules.every((rule) => evaluateCondition(rule, values));
};

export const isSchemaFieldVisible = (
  field: SchemaField,
  values: Record<string, unknown>
): boolean => isSchemaVisible(field, values);

export const isSchemaSectionVisible = (
  section: SchemaSection,
  values: Record<string, unknown>
): boolean => isSchemaVisible(section, values);

export const pruneHiddenFieldValues = (
  fields: SchemaField[],
  row: Record<string, unknown>,
  context: Record<string, unknown>
): Record<string, unknown> => {
  const next = { ...row };
  const visibilityValues = { ...context, ...next };

  fields.forEach((field) => {
    if (!isSchemaFieldVisible(field, visibilityValues)) {
      next[field.key] = "";
    }
  });

  return next;
};

export const pruneHiddenSchemaValues = (
  sections: SchemaSection[],
  values: SchemaFormValues
): SchemaFormValues => {
  const context = buildFlatVisibilityContext(values);
  const leaves = flattenCasePrepSections(sections);
  const next: SchemaFormValues = { ...values };

  leaves.forEach((section) => {
    if (!section.fields?.length) return;

    const sectionId = section.sectionId;
    const rows = Array.isArray(next[sectionId]) ? [...next[sectionId]] : [];
    if (rows.length === 0) return;

    const updatedRows = rows.map((row) =>
      pruneHiddenFieldValues(section.fields ?? [], row as Record<string, unknown>, context)
    );
    next[sectionId] = updatedRows;
  });

  return next;
};
