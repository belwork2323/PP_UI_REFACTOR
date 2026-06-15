import { USER_CASTING_CURING_FORM_ENDPOINTS } from "../../data/api/endPoints";
import type { SchemaFetchConfig } from "../controllers/schemaManagementController";
import {
  buildInitialSectionValues,
  mergeSectionDataIntoValues,
  toSectionSubmissions,
} from "../models/schemaFormState";
import type {
  SchemaDocument,
  SchemaFormValues,
  SchemaSectionSubmission,
} from "../models/schema.types";
import type { SchemaSetupContext } from "../utils/schemaSetupContext";
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
  layout: { type: "flat" },
  motorStage: params.motorStage,
  subdepartmentId: params.subDepartmentId,
  functionality:
    params.schemaType === "CASTING"
      ? CC_CASTING_SCHEMA_FUNCTIONALITY
      : CC_CURING_SCHEMA_FUNCTIONALITY,
});

export const createCastingCuringInitialValues = (
  schema: SchemaDocument,
  setupContext?: SchemaSetupContext,
) => buildInitialSectionValues(schema.sections, setupContext);

export const hydrateCastingCuringValuesFromSections = (
  schema: SchemaDocument,
  sections: SchemaSectionSubmission[],
  setupContext?: SchemaSetupContext,
): SchemaFormValues => mergeSectionDataIntoValues(schema.sections, sections, setupContext);

export const buildCastingCuringSectionPayload = (
  schema: SchemaDocument,
  values: SchemaFormValues,
): SchemaSectionSubmission[] => toSectionSubmissions(schema.sections, values);
