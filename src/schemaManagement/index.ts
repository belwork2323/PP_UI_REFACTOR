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
export { extractSchemaDataPayload, normalizeV1SchemaDocument } from "./utils/normalizeSchemaV1";
export { isV1NodeTree, nodesToSections, nodeToSections } from "./utils/nodesToSections";
export {
  groupSectionsForAccordion,
  coerceSchemaBoolean,
  resolveSchemaAccordionConfig,
  resolveSchemaLayoutType,
} from "./utils/schemaLayout";
export type { SchemaAccordionPanel } from "./utils/schemaLayout";
export {
  designSystemToThemeTokens,
  mergeSchemaTheme,
  resolveSectionBorderRadiusToken,
  resolveSectionCardSx,
  resolvePageStackSpacing,
} from "./utils/schemaStyle";
export type { SchemaAccordionConfig } from "./models/schema.v1.types";

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
  CP_SCHEMA_FUNCTIONALITY,
  CP_SCHEMA_TYPE,
  CP_SCHEMA_VERSION,
  casePreparationSchemaFetchConfig,
  buildCasePreparationSchemaRequest,
  mapCasePrepBatchTypeToSchema,
  createCasePrepInitialValues,
  hydrateCasePrepValuesFromSections,
  buildCasePrepSectionPayload,
  buildCasePrepMotorSubmission,
  isCasePrepSchemaDocument,
  type CasePrepMotorSubmission,
} from "./adapters/casePreparation.adapter";

export { flattenCasePrepSections, normalizeCasePrepSection } from "./utils/casePreparationSchema";

export {
  CC_CASTING_SCHEMA_FUNCTIONALITY,
  CC_CURING_SCHEMA_FUNCTIONALITY,
  CC_SCHEMA_VERSION,
  castingCuringCastingSchemaFetchConfig,
  castingCuringCuringSchemaFetchConfig,
  buildCastingCuringSchemaRequest,
  createCastingCuringInitialValues,
  hydrateCastingCuringValuesFromSections,
  buildCastingCuringSectionPayload,
} from "./adapters/castingCuring.adapter";

export {
  buildFlatVisibilityContext,
  isSchemaFieldVisible,
  isSchemaSectionVisible,
  isSchemaVisible,
  pruneHiddenSchemaValues,
} from "./utils/schemaVisibility";

export {
  buildCastingSetupContext,
  resolveSchemaCountToken,
  type SchemaSetupContext,
} from "./utils/schemaSetupContext";

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
