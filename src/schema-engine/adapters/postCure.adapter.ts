import { USER_POST_CURE_FORM_ENDPOINTS } from "../../data/api/endPoints";
import type { SchemaFetchConfig } from "../controller/schemaEngineController";
import schemaEngineController from "../controller/schemaEngineController";
import {
  buildInitialFormValues,
  mergeSectionDataIntoValues,
  toSectionSubmissions,
} from "../state/formState";
import type { SchemaDocumentV2, SchemaFormValues, SchemaSectionSubmission } from "../types";

export const PC_SCHEMA_FUNCTIONALITY = "CREATE_POST_CURE_FORM";
export const PC_SCHEMA_TYPE = "POST_CURE";
export const PC_SCHEMA_VERSION = "1.0";

export const postCureSchemaFetchConfig: SchemaFetchConfig = {
  endpoint: USER_POST_CURE_FORM_ENDPOINTS.SCHEMA,
};

export type PostCureSchemaRequestParams = {
  subDepartmentId: number;
  operationType: "LOOSE_FLAP_FILLING" | "INHIBITION";
  inhibitorType?: "IR1" | "HEMCOAT_3K" | "NOT_APPLICABLE";
};

export const buildPostCureSchemaRequest = (params: PostCureSchemaRequestParams) => {
  const body: Record<string, unknown> = {
    schemaVersion: PC_SCHEMA_VERSION,
    schemaType: PC_SCHEMA_TYPE,
    layout: { type: "flat" },
    subDepartmentId: params.subDepartmentId,
    functionality: PC_SCHEMA_FUNCTIONALITY,
    operationType: params.operationType,
  };

  if (params.operationType === "INHIBITION" && params.inhibitorType) {
    body.inhibitorType = params.inhibitorType;
  }

  return body;
};

export const createPostCureInitialValues = (schema: SchemaDocumentV2) =>
  buildInitialFormValues(schema);

export const hydratePostCureValuesFromSections = (
  schema: SchemaDocumentV2,
  sections: SchemaSectionSubmission[],
): SchemaFormValues => mergeSectionDataIntoValues(schema, sections);

export const buildPostCureSectionPayload = (
  schema: SchemaDocumentV2,
  values: SchemaFormValues,
): SchemaSectionSubmission[] => toSectionSubmissions(schema, values);

export const fetchPostCureSchema = async (params: PostCureSchemaRequestParams) => {
  const request = buildPostCureSchemaRequest(params);
  return schemaEngineController.fetchSchema(postCureSchemaFetchConfig, request);
};
