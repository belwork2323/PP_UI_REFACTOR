import type { SchemaDocumentV2, SchemaSectionSubmission } from "../../../schema-engine";
import type { SchemaProcessSubmission } from "../../../schema-engine/adapters/rawMaterialPreparation.adapter";
import type { SchemaBlock } from "../../../schema-engine/types/schema.types";

const RUNTIME_KEYS = new Set(["srNo", "SR_NO", "sr_no"]);

export const toCamelCaseKey = (key: string): string => {
  const trimmed = String(key ?? "").trim();
  if (!trimmed) return "";
  if (/^[a-z][a-zA-Z0-9]*$/.test(trimmed)) return trimmed;
  return trimmed
    .toLowerCase()
    .replace(/_([a-z0-9])/gi, (_, char: string) => char.toUpperCase());
};

export const toSchemaKey = (key: string): string => {
  const trimmed = String(key ?? "").trim();
  if (!trimmed) return "";
  if (trimmed === trimmed.toUpperCase() && trimmed.includes("_")) return trimmed;
  return trimmed
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/-/g, "_")
    .toUpperCase();
};

const mapObjectKeysDeep = (
  value: unknown,
  mapKey: (key: string) => string,
): unknown => {
  if (Array.isArray(value)) {
    return value.map((entry) => mapObjectKeysDeep(entry, mapKey));
  }
  if (!value || typeof value !== "object") return value;

  const out: Record<string, unknown> = {};
  Object.entries(value as Record<string, unknown>).forEach(([key, entryValue]) => {
    if (key.startsWith("_") || RUNTIME_KEYS.has(key)) return;
    out[mapKey(key)] = mapObjectKeysDeep(entryValue, mapKey);
  });
  return out;
};

const extractTableRows = (value: unknown): Record<string, unknown>[] => {
  if (Array.isArray(value)) {
    return value.filter((row) => row && typeof row === "object") as Record<string, unknown>[];
  }
  if (value && typeof value === "object" && Array.isArray((value as { rows?: unknown[] }).rows)) {
    return (value as { rows: Record<string, unknown>[] }).rows;
  }
  return [];
};

const findBlocks = (
  blocks: SchemaBlock[] | undefined,
  predicate: (block: SchemaBlock) => boolean,
): SchemaBlock[] => {
  const found: SchemaBlock[] = [];
  (blocks ?? []).forEach((block) => {
    if (predicate(block)) found.push(block);
    if ("children" in block && block.children?.length) {
      found.push(...findBlocks(block.children, predicate));
    }
  });
  return found;
};

const resolveSchemaSectionId = (sectionId: string, schema: SchemaDocumentV2): string => {
  const ids = schema.data.sections.map((section) => section.id);
  if (ids.includes(sectionId)) return sectionId;

  const camel = toCamelCaseKey(sectionId);
  const byCamel = ids.find((id) => toCamelCaseKey(id) === camel);
  if (byCamel) return byCamel;

  const snake = toSchemaKey(sectionId);
  if (ids.includes(snake)) return snake;

  return sectionId;
};

const flattenSectionRowForApi = (
  schema: SchemaDocumentV2,
  sectionId: string,
  sectionRow: Record<string, unknown>,
): Record<string, unknown>[] => {
  const section = schema.data.sections.find((entry) => entry.id === sectionId);
  if (!section) {
    return [mapObjectKeysDeep(sectionRow, toCamelCaseKey) as Record<string, unknown>];
  }

  const repeatGroups = findBlocks(
    section.children,
    (block) => block.type === "group" && Boolean(block.repeat),
  );
  if (repeatGroups.length === 1) {
    const repeatId = repeatGroups[0].id;
    const rows = sectionRow[repeatId];
    if (Array.isArray(rows) && rows.length > 0) {
      return rows.map(
        (row) => mapObjectKeysDeep(row, toCamelCaseKey) as Record<string, unknown>,
      );
    }
  }

  const tables = findBlocks(section.children, (block) => block.type === "table");
  if (tables.length === 1) {
    const rows = extractTableRows(sectionRow[tables[0].id]);
    if (rows.length > 0) {
      return rows.map(
        (row) => mapObjectKeysDeep(row, toCamelCaseKey) as Record<string, unknown>,
      );
    }
  }

  const matrices = findBlocks(section.children, (block) => block.type === "matrix");
  if (matrices.length === 1 && sectionRow[matrices[0].id] !== undefined) {
    return [
      mapObjectKeysDeep(sectionRow[matrices[0].id], toCamelCaseKey) as Record<string, unknown>,
    ];
  }

  const flatEntries = Object.entries(sectionRow).filter(
    ([key, value]) =>
      !key.startsWith("_") &&
      value !== null &&
      value !== undefined &&
      value !== "" &&
      !Array.isArray(value),
  );
  if (flatEntries.length > 0 && repeatGroups.length === 0 && tables.length === 0) {
    return [mapObjectKeysDeep(sectionRow, toCamelCaseKey) as Record<string, unknown>];
  }

  return [mapObjectKeysDeep(sectionRow, toCamelCaseKey) as Record<string, unknown>];
};

export const serializeSectionSubmissionForApi = (
  schema: SchemaDocumentV2,
  submission: SchemaSectionSubmission,
): { sectionId: string; sectionData: Record<string, unknown>[] } => {
  const schemaSectionId = resolveSchemaSectionId(submission.sectionId, schema);
  const sectionRow = (submission.sectionData?.[0] ?? {}) as Record<string, unknown>;
  return {
    sectionId: toCamelCaseKey(schemaSectionId),
    sectionData: flattenSectionRowForApi(schema, schemaSectionId, sectionRow),
  };
};

const expandSectionSubmissionFromApi = (
  schema: SchemaDocumentV2,
  apiSection: { sectionId?: string; sectionData?: unknown },
): SchemaSectionSubmission => {
  const schemaSectionId = resolveSchemaSectionId(String(apiSection.sectionId ?? ""), schema);
  const section = schema.data.sections.find((entry) => entry.id === schemaSectionId);
  const apiRows = Array.isArray(apiSection.sectionData)
    ? (apiSection.sectionData as Record<string, unknown>[])
    : [];

  if (!section || apiRows.length === 0) {
    return {
      sectionId: schemaSectionId,
      sectionData: apiRows.map(
        (row) => mapObjectKeysDeep(row, toSchemaKey) as Record<string, unknown>,
      ),
    };
  }

  const repeatGroups = findBlocks(
    section.children,
    (block) => block.type === "group" && Boolean(block.repeat),
  );
  if (repeatGroups.length === 1) {
    const repeatId = repeatGroups[0].id;
    return {
      sectionId: schemaSectionId,
      sectionData: [
        {
          [repeatId]: apiRows.map(
            (row) => mapObjectKeysDeep(row, toSchemaKey) as Record<string, unknown>,
          ),
        },
      ],
    };
  }

  const tables = findBlocks(section.children, (block) => block.type === "table");
  if (tables.length === 1) {
    const tableId = tables[0].id;
    return {
      sectionId: schemaSectionId,
      sectionData: [
        {
          [tableId]: apiRows.map(
            (row) => mapObjectKeysDeep(row, toSchemaKey) as Record<string, unknown>,
          ),
        },
      ],
    };
  }

  return {
    sectionId: schemaSectionId,
    sectionData: apiRows.map(
      (row) => mapObjectKeysDeep(row, toSchemaKey) as Record<string, unknown>,
    ),
  };
};

export const serializeProcessSubmissionForApi = (
  process: SchemaProcessSubmission,
  schema: SchemaDocumentV2,
): SchemaProcessSubmission => ({
  ...process,
  sections: process.sections.map((section) => serializeSectionSubmissionForApi(schema, section)),
});

export const normalizeProcessSubmissionFromApi = (
  process: SchemaProcessSubmission,
  schema: SchemaDocumentV2,
): SchemaProcessSubmission => ({
  ...process,
  sections: (process.sections ?? []).map((section) =>
    expandSectionSubmissionFromApi(schema, section),
  ),
});

export const formatDateTimeForApi = (value: string | null | undefined): string | null => {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/.test(raw)) return raw;

  const dmyTime = raw.match(/^(\d{2})-(\d{2})-(\d{4}) (\d{2}):(\d{2})$/);
  if (dmyTime) {
    const [, day, month, year, hour, minute] = dmyTime;
    const date = new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute));
    if (!Number.isNaN(date.getTime())) return date.toISOString();
  }

  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(raw)) {
    const date = new Date(`${raw}:00`);
    if (!Number.isNaN(date.getTime())) return date.toISOString();
  }

  const normalized = raw.length === 16 ? `${raw}:00` : raw;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return raw;
  return date.toISOString();
};
