import { USER_CASE_PREPARATION_ENDPOINTS } from "../../data/api/endPoints";
import type { SchemaFetchConfig } from "../controller/schemaEngineController";
import {
  buildInitialFormValues,
  mergeSectionDataIntoValues,
  toSectionSubmissions,
} from "../state/formState";
import type { SchemaDocumentV2, SchemaFormValues, SchemaSectionSubmission } from "../types";
import type { SchemaSetupContext } from "../utils/setupContext";
import { syncRowGenerationTables } from "../utils/rowGenerationSync";

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
  subdepartmentId: params.subDepartmentId,
  batchType: mapCasePrepBatchTypeToSchema(params.batchType),
  functionality: CP_SCHEMA_FUNCTIONALITY,
});

export const createCasePrepInitialValues = (
  schema: SchemaDocumentV2,
  setupContext?: SchemaSetupContext,
) => syncRowGenerationTables(schema, buildInitialFormValues(schema, setupContext));

export const hydrateCasePrepValuesFromSections = (
  schema: SchemaDocumentV2,
  sections: SchemaSectionSubmission[],
  setupContext?: SchemaSetupContext,
): SchemaFormValues =>
  syncRowGenerationTables(schema, mergeSectionDataIntoValues(schema, sections, setupContext));

/** @deprecated Form is per-motor; schema is identical for every motor tab. */
export const CASE_PREP_BATCH_LEVEL_SECTION_IDS = new Set<string>();

/** Kept for call-site compatibility — returns the same schema for all motors. */
export const filterCasePrepSchemaForMotor = (
  schema: SchemaDocumentV2,
  _motorIndex?: number,
): SchemaDocumentV2 => schema;

/** Build section payload from schema + form values (hidden blocks omitted). */
export const buildCasePrepSectionPayload = (
  schema: SchemaDocumentV2,
  values: SchemaFormValues,
): SchemaSectionSubmission[] =>
  toSectionSubmissions(schema, syncRowGenerationTables(schema, values));

export type CasePrepMotorSubmission = {
  motorId: string;
  prrcClearanceDate: string;
  motorSubmissionType?: "DRAFT" | "SUBMIT";
  sections: SchemaSectionSubmission[];
};

export const buildCasePrepMotorSubmission = (
  motorId: string,
  prrcClearanceDate: string,
  schema: SchemaDocumentV2,
  values: SchemaFormValues,
  motorSubmissionType?: "DRAFT" | "SUBMIT",
): CasePrepMotorSubmission => ({
  motorId,
  prrcClearanceDate,
  ...(motorSubmissionType ? { motorSubmissionType } : {}),
  sections: buildCasePrepSectionPayload(schema, values),
});

export const isCasePrepSchemaDocument = (schema: SchemaDocumentV2 | null | undefined) =>
  schema?.schemaType === CP_SCHEMA_TYPE;
