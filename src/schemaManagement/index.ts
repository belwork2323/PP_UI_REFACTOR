export { default as SchemaUI } from "./ui/SchemaUI";
export type { SchemaUIProps } from "./ui/SchemaUI";

export { default as schemaManagementController } from "./controllers/schemaManagementController";
export type { SchemaFetchConfig } from "./controllers/schemaManagementController";

export { useSchemaFetch } from "./hooks/useSchemaFetch";
export { useSchemaForm } from "./hooks/useSchemaForm";

export * from "./models/schema.types";
export {
  buildInitialSectionValues,
  schemaValuesHaveUserData,
  mergeSectionDataIntoValues,
  toSectionSubmissions,
} from "./models/schemaFormState";
export { normalizeSchemaDocument } from "./models/normalizeSchema";

export {
  RMP_SCHEMA_FUNCTIONALITY,
  RMP_SCHEMA_TYPE,
  RMP_SCHEMA_VERSION,
  rawMaterialPrepSchemaFetchConfig,
  buildRawMaterialSchemaRequest,
  buildRawMaterialSchemaRequestFromCodes,
  buildProcessSubmission,
  hydrateValuesFromProcess,
  createInitialValues,
  findMaterialInList,
  findGradeInMaterial,
  derivePremixMaterialType,
} from "./adapters/rawMaterialPreparation.adapter";

export type {
  RawMaterialSchemaRequestParams,
  PreparationPremixEntry,
  PreparationProcessEntry,
} from "./adapters/rawMaterialPreparation.adapter";

export {
  MOCK_TRIAL_SCHEMA_FUNCTIONALITY,
  MOCK_TRIAL_SCHEMA_TYPE,
  MOCK_TRIAL_SCHEMA_VERSION,
  rocketMotorCasingMockTrialSchemaFetchConfig,
  buildMockTrialSchemaRequest,
  buildMockTrialSectionPayload,
  hydrateMockTrialValuesFromSections,
  createMockTrialInitialValues,
  parseMockTrialSavedSections,
} from "./adapters/rocketMotorCasingMockTrial.adapter";
