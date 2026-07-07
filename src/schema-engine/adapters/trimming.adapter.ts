import { USER_TRIMMING_FORM_ENDPOINTS } from "../../data/api/endPoints";
import type { SchemaFetchConfig } from "../controller/schemaEngineController";
import schemaEngineController from "../controller/schemaEngineController";
import {
  buildInitialFormValues,
  mergeSectionDataIntoValues,
  toSectionSubmissions,
} from "../state/formState";
import type { SchemaDocumentV2, SchemaFormValues, SchemaSectionSubmission } from "../types";

export const TR_SCHEMA_FUNCTIONALITY = "CREATE_TRIMMING_FORM";
export const TR_SCHEMA_TYPE = "TRIMMING";
export const TR_SCHEMA_VERSION = "1.0";

export const trimmingSchemaFetchConfig: SchemaFetchConfig = {
  endpoint: USER_TRIMMING_FORM_ENDPOINTS.SCHEMA,
};

export const mapTrimmingMotorStage = (motorStage?: unknown): string => {
  const raw = String(motorStage ?? "0").trim().toUpperCase();
  if (/^S\d+$/.test(raw)) return raw;
  const numeric = Number(raw);
  if (Number.isFinite(numeric)) return `S${numeric}`;
  return `S${raw}`;
};

export const resolveTrimmingMotorStage = (
  batch?: { motorStage?: unknown; motorType?: unknown } | null,
) => mapTrimmingMotorStage(batch?.motorStage ?? batch?.motorType);

/** Numeric motor stage from label (e.g. S0 → 0). */
export const resolveTrimmingMotorStageNumber = (
  batch?: { motorStage?: unknown; motorType?: unknown } | null,
): number => {
  const label = mapTrimmingMotorStage(batch?.motorStage ?? batch?.motorType);
  const match = /^S(\d+)$/.exec(label);
  return match ? Number(match[1]) : 0;
};

export const resolveTrimmingMotorStageForApi = (motorStage?: unknown): number =>
  resolveTrimmingMotorStageNumber({ motorStage });

export const buildTrimmingSchemaRequest = (params: {
  subDepartmentId: number;
  motorStage?: unknown;
}) => ({
  schemaVersion: TR_SCHEMA_VERSION,
  schemaType: TR_SCHEMA_TYPE,
  layout: { type: "flat" },
  motorStage: resolveTrimmingMotorStageNumber({ motorStage: params.motorStage }),
  subDepartmentId: params.subDepartmentId,
  functionality: TR_SCHEMA_FUNCTIONALITY,
});

export const createTrimmingInitialValues = (schema: SchemaDocumentV2) =>
  buildInitialFormValues(schema);

export const hydrateTrimmingValuesFromSections = (
  schema: SchemaDocumentV2,
  sections: SchemaSectionSubmission[],
): SchemaFormValues => mergeSectionDataIntoValues(schema, sections);

export const buildTrimmingSectionPayload = (
  schema: SchemaDocumentV2,
  values: SchemaFormValues,
): SchemaSectionSubmission[] => toSectionSubmissions(schema, values);

export const fetchTrimmingSchema = async (params: {
  subDepartmentId: number;
  motorStage?: unknown;
}) => {
  const request = buildTrimmingSchemaRequest(params);
  return schemaEngineController.fetchSchema(trimmingSchemaFetchConfig, request);
};
