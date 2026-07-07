import { USER_DISPATCH_ENDPOINTS } from "../../data/api/endPoints";
import type { SchemaFetchConfig } from "../controller/schemaEngineController";
import schemaEngineController from "../controller/schemaEngineController";
import {
  buildInitialFormValues,
  mergeSectionDataIntoValues,
  toSectionSubmissions,
} from "../state/formState";
import type { SchemaDocumentV2, SchemaFormValues, SchemaSectionSubmission } from "../types";

export const DISPATCH_SCHEMA_FUNCTIONALITY = "CREATE_DISPATCH_FORM";
export const DISPATCH_SCHEMA_TYPE = "DISPATCH";
export const DISPATCH_SCHEMA_VERSION = "1.0";

export const dispatchSchemaFetchConfig: SchemaFetchConfig = {
  endpoint: USER_DISPATCH_ENDPOINTS.SCHEMA,
};

export const buildDispatchSchemaRequest = (params: { subDepartmentId: number }) => ({
  schemaVersion: DISPATCH_SCHEMA_VERSION,
  schemaType: DISPATCH_SCHEMA_TYPE,
  layout: { type: "flat" },
  subDepartmentId: params.subDepartmentId,
  functionality: DISPATCH_SCHEMA_FUNCTIONALITY,
});

export const createDispatchInitialValues = (schema: SchemaDocumentV2) =>
  buildInitialFormValues(schema);

export const hydrateDispatchValuesFromSections = (
  schema: SchemaDocumentV2,
  sections: SchemaSectionSubmission[],
): SchemaFormValues => mergeSectionDataIntoValues(schema, sections);

export const buildDispatchSectionPayload = (
  schema: SchemaDocumentV2,
  values: SchemaFormValues,
): SchemaSectionSubmission[] => toSectionSubmissions(schema, values);

export const fetchDispatchSchema = async (params: { subDepartmentId: number }) => {
  const request = buildDispatchSchemaRequest(params);
  return schemaEngineController.fetchSchema(dispatchSchemaFetchConfig, request);
};
