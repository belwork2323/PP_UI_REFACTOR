import { USER_SUBSCALE_FORM_ENDPOINTS } from "../../data/api/endPoints";
import type { SchemaFetchConfig } from "../controller/schemaEngineController";
import schemaEngineController from "../controller/schemaEngineController";
import {
  buildInitialFormValues,
  mergeSectionDataIntoValues,
  toSectionSubmissions,
} from "../state/formState";
import type { SchemaDocumentV2, SchemaFormValues, SchemaSectionSubmission } from "../types";

export const SS_SCHEMA_FUNCTIONALITY = "CREATE_SUBSCALE_PROCESSING_FORM";
export const SS_SCHEMA_TYPE = "SUBSCALE_PROCESSING";
export const SS_SCHEMA_VERSION = "1.0";

export type SubscaleBatchType = "MAIN_SCALE" | "SUBSCALE";

export const subscaleSchemaFetchConfig: SchemaFetchConfig = {
  endpoint: USER_SUBSCALE_FORM_ENDPOINTS.SCHEMA,
};

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

export const buildSubscaleSchemaRequest = (params: { batchType?: string | null } = {}) => ({
  schemaVersion: SS_SCHEMA_VERSION,
  schemaType: SS_SCHEMA_TYPE,
  layout: { type: "flat" },
  functionality: SS_SCHEMA_FUNCTIONALITY,
  batchType: mapSubscaleBatchType(params.batchType),
});

export const createSubscaleInitialValues = (schema: SchemaDocumentV2) =>
  buildInitialFormValues(schema);

export const hydrateSubscaleValuesFromSections = (
  schema: SchemaDocumentV2,
  sections: SchemaSectionSubmission[],
): SchemaFormValues => mergeSectionDataIntoValues(schema, sections);

export const buildSubscaleSectionPayload = (
  schema: SchemaDocumentV2,
  values: SchemaFormValues,
): SchemaSectionSubmission[] => toSectionSubmissions(schema, values);

export const fetchSubscaleSchema = async (params: { batchType?: string | null } = {}) => {
  const request = buildSubscaleSchemaRequest(params);
  return schemaEngineController.fetchSchema(subscaleSchemaFetchConfig, request);
};
