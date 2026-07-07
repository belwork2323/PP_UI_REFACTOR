import { USER_CASTING_CURING_FORM_ENDPOINTS } from "../../data/api/endPoints";
import type { SchemaFetchConfig } from "../controller/schemaEngineController";
import {
  buildInitialFormValues,
  mergeSectionDataIntoValues,
  toSectionSubmissions,
} from "../state/formState";
import type { SchemaDocumentV2, SchemaFormValues, SchemaSectionSubmission } from "../types";
import type { SchemaSetupContext } from "../utils/setupContext";

export const CC_CASTING_SCHEMA_FUNCTIONALITY = "CREATE_CASTING_FORM";
export const CC_CURING_SCHEMA_FUNCTIONALITY = "CREATE_CURING_FORM";
export const CC_SCHEMA_VERSION = "1.0";

export const castingCuringCastingSchemaFetchConfig: SchemaFetchConfig = {
  endpoint: USER_CASTING_CURING_FORM_ENDPOINTS.CASTING_SCHEMA,
};

export const castingCuringCuringSchemaFetchConfig: SchemaFetchConfig = {
  endpoint: USER_CASTING_CURING_FORM_ENDPOINTS.CURING_SCHEMA,
};

export const buildCastingCuringSchemaRequest = (params: {
  subDepartmentId: number;
  motorStage: number;
  schemaType: "CASTING" | "CURING";
}) => ({
  schemaVersion: CC_SCHEMA_VERSION,
  schemaType: params.schemaType,
  motorStage: params.motorStage,
  subdepartmentId: params.subDepartmentId,
  functionality:
    params.schemaType === "CASTING"
      ? CC_CASTING_SCHEMA_FUNCTIONALITY
      : CC_CURING_SCHEMA_FUNCTIONALITY,
});

export const createCastingCuringInitialValues = (
  schema: SchemaDocumentV2,
  setupContext?: SchemaSetupContext,
) => buildInitialFormValues(schema, setupContext);

export const hydrateCastingCuringValuesFromSections = (
  schema: SchemaDocumentV2,
  sections: SchemaSectionSubmission[],
  setupContext?: SchemaSetupContext,
): SchemaFormValues => mergeSectionDataIntoValues(schema, sections, setupContext);

export const buildCastingCuringSectionPayload = (
  schema: SchemaDocumentV2,
  values: SchemaFormValues,
): SchemaSectionSubmission[] => toSectionSubmissions(schema, values);
