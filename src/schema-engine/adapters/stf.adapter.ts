import { USER_STF_ENDPOINTS } from "../../data/api/endPoints";
import type { SchemaFetchConfig } from "../controller/schemaEngineController";
import schemaEngineController from "../controller/schemaEngineController";
import {
  buildInitialFormValues,
  mergeSectionDataIntoValues,
  toSectionSubmissions,
} from "../state/formState";
import type { SchemaDocumentV2, SchemaFormValues, SchemaSectionSubmission } from "../types";

export const STF_SCHEMA_FUNCTIONALITY = "CREATE_STATIC_TESTING_FORM";
export const STF_SCHEMA_TYPE = "STATIC_TESTING_FACILITY";
export const STF_SCHEMA_VERSION = "1.0";

export type StfSubType = "BEM" | "MAIN_MOTOR";

export const stfSchemaFetchConfig: SchemaFetchConfig = {
  endpoint: USER_STF_ENDPOINTS.SCHEMA,
};

export const mapStfSubType = (subType?: string | null): StfSubType => {
  const normalized = String(subType ?? "").toUpperCase();
  return normalized === "MAIN_MOTOR" ? "MAIN_MOTOR" : "BEM";
};

export const buildStfSchemaRequest = (params: {
  subDepartmentId: number;
  subType: StfSubType;
}) => ({
  schemaVersion: STF_SCHEMA_VERSION,
  schemaType: STF_SCHEMA_TYPE,
  layout: { type: "flat" },
  subType: mapStfSubType(params.subType),
  subDepartmentId: params.subDepartmentId,
  functionality: STF_SCHEMA_FUNCTIONALITY,
});

export const createStfInitialValues = (schema: SchemaDocumentV2) =>
  buildInitialFormValues(schema);

export const hydrateStfValuesFromSections = (
  schema: SchemaDocumentV2,
  sections: SchemaSectionSubmission[],
): SchemaFormValues => mergeSectionDataIntoValues(schema, sections);

export const buildStfSectionPayload = (
  schema: SchemaDocumentV2,
  values: SchemaFormValues,
): SchemaSectionSubmission[] => toSectionSubmissions(schema, values);

export const fetchStfSchema = async (params: {
  subDepartmentId: number;
  subType: StfSubType;
}) => {
  const request = buildStfSchemaRequest(params);
  return schemaEngineController.fetchSchema(stfSchemaFetchConfig, request);
};
