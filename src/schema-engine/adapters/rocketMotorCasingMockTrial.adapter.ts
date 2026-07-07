import { USER_RAW_MATERIAL_PREPARATION_ENDPOINTS } from "../../data/api/endPoints";
import type { SchemaFetchConfig } from "../controller/schemaEngineController";
import {
  buildInitialFormValues,
  mergeSectionDataIntoValues,
  toSectionSubmissions,
} from "../state/formState";
import type { SchemaDocumentV2, SchemaFormValues, SchemaSectionSubmission } from "../types";

export const MOCK_TRIAL_SCHEMA_FUNCTIONALITY = "CREATE_MOCK_TRIAL_FORM";
export const MOCK_TRIAL_SCHEMA_TYPE = "MOCK_TRIAL";
export const MOCK_TRIAL_SCHEMA_VERSION = "1.0";

export const rocketMotorCasingMockTrialSchemaFetchConfig: SchemaFetchConfig = {
  endpoint: USER_RAW_MATERIAL_PREPARATION_ENDPOINTS.SCHEMA_MOCK_TRIAL,
};

export const buildMockTrialSchemaRequest = (params: {
  subDepartmentId: number;
  motorStage: string | number;
}) => {
  const stageRaw = String(params.motorStage ?? "").trim();
  const stageNum = Number(stageRaw);
  const motorStage = stageRaw !== "" && Number.isFinite(stageNum) ? stageNum : stageRaw;

  return {
    schemaVersion: MOCK_TRIAL_SCHEMA_VERSION,
    schemaType: MOCK_TRIAL_SCHEMA_TYPE,
    layout: { type: "flat" },
    motorStage,
    subdepartmentId: params.subDepartmentId,
    functionality: MOCK_TRIAL_SCHEMA_FUNCTIONALITY,
  };
};

export const buildMockTrialSectionPayload = (
  schema: SchemaDocumentV2,
  values: SchemaFormValues,
): SchemaSectionSubmission[] => toSectionSubmissions(schema, values);

export const hydrateMockTrialValuesFromSections = (
  schema: SchemaDocumentV2,
  sections: SchemaSectionSubmission[],
): SchemaFormValues => mergeSectionDataIntoValues(schema, sections);

export const createMockTrialInitialValues = (schema: SchemaDocumentV2) =>
  buildInitialFormValues(schema);

export const parseMockTrialSavedSections = (value: unknown): SchemaSectionSubmission[] | undefined => {
  if (!Array.isArray(value)) return undefined;
  return value
    .filter((item) => item && typeof item === "object" && "sectionId" in (item as object))
    .map((item) => {
      const row = item as SchemaSectionSubmission;
      return {
        sectionId: String(row.sectionId ?? ""),
        sectionData: Array.isArray(row.sectionData) ? row.sectionData : [],
      };
    });
};
