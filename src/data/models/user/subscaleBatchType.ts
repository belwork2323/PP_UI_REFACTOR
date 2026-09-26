import {
  buildInitialFormValues,
  mergeSectionDataIntoValues,
  type SchemaDocumentV2,
  type SchemaFormValues,
  type SchemaSectionSubmission,
} from "../shared/sectionFormTypes";

export type SubscaleBatchType = "MAIN_SCALE" | "SUBSCALE";

export const mapSubscaleBatchType = (batchType?: string | null): SubscaleBatchType => {
  const normalized = String(batchType ?? "").toUpperCase();
  if (
    normalized === "MAIN_SCALE" ||
    normalized === "MAIN" ||
    normalized === "MAIN_BATCH"
  ) {
    return "MAIN_SCALE";
  }
  return "SUBSCALE";
};

/** @deprecated Schema engine removed. */
export const createSubscaleInitialValues = (schema: SchemaDocumentV2) =>
  buildInitialFormValues(schema);

/** @deprecated Schema engine removed. */
export const hydrateSubscaleValuesFromSections = (
  schema: SchemaDocumentV2,
  sections: SchemaSectionSubmission[],
): SchemaFormValues => mergeSectionDataIntoValues(schema, sections);
