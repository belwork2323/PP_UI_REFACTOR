import { USER_CASE_PREPARATION_ENDPOINTS } from "../../data/api/endPoints";
import type { SchemaFetchConfig } from "../controllers/schemaManagementController";
import {
  buildInitialSectionValues,
  mergeSectionDataIntoValues,
  toSectionSubmissions,
} from "../models/schemaFormState";
import type {
  SchemaDocument,
  SchemaFormValues,
  SchemaSection,
  SchemaSectionSubmission,
} from "../models/schema.types";
import { flattenCasePrepSections } from "../utils/casePreparationSchema";

export const CP_SCHEMA_FUNCTIONALITY = "CREATE_CASE_PREPARATION_FORM";
export const CP_SCHEMA_TYPE = "CASE_PREPARATION";
export const CP_SCHEMA_VERSION = "1.0";

export const casePreparationSchemaFetchConfig: SchemaFetchConfig = {
  endpoint: USER_CASE_PREPARATION_ENDPOINTS.SCHEMA,
};

export const mapCasePrepBatchTypeToSchema = (batchType: string | undefined | null) => {
  const normalized = String(batchType ?? "").toUpperCase();
  if (normalized === "MAIN" || normalized === "MAIN_BATCH") return "MAIN_BATCH";
  if (normalized === "SUBSCALE" || normalized === "SUBSCALE_BATCH") return "SUBSCALE_BATCH";
  return normalized;
};

export const buildCasePreparationSchemaRequest = (params: {
  subDepartmentId: number;
  batchType: string;
}) => ({
  schemaVersion: CP_SCHEMA_VERSION,
  schemaType: CP_SCHEMA_TYPE,
  layout: { type: "flat" },
  subdepartmentId: params.subDepartmentId,
  batchType: mapCasePrepBatchTypeToSchema(params.batchType),
  functionality: CP_SCHEMA_FUNCTIONALITY,
});

export const createCasePrepInitialValues = (schema: SchemaDocument) =>
  buildInitialSectionValues(flattenCasePrepSections(schema.sections));

export const hydrateCasePrepValuesFromSections = (
  schema: SchemaDocument,
  sections: SchemaSectionSubmission[]
): SchemaFormValues => mergeSectionDataIntoValues(flattenCasePrepSections(schema.sections), sections);

export const buildCasePrepSectionPayload = (
  schema: SchemaDocument,
  values: SchemaFormValues
): SchemaSectionSubmission[] =>
  toSectionSubmissions(flattenCasePrepSections(schema.sections), values);

export type CasePrepMotorSubmission = {
  motorId: string;
  prrcClearanceDate: string;
  sections: SchemaSectionSubmission[];
};

export const buildCasePrepMotorSubmission = (
  schema: SchemaDocument,
  motorId: string,
  prrcClearanceDate: string,
  values: SchemaFormValues
): CasePrepMotorSubmission => ({
  motorId,
  prrcClearanceDate,
  sections: buildCasePrepSectionPayload(schema, values),
});

export const isCasePrepSchemaDocument = (schema: SchemaDocument | null | undefined) =>
  String(schema?.schemaType ?? "").toUpperCase() === CP_SCHEMA_TYPE;

export const getCasePrepRenderableSections = (sections: SchemaSection[]) => sections;
