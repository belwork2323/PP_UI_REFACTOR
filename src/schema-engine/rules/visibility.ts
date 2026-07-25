import type {
  SchemaBlock,
  SchemaSection,
  SchemaVisibilityCondition,
  SchemaVisibilityRule,
  SchemaVisibleWhen,
} from "../types";
import { scopedFormKey } from "../state/formState";

export type SchemaVisibilityTarget = {
  visibleWhen?: SchemaVisibleWhen;
};

const normalizeScalar = (value: unknown) => String(value ?? "").trim();

const normalizeOp = (op?: string) => String(op ?? "EQ").trim().toUpperCase();

export const buildFlatVisibilityContext = (
  values: Record<string, unknown>,
  extra: Record<string, unknown> = {},
): Record<string, unknown> => {
  const merged: Record<string, unknown> = { ...extra };

  const assignScalar = (key: string, val: unknown) => {
    if (key.startsWith("_")) return;
    if (Array.isArray(val) || (val && typeof val === "object")) return;
    merged[key] = val ?? "";
    const sep = key.indexOf("::");
    if (sep >= 0) {
      merged[key.slice(sep + 2)] = val ?? "";
    }
  };

  const walk = (val: unknown) => {
    if (Array.isArray(val)) {
      val.forEach((item) => {
        if (item && typeof item === "object") {
          Object.entries(item as Record<string, unknown>).forEach(([key, v]) => {
            if (Array.isArray(v) || (v && typeof v === "object" && !Array.isArray(v))) {
              walk(v);
            } else {
              assignScalar(key, v);
            }
          });
        }
      });
      return;
    }
    if (val && typeof val === "object") {
      Object.entries(val as Record<string, unknown>).forEach(([key, v]) => {
        if (Array.isArray(v) || (v && typeof v === "object" && !Array.isArray(v))) {
          walk(v);
        } else {
          assignScalar(key, v);
        }
      });
    }
  };

  Object.entries(values).forEach(([key, val]) => {
    if (val === null || val === undefined || typeof val !== "object") {
      assignScalar(key, val);
      return;
    }
    walk(val);
    // Keep table/object values addressable by key for prune clearing, but scalars only in context.
  });

  return merged;
};

const evaluateCondition = (
  rule: { field: string; op?: string; value?: unknown },
  context: Record<string, unknown>,
): boolean => {
  const actual = context[rule.field];
  const expected = rule.value;
  const op = normalizeOp(rule.op);

  switch (op) {
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

const isNestedVisibilityGroup = (rule: SchemaVisibilityRule): rule is SchemaVisibleWhen =>
  Boolean(rule && typeof rule === "object" && Array.isArray((rule as SchemaVisibleWhen).when));

export const isSchemaVisible = (
  target: SchemaVisibilityTarget | null | undefined,
  context: Record<string, unknown>,
): boolean => {
  if (!target?.visibleWhen?.when?.length) return true;
  const logic = target.visibleWhen.logic ?? "AND";
  const results = target.visibleWhen.when.map((rule) =>
    isNestedVisibilityGroup(rule)
      ? isSchemaVisible({ visibleWhen: rule }, context)
      : evaluateCondition(rule as SchemaVisibilityCondition, context),
  );
  return logic === "OR" ? results.some(Boolean) : results.every(Boolean);
};

export const isSectionVisible = (
  section: SchemaSection,
  context: Record<string, unknown>,
): boolean => isSchemaVisible(section, context);

export const isBlockVisible = (
  block: SchemaBlock,
  context: Record<string, unknown>,
): boolean => isSchemaVisible(block, context);

export const pruneHiddenFormValues = (
  sections: SchemaSection[],
  values: Record<string, unknown>,
): Record<string, unknown> => {
  const context = buildFlatVisibilityContext(values);
  const next = { ...values };

  const clearBlock = (block: SchemaBlock, scope: string) => {
    if (!isBlockVisible(block, context)) {
      if (block.type === "field") {
        next[scopedFormKey(scope, block.id)] = "";
      } else if (block.type === "table" || block.type === "matrix") {
        next[scopedFormKey(scope, block.id)] = [];
      }
      return;
    }
    if (block.type === "section") {
      if (block.repeat) return;
      block.children.forEach((child) => clearBlock(child, block.id));
      return;
    }
    if (block.type === "group") {
      if (block.repeat) return;
      block.children.forEach((child) => clearBlock(child, scope));
    }
  };

  sections.forEach((section) => {
    if (!isSectionVisible(section, context)) {
      section.children.forEach((block) => {
        // Section hidden: clear all descendant fields/tables in this section scope.
        const wipe = (b: SchemaBlock, scope: string) => {
          if (b.type === "field") next[scopedFormKey(scope, b.id)] = "";
          if (b.type === "table" || b.type === "matrix") next[scopedFormKey(scope, b.id)] = [];
          if (b.type === "section" && !b.repeat) b.children.forEach((c) => wipe(c, b.id));
          if (b.type === "group" && !b.repeat) b.children.forEach((c) => wipe(c, scope));
        };
        wipe(block, section.id);
      });
      return;
    }
    section.children.forEach((block) => clearBlock(block, section.id));
  });

  return next;
};

export const collectVisibilityTriggerFields = (sections: SchemaSection[]): Set<string> => {
  const fields = new Set<string>();

  const walkTarget = (target: SchemaVisibilityTarget | null | undefined) => {
    const walkRules = (rules: SchemaVisibilityRule[] | undefined) => {
      rules?.forEach((rule) => {
        if (isNestedVisibilityGroup(rule)) {
          walkRules(rule.when);
          return;
        }
        if (rule.field) fields.add(rule.field);
      });
    };
    walkRules(target?.visibleWhen?.when);
  };

  const walkBlocks = (blocks: SchemaBlock[]) => {
    blocks.forEach((block) => {
      walkTarget(block);
      if (block.type === "section" || block.type === "group") {
        walkBlocks(block.children ?? []);
      }
      if (block.type === "table") {
        block.columns.forEach((column) => {
          if (column.type === "column") walkTarget(column);
        });
      }
    });
  };

  sections.forEach((section) => {
    walkTarget(section);
    walkBlocks(section.children ?? []);
  });

  return fields;
};
