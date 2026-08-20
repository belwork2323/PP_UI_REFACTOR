export { default as SchemaUI } from "./SchemaUI";
export type { SchemaUIProps } from "./SchemaUI";

export { default as SchemaRenderer } from "./SchemaRenderer";
export { default as schemaEngineController } from "./controller/schemaEngineController";
export { default } from "./controller/schemaEngineController";
export type { SchemaFetchConfig } from "./controller/schemaEngineController";

export { useSchemaFetch, SCHEMA_LOAD_FAILED_MESSAGE } from "./hooks/useSchemaFetch";
export {
  SCHEMA_NOT_LOADED_MESSAGE,
  SCHEMA_MISSING_SECTIONS_MESSAGE,
  isSchemaDocumentReady,
} from "./utils/schemaMessages";
export { useSchemaForm } from "./hooks/useSchemaForm";

export * from "./types";
export type { SchemaFormValues, SchemaSectionSubmission } from "./state/formState";
export {
  buildInitialFormValues,
  mergeSavedRowsIntoPresetTable,
  mergeSectionDataIntoValues,
  toSectionSubmissions,
  schemaValuesHaveUserData,
  getBlockValue,
  setBlockValue,
  scopedFormKey,
} from "./state/formState";

export { syncRowGenerationTables, prepareSchemaValuesForSubmission } from "./utils/rowGenerationSync";

export { parseSchemaDocument } from "./utils/schemaUtils";
export {
  isApiStyleSection,
  isApiStyleSections,
  normalizeApiSchemaSections,
  normalizeApiSection,
} from "./utils/apiSchemaNormalizer";
export type { SchemaThemeTokens } from "./utils/schemaUtils";
export { defaultThemeTokens, mergeThemeFromDesignSystem } from "./utils/schemaUtils";

export {
  buildFlatVisibilityContext,
  isSchemaVisible,
  isSectionVisible,
  isBlockVisible,
  pruneHiddenFormValues,
} from "./rules/visibility";

export {
  buildCastingSetupContext,
  resolveSchemaCountToken,
  type SchemaSetupContext,
} from "./utils/setupContext";

export type { SchemaApiContext } from "./rules/apiDependency";
export {
  fetchSchemaApiOptions,
  fetchSchemaDataSourceOptions,
  fetchSchemaApiResolvedValue,
  resolveSchemaApiResponseValue,
  resolveSchemaApiEndpoint,
  staticDataSourceOptions,
  buildRowApiContext,
  getDependentColumnIds,
  seedBatchDetailsSchemaCache,
  seedSchemaApiResponseCache,
} from "./rules/apiDependency";

export {
  populateSchemaValuesFromApi,
  schemaHasPopulateFromApi,
  collectPopulateFromApiTargets,
} from "./rules/populateFromApi";

export {
  hasTableCommitGroup,
  getTableCommitGroup,
  isPickerRow,
  isExpandedRow,
  commitPickerRow,
  removeTableGroup,
  isCommitAddReady,
  isPickerColumnVisible,
  isExpandedColumnReadonly,
  findLastPickerRow,
  resolveDerivedColumnValue,
  formatReferenceRangeValue,
  rehydrateCommitGroupTableRows,
} from "./rules/tableCommitGroup";

export { evaluateRowFormula, applyFormulaColumns } from "./rules/formulaEval";
export { validateFieldValue } from "./validation/validateField";

export { registerBlockType, getBlockComponent } from "./registry/componentRegistry";

/** @deprecated Use SchemaDocumentV2 */
export type SchemaDocument = import("./types").SchemaDocumentV2;

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
  RAW_MATERIAL_PROCUREMENT_LOT_DATASOURCE,
} from "./adapters/rawMaterialPreparation.adapter";

export type {
  RawMaterialSchemaRequestParams,
  PreparationPremixEntry,
  PreparationProcessEntry,
  SchemaProcessSubmission,
} from "./adapters/rawMaterialPreparation.adapter";

export {
  PC_SCHEMA_FUNCTIONALITY,
  PC_SCHEMA_TYPE,
  PC_SCHEMA_VERSION,
  postCureSchemaFetchConfig,
  buildPostCureSchemaRequest,
  fetchPostCureSchema,
  createPostCureInitialValues,
  hydratePostCureValuesFromSections,
  buildPostCureSectionPayload,
} from "./adapters/postCure.adapter";

export type { PostCureSchemaRequestParams } from "./adapters/postCure.adapter";

export {
  SS_SCHEMA_FUNCTIONALITY,
  SS_SCHEMA_TYPE,
  SS_SCHEMA_VERSION,
  subscaleSchemaFetchConfig,
  buildSubscaleSchemaRequest,
  mapSubscaleBatchType,
  fetchSubscaleSchema,
  createSubscaleInitialValues,
  hydrateSubscaleValuesFromSections,
  buildSubscaleSectionPayload,
} from "./adapters/subscale.adapter";

export type { SubscaleBatchType } from "./adapters/subscale.adapter";

export {
  TR_SCHEMA_FUNCTIONALITY,
  TR_SCHEMA_TYPE,
  TR_SCHEMA_VERSION,
  trimmingSchemaFetchConfig,
  buildTrimmingSchemaRequest,
  mapTrimmingMotorStage,
  resolveTrimmingMotorStage,
  resolveTrimmingMotorStageNumber,
  resolveTrimmingMotorStageForApi,
  fetchTrimmingSchema,
  createTrimmingInitialValues,
  hydrateTrimmingValuesFromSections,
  buildTrimmingSectionPayload,
} from "./adapters/trimming.adapter";

export {
  STF_SCHEMA_FUNCTIONALITY,
  STF_SCHEMA_TYPE,
  STF_SCHEMA_VERSION,
  stfSchemaFetchConfig,
  buildStfSchemaRequest,
  mapStfSubType,
  fetchStfSchema,
  createStfInitialValues,
  hydrateStfValuesFromSections,
  buildStfSectionPayload,
} from "./adapters/stf.adapter";

export type { StfSubType } from "./adapters/stf.adapter";

export {
  DISPATCH_SCHEMA_FUNCTIONALITY,
  DISPATCH_SCHEMA_TYPE,
  DISPATCH_SCHEMA_VERSION,
  dispatchSchemaFetchConfig,
  buildDispatchSchemaRequest,
  fetchDispatchSchema,
  createDispatchInitialValues,
  hydrateDispatchValuesFromSections,
  buildDispatchSectionPayload,
  mapDispatchDetailsToSchemaValues,
  mapDispatchSchemaValuesToDispatchDetails,
} from "./adapters/dispatch.adapter";

export {
  QC_SCHEMA_FUNCTIONALITY,
  QC_SCHEMA_TYPE,
  QC_SCHEMA_VERSION,
  qcSchemaFetchConfig,
  buildQcSchemaRequest,
  fetchQcSchema,
  createQcInitialValues,
  hydrateQcValuesFromSections,
  buildQcSectionPayload,
} from "./adapters/qc.adapter";

export type { QcApiDivision, QcApiSubType } from "./adapters/qc.adapter";

/** Back-compat alias */
export { default as schemaManagementController } from "./controller/schemaEngineController";
