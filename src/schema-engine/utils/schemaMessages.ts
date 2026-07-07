import type { SchemaDocumentV2 } from "../types";

export const SCHEMA_LOAD_FAILED_MESSAGE = "Schema failed to load. Please try again.";
export const SCHEMA_NOT_LOADED_MESSAGE = "Schema is not loaded yet.";
export const SCHEMA_MISSING_SECTIONS_MESSAGE = "Schema response is missing sections.";

export const isSchemaDocumentReady = (
  schema: SchemaDocumentV2 | null | undefined,
): schema is SchemaDocumentV2 => Boolean(schema?.data?.sections?.length);
