import type {
  SchemaBlock,
  SchemaDocumentV2,
  SchemaFieldBlock,
  SchemaMeta,
  SchemaSection,
  SchemaTableBlock,
  SchemaTableColumn,
  SchemaTableColumnGroup,
  SchemaTableColumnSlot,
} from "../types";
import {
  isApiStyleSections,
  normalizeApiSchemaSections,
  resolveSchemaRootUi,
} from "./apiSchemaNormalizer";

export const isColumnGroup = (slot: SchemaTableColumnSlot): slot is SchemaTableColumnGroup =>
  slot.type === "group";

export const flattenTableColumns = (columns: SchemaTableColumnSlot[]): SchemaTableColumn[] => {
  const result: SchemaTableColumn[] = [];
  columns.forEach((slot) => {
    if (slot.type === "column") {
      result.push(slot);
      return;
    }
    if (slot.type === "group") {
      result.push(...slot.columns);
    }
  });
  return result;
};

export const walkBlocks = (
  blocks: SchemaBlock[] | undefined,
  visitor: (block: SchemaBlock, path: string[]) => void,
  path: string[] = [],
) => {
  (blocks ?? []).forEach((block) => {
    visitor(block, path);
    if (block.type === "section" || block.type === "group") {
      walkBlocks(block.children, visitor, [...path, block.id]);
    }
  });
};

export const getAllBlocks = (sections: SchemaSection[]): SchemaBlock[] => {
  const blocks: SchemaBlock[] = [];
  sections.forEach((section) => {
    walkBlocks(section.children, (block) => blocks.push(block));
  });
  return blocks;
};

export const getFieldBlocks = (sections: SchemaSection[]): SchemaFieldBlock[] =>
  getAllBlocks(sections).filter((b): b is SchemaFieldBlock => b.type === "field");

export const getTableBlocks = (sections: SchemaSection[]): SchemaTableBlock[] =>
  getAllBlocks(sections).filter((b): b is SchemaTableBlock => b.type === "table");

export const parseSchemaDocument = (response: unknown): SchemaDocumentV2 | null => {
  if (!response || typeof response !== "object") return null;

  const root = response as Record<string, unknown>;
  const isApiEnvelope = "success" in root && root.data && typeof root.data === "object";
  const envelope = root;
  const documentRoot = (
    isApiEnvelope ? root.data : root
  ) as Record<string, unknown>;

  const dataPayload = (
    documentRoot.data && typeof documentRoot.data === "object"
      ? documentRoot.data
      : documentRoot
  ) as Record<string, unknown>;

  const rawSections = Array.isArray(dataPayload.sections)
    ? dataPayload.sections
    : Array.isArray(documentRoot.sections)
      ? documentRoot.sections
      : Array.isArray(root.sections)
        ? root.sections
        : null;

  if (!rawSections) return null;

  const sections = isApiStyleSections(rawSections)
    ? normalizeApiSchemaSections(rawSections)
    : (rawSections as SchemaSection[]);

  if (!sections.length) return null;

  const meta = (dataPayload.meta ??
    documentRoot.meta ??
    envelope.meta ??
    root.meta) as SchemaMeta | undefined;

  const batchType = envelope.batchType ?? documentRoot.batchType ?? dataPayload.batchType;
  const motorStage = envelope.motorStage ?? documentRoot.motorStage ?? dataPayload.motorStage;
  const materialName = envelope.materialName ?? documentRoot.materialName ?? dataPayload.materialName;
  const materialCode = envelope.materialCode ?? documentRoot.materialCode ?? dataPayload.materialCode;
  const context = {
    ...((dataPayload.context ?? documentRoot.context ?? envelope.context ?? root.context) as
      | Record<string, unknown>
      | undefined),
    ...(batchType ? { batchType } : {}),
    ...(motorStage !== undefined && motorStage !== null ? { motorStage } : {}),
  };

  return {
    schemaVersion: String(
      envelope.schemaVersion ?? documentRoot.schemaVersion ?? dataPayload.schemaVersion ?? "1.0",
    ),
    schemaType: String(
      envelope.schemaType ?? documentRoot.schemaType ?? dataPayload.schemaType ?? "",
    ),
    functionality: String(
      envelope.functionality ?? documentRoot.functionality ?? dataPayload.functionality ?? "",
    ),
    meta,
    ...(materialName != null && String(materialName).trim()
      ? { materialName: String(materialName).trim() }
      : {}),
    ...(materialCode != null && String(materialCode).trim()
      ? { materialCode: String(materialCode).trim() }
      : {}),
    data: {
      meta,
      ui: resolveSchemaRootUi(dataPayload, envelope),
      context: Object.keys(context).length > 0 ? context : undefined,
      sections,
    },
  };
};

export type SchemaThemeTokens = {
  primary: string;
  primaryLight: string;
  accent: string;
  text: string;
  textSub: string;
  border: string;
  surface: string;
  warn: string;
};

export const defaultThemeTokens: SchemaThemeTokens = {
  primary: "#1565C0",
  primaryLight: "#1976D2",
  accent: "#1565C0",
  text: "#1C2833",
  textSub: "#5D6D7E",
  border: "#D5D8DC",
  surface: "#F4F6F8",
  warn: "#D4AC0D",
};

export const mergeThemeFromDesignSystem = (
  base: SchemaThemeTokens,
  designSystem?: SchemaDocumentV2["data"]["ui"] extends infer U
    ? U extends { designSystem?: infer D }
      ? D
      : never
    : never,
): SchemaThemeTokens => {
  const colors = (designSystem as { colors?: Record<string, string> } | undefined)?.colors;
  if (!colors) return base;
  return {
    ...base,
    primary: colors.primary ?? base.primary,
    primaryLight: colors.primaryLight ?? base.primaryLight,
    text: colors.text ?? base.text,
    textSub: colors.textSub ?? base.textSub,
    border: colors.border ?? base.border,
    surface: colors.surface ?? base.surface,
    warn: colors.warn ?? base.warn,
  };
};
