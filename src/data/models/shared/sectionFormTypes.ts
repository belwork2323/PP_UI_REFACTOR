/**
 * Shared section-form bag types used by QC / Subscale / RMP payloads.
 * Replaces the removed schema-engine form state types.
 */

export type SchemaFormValues = Record<string, unknown>;

export type SchemaSectionSubmission = {
  sectionId: string;
  sectionData: unknown[];
  premixNo?: number;
  subType?: string;
};

/** Minimal document shape retained for legacy hydrate/payload helpers. */
export type SchemaDocumentV2 = {
  schemaVersion?: string;
  schemaType?: string;
  data: {
    meta?: Record<string, unknown>;
    sections: Array<{
      id: string;
      title?: string;
      children?: SchemaBlock[];
      [key: string]: any;
    }>;
  };
  [key: string]: unknown;
};

export type SchemaBlock = {
  id?: string;
  type?: string;
  children?: SchemaBlock[];
  // Loose residual fields for legacy section mappers
  [key: string]: any;
};

const SCOPED_FORM_KEY_SEP = "::";

/** Form-state key for a block within a section (avoids duplicate field ids across sections). */
export const scopedFormKey = (scope: string | undefined, blockId: string): string =>
  scope ? `${scope}${SCOPED_FORM_KEY_SEP}${blockId}` : blockId;

export const cloneValue = <T>(value: T): T => {
  try {
    return structuredClone(value);
  } catch {
    return JSON.parse(JSON.stringify(value)) as T;
  }
};

export const schemaValuesHaveUserData = (values: SchemaFormValues): boolean => {
  const hasContent = (val: unknown): boolean => {
    if (val === null || val === undefined) return false;
    if (typeof val === "string") return val.trim().length > 0;
    if (typeof val === "number" || typeof val === "boolean") return true;
    if (Array.isArray(val)) return val.some(hasContent);
    if (typeof val === "object") {
      return Object.entries(val as Record<string, unknown>).some(([key, v]) => {
        if (key.startsWith("_")) return false;
        return hasContent(v);
      });
    }
    return false;
  };

  return Object.values(values).some(hasContent);
};

/** @deprecated Schema engine removed — returns empty values. */
export const buildInitialFormValues = (_schema?: SchemaDocumentV2 | null): SchemaFormValues => ({});

/** @deprecated Schema engine removed — returns empty values. */
export const mergeSectionDataIntoValues = (
  _schema: SchemaDocumentV2 | null | undefined,
  _sections: SchemaSectionSubmission[],
): SchemaFormValues => ({});

/** @deprecated Schema engine removed — returns empty sections. */
export const toSectionSubmissions = (
  _schema?: SchemaDocumentV2 | null,
  _values?: SchemaFormValues,
): SchemaSectionSubmission[] => [];

/** @deprecated Schema engine removed — passthrough. */
export const syncRowGenerationTables = <T extends SchemaFormValues>(
  _schema: SchemaDocumentV2 | null | undefined,
  values: T,
): T => values;

/** @deprecated Schema engine removed. */
export const createInitialValues = (schema: SchemaDocumentV2) =>
  buildInitialFormValues(schema);

/** @deprecated Schema engine removed. */
export const hydrateValuesFromProcess = (
  schema: SchemaDocumentV2,
  sections: SchemaSectionSubmission[],
): SchemaFormValues => mergeSectionDataIntoValues(schema, sections);
