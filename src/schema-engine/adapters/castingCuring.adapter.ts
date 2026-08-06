import { USER_CASTING_CURING_FORM_ENDPOINTS } from "../../data/api/endPoints";
import type { CuringCycleConfig } from "../../data/models/user/CuringCycleConfigModel";
import type { SchemaFetchConfig } from "../controller/schemaEngineController";
import {
  buildInitialFormValues,
  mergeSectionDataIntoValues,
  scopedFormKey,
  toSectionSubmissions,
} from "../state/formState";
import type { SchemaDocumentV2, SchemaFormValues, SchemaSectionSubmission } from "../types";
import type { SchemaSetupContext } from "../utils/setupContext";
import { syncRowGenerationTables, prepareSchemaValuesForSubmission } from "../utils/rowGenerationSync";

export const CC_CASTING_SCHEMA_FUNCTIONALITY = "CREATE_CASTING_FORM";
export const CC_CURING_SCHEMA_FUNCTIONALITY = "CREATE_CURING_FORM";
export const CC_SCHEMA_VERSION = "1.0";
export const CC_CURING_CYCLES_SECTION_ID = "CURING_CYCLES";
export const CC_CURING_TABLE_ID = "CURING_TABLE";

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
) => syncRowGenerationTables(schema, buildInitialFormValues(schema, setupContext));

const buildCuringTableRowFromCycle = (cycle: CuringCycleConfig["cycles"][number]) => {
  const row: Record<string, unknown> = {
    srNo: cycle.sequenceNo,
    TEMPERATURE: cycle.temperature,
    TIME: cycle.durationMinutes,
    START_DATE: cycle.startDate,
    START_TIME: cycle.startTime,
    END_DATE: cycle.endDate,
    END_TIME: cycle.endTime,
    HOT_WATER_STATUS: cycle.hotWaterCirculation,
  };

  if (cycle.propellantPressure != null) {
    row.PROPELLANT_PRESSURE = cycle.propellantPressure;
  }

  return row;
};

export const buildCuringFormValuesFromCycleConfig = (
  schema: SchemaDocumentV2,
  cycleConfig: CuringCycleConfig,
  setupContext?: SchemaSetupContext,
): SchemaFormValues => {
  const baseValues = createCastingCuringInitialValues(schema, setupContext);
  if (!cycleConfig.cycles.length) return baseValues;

  return syncRowGenerationTables(schema, {
    ...baseValues,
    [scopedFormKey(CC_CURING_CYCLES_SECTION_ID, CC_CURING_TABLE_ID)]:
      cycleConfig.cycles.map(buildCuringTableRowFromCycle),
  });
};

export const hydrateCastingCuringValuesFromSections = (
  schema: SchemaDocumentV2,
  sections: SchemaSectionSubmission[],
  setupContext?: SchemaSetupContext,
): SchemaFormValues =>
  syncRowGenerationTables(schema, mergeSectionDataIntoValues(schema, sections, setupContext));

export const buildCastingCuringSectionPayload = (
  schema: SchemaDocumentV2,
  values: SchemaFormValues,
): SchemaSectionSubmission[] =>
  toSectionSubmissions(schema, prepareSchemaValuesForSubmission(schema, values));
