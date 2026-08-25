import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { STRINGS } from "../../../app/config/strings";
import { useAlertStore } from "../../../app/store/alertStore";
import { useAuthStore } from "../../../app/store/authStore";
import { useUserBatchRefreshStore } from "../../../app/store/userBatchRefreshStore";
import qcDivisionController from "../../../controllers/user/quality_control/qcDivisionController";
import { batchManagementController } from "../../../controllers/admin/BatchManagement/batchManagementController";
import { QCDivisionDetailsModel } from "../../../data/models/user/QCDivisionApiModel";
import {
  createDefaultQualityControlFormState,
  hasAnyQualityControlValue,
  hydrateQualityControlFormState,
  expandDivisionDetailSections,
  mapQualityControlDivisionSubmitPayload,
  mapQualityControlPayload,
  type QualityControlFormState,
} from "../../../data/models/user/QualityControlFormModel";
import {
  createQcInitialValues,
  fetchQcSchema,
  hydrateQcValuesFromSections,
} from "../../../schema-engine/adapters/qc.adapter";
import type {
  QcApiDivision,
  QcApiSubType,
  QcInhibitorType,
} from "../../../schema-engine/adapters/qc.adapter";
import type {
  SchemaDocumentV2,
  SchemaFormValues,
  SchemaSectionSubmission,
} from "../../../schema-engine";
import {
  getQcSchemaCacheKey,
  mapQcDivisionsFromApi,
  resolveQcDivisionIdForSelection,
  resolveQcManufacturingDivisionDetailsId,
  resolveQcRawMaterialTypeOptions,
  toQcDivisionSelectOptions,
  toQcDivisionNavTabs,
  resolveBatchFlowSelection,
  resolveQcSchemaSelectionForSlot,
  type QcDivisionCatalogItem,
  type QcDivisionCatalogNavTab,
  type QCBatch,
} from "./qcFlowConfig";
import {
  hasPartialChildNav,
  isQcUnitApproved,
  isQcUnitLocked,
  resolveEntryIdsForPartialItem,
  scopeFormStateToPartialItem,
  updatePartialNavStatus,
  aggregatePartialNavStatus,
  areAllPartialItemsApproved,
  buildDivisionApprovalRows,
  buildFinalApprovalDivisionGroups,
  buildFinalApprovalRows,
  areAllFinalApprovalGroupsApproved,
  applyStatusMapsToPartialNav,
  normalizePartialItemStatus,
  findFirstEnabledPartialNavIndex,
  type QcPartialNavItem,
  type QcPartialItemStatus,
} from "./qcDivisionApprovalUnits";
import {
  getQcPartialNavTabDisabledReason,
  isQcPartialItemEnabledByPreviousDivision,
  resolveQcGateDivisionKey,
  resolveQcPreviousDivisionApprovedUnits,
} from "./qcPreviousDivisionApproval";
import { getBatchStageProgressArrays } from "../previousStageApproval";
import {
  buildQcDivisionPartialNav,
  buildPartialNavFromUnitStatusMaps,
  findQcFormDivisionDetail,
  groupUnitStatusesByDivisionTabKey,
  isQcStatusAwaitingInitiation,
  mergePartialNavItems,
  resolveMotorQcStatusFromFormDetails,
  resolveQcDivisionStatus,
  resolveQcDivisionStatusFromSources,
  shouldUseQcFormDetailsData,
  toDivisionAutoPopulateRecord,
} from "./qcDivisionDataSource";
import {
  isBothProcessingType,
  isRawMaterialProcessingType,
  isRawMaterialRevalidationType,
  type QcProcessingSlot,
} from "./qcProcessingConfig";
import {
  buildProcessingMaterialEntry,
  fetchQcProcessingMaterialSchema,
  getProcessingMaterialsForPremix,
  hydrateProcessingMaterialValuesFromSeed,
  parseProcessingMaterialsFromDivisionDetails,
} from "./qcProcessingMaterials";
import {
  resolveDivisionSchemaRequest,
  canLoadDivisionSchema,
  shouldSkipQcSchemaFetch,
  isBatchMotorSeededQcFlow,
} from "./qcDivisionRegistry";
import {
  appendDivisionEntryToForm,
  buildDivisionEntryDedupKey,
  buildDivisionEntryLabel,
  buildMotorDivisionGroupKey,
  createDivisionEntryId,
  getAddedDivisionEntryKeys,
  getAddedPremixNumbersForPicker,
  parseMotorDivisionGroupKey,
  resolveDivisionEntryKind,
} from "./qcDivisionEntries";
import {
  createInitialRevalidationSchemaValues,
  buildRevalidationValuesFromDivisionDetails,
  hydrateRevalidationValuesFromSections,
} from "./qcRawMaterialRevalidationTable";
import { operationsController } from "../../../controllers/user/operationsController";
import { MaterialSpecificationListModel } from "../../../data/models/user/MaterialSpecificationModel";
import type { QcDivisionEntry, QcDivisionEntryValues } from "./qcDivisionEntryTypes";
import { normalizeQcCuringType } from "./qcCuringConfig";
import {
  buildDivisionNavGroups,
  resolveFormNavForPartialItem,
  resolveNavIndicesForEntry,
} from "./qcDivisionNav";
import {
  getHardwareSectionIdForSubType,
  QC_HARDWARE_ATTACHMENTS_SECTION_ID,
  QC_HARDWARE_PROCESS_OPTIONS,
  resolveQcMotorIdOptions,
} from "./qcHardwareConfig";
import {
  applyHardwareDivisionDetailsSeed,
  applyHardwareSharedUploadsToEntryValues,
  resolveManufacturingDivisionDetailsPayload,
} from "./qcHardwareDivisionDetails";
import {
  createInitialHardwareProcessValues,
  hydrateHardwareProcessValuesFromSections,
  hydrateHardwareUploadValuesFromSections,
  isQcHardwareProcessSubType,
  mergeHardwareUploadValuesIntoEntryValues,
  hasIncompleteQcHardwareUploads,
  collectTempFileIdsFromQcHardwareValues,
} from "./qcHardwareTables";
import { applyCastingDivisionDetailsSeed } from "./qcCastingDivisionDetails";
import {
  applyCuringDivisionDetailsSeed,
  buildInitialCuringValuesForMotor,
  resolveCuringSubTypeFromDivisionDetails,
} from "./qcCuringDivisionDetails";
import {
  applyDeCoringDivisionDetailsSeed,
  buildInitialDeCoringValuesForMotor,
} from "./qcDeCoringDivisionDetails";
import { createInitialCastingValues, hydrateCastingValuesFromSections } from "./qcCastingTables";
import { createInitialCuringValues, hydrateCuringValuesFromSections } from "./qcCuringTables";
import { createInitialDeCoringValues, hydrateDeCoringValuesFromSections } from "./qcDeCoringTables";
import {
  applyTrimmingDivisionDetailsSeed,
  buildInitialTrimmingValuesForMotor,
} from "./qcTrimmingDivisionDetails";
import { createInitialTrimmingValues, hydrateTrimmingValuesFromSections } from "./qcTrimmingTables";
import {
  createInitialPropellantValues,
  hydratePropellantValuesFromSections,
  hasIncompleteQcPropellantUploads,
  collectTempFileIdsFromQcPropellantValues,
} from "./qcPropellantTables";
import { resolveQcPropellantPremixCount } from "./qcPropellantConfig";
import { mapQcTrimmingSubTypeToApi, resolveQcTrimmingSubType } from "./qcTrimmingConfig";
import { resolveQcSectionInhibitorType } from "./qcPostCureConfig";
import {
  createInitialPostCureValues,
  hydratePostCureValuesFromSections,
  postCureFormValuesHaveUserData,
  hasIncompleteQcPostCureUploads,
  collectTempFileIdsFromQcPostCureValues,
} from "./qcPostCureTables";
import {
  applyPostCureDivisionDetailsSeed,
  buildInitialPostCureValuesForMotor,
  resolvePostCureSelectionFromMotorDetails,
} from "./qcPostCureDivisionDetails";
import { createInitialNdtValues, hydrateNdtValuesFromSections, ndtFormValuesHaveUserData, hasIncompleteQcNdtUploads, collectTempFileIdsFromQcNdtValues } from "./qcNdtTables";
import {
  hasIncompleteQcRevalidationUploads,
  collectTempFileIdsFromQcRevalidationValues,
} from "./qcRawMaterialRevalidationTable";
import {
  applyNdtDivisionDetailsSeed,
  buildInitialNdtValuesForMotor,
} from "./qcNdtDivisionDetails";
import {
  createInitialWeighmentValues,
  hydrateWeighmentValuesFromSections,
  hasIncompleteQcWeighmentUploads,
  collectTempFileIdsFromQcWeighmentValues,
} from "./qcWeighmentTables";
import { buildInitialWeighmentValuesForMotor } from "./qcWeighmentDivisionDetails";
import {
  getMixingFinalMixEntries,
  groupMixingDetailSections,
  isQcMixingStage,
  QC_MIXING_PREMIX_SECTION_ID,
  QC_MIXING_VISCOSITY_SECTION_ID,
} from "./qcMixingConfig";
import {
  applyMixingDivisionEntryToValues,
  createInitialViscosityValues,
  createSeededMixingDetailsValues,
  extractMixingQualityCheckDefinitionsFromPayload,
  findMixingPremixDomainEntry,
  hydrateMixingDetailsValuesFromDomain,
  hydrateMixingDetailsValuesFromSections,
  hydrateMixingDivisionFromFormData,
  hydrateViscosityValuesFromDomain,
  hydrateViscosityValuesFromSections,
  mergeFinalMixEntrySchemaValues,
  pickFinalMixDetailsSchemaValues,
  resolveMixingQcFormData,
  type QcMixingQualityCheckDefinition,
} from "./qcMixingTables";
import { useSubdepartmentBatches } from "../useSubdepartmentBatches";
import {
  isManufacturingFillDetailsStatus,
  isManufacturingViewOnlyStatus,
} from "../../operationStatus";
import { QUALITY_CONTROL_STATUS } from "./qualityControlWorkflowData";
import {
  fetchQcSchemaWithInflightDedup,
  getCachedQcSchema,
  mapWithConcurrency,
} from "./qcSchemaFetchCache";
import { useFileService } from "../../../hooks/useFileService";
import { discardWorkflowForm } from "../../../utils/workflowDiscard";

const collectTempFileIdsFromQcForm = (form: QualityControlFormState | null | undefined): string[] => {
  if (!form) return [];
  const ids: string[] = [];
  const entries = form.divisionEntries ?? [];
  const valuesById = form.divisionEntryValues ?? {};
  for (const entry of entries) {
    const values = valuesById[entry.entryId]?.schemaValues;
    if (entry.kind === "NDT_MOTOR") {
      ids.push(...collectTempFileIdsFromQcNdtValues(values));
    } else if (entry.kind === "PROPELLANT_MOTOR" || entry.kind === "PROPELLANT_PROCESS") {
      ids.push(...collectTempFileIdsFromQcPropellantValues(values));
    } else if (entry.kind === "HARDWARE_PROCESS") {
      ids.push(...collectTempFileIdsFromQcHardwareValues(values));
    } else if (entry.kind === "POST_CURE_MOTOR") {
      ids.push(...collectTempFileIdsFromQcPostCureValues(values));
    } else if (entry.kind === "REVALIDATION") {
      ids.push(...collectTempFileIdsFromQcRevalidationValues(values));
    } else if (entry.kind === "WEIGHTMENT_MOTOR") {
      ids.push(...collectTempFileIdsFromQcWeighmentValues(values));
    }
  }
  return [...new Set(ids)];
};

const hasIncompleteQcFormUploads = (form: QualityControlFormState | null | undefined): boolean => {
  if (!form) return false;
  const entries = form.divisionEntries ?? [];
  const valuesById = form.divisionEntryValues ?? {};
  return entries.some((entry) => {
    const values = valuesById[entry.entryId]?.schemaValues;
    if (entry.kind === "NDT_MOTOR") return hasIncompleteQcNdtUploads(values);
    if (entry.kind === "PROPELLANT_MOTOR" || entry.kind === "PROPELLANT_PROCESS") {
      return hasIncompleteQcPropellantUploads(values);
    }
    if (entry.kind === "HARDWARE_PROCESS") return hasIncompleteQcHardwareUploads(values);
    if (entry.kind === "POST_CURE_MOTOR") return hasIncompleteQcPostCureUploads(values);
    if (entry.kind === "REVALIDATION") return hasIncompleteQcRevalidationUploads(values);
    if (entry.kind === "WEIGHTMENT_MOTOR") return hasIncompleteQcWeighmentUploads(values);
    return false;
  });
};

type WorkflowView = "list" | "form" | "details";

type QualityControlFormBase = Omit<
  QualityControlFormState,
  "divisionEntryValues" | "mixingFinalMixDetailsValues"
>;

const splitFormState = (state: QualityControlFormState) => {
  const { divisionEntryValues, mixingFinalMixDetailsValues, ...formBase } = state;
  return {
    formBase,
    divisionEntryValues: divisionEntryValues ?? {},
    mixingFinalMixDetailsValues,
  };
};

const mergeFormState = (
  formBase: QualityControlFormBase,
  divisionEntryValues: Record<string, QcDivisionEntryValues>,
  mixingFinalMixDetailsValues?: SchemaFormValues,
): QualityControlFormState => ({
  ...formBase,
  divisionEntryValues,
  mixingFinalMixDetailsValues,
});

const normalizeBatch = (batch: any): QCBatch => ({
  ...batch,
  lotId: batch?.lotId ?? batch?.batchId ?? "",
  qcStatus:
    batch?.qcStatus ??
    batch?.qcDivStatus ??
    batch?.status ??
    QUALITY_CONTROL_STATUS.TO_BE_INITIATED,
  formId: batch?.formId ?? null,
  rejectionReason: batch?.rejectionReason ?? null,
});

const hasDivisionEntries = (form: QualityControlFormState) =>
  (form.divisionEntries?.length ?? 0) > 0;

export const useQCDivisionHook = () => {
  const listParams = useSubdepartmentBatches("qc-division");
  const user = useAuthStore((state) => state.user);
  const showAlert = useAlertStore((state) => state.showAlert);
  const bumpBatchRefresh = useUserBatchRefreshStore((state) => state.bumpVersion);
  const { deleteTemp } = useFileService();
  const messages = STRINGS.QUALITY_CONTROL.QC_DIVISION;

  const subDepartmentId = useMemo(
    () =>
      user?.allSubDepartments.find((subDept) => subDept.slugs?.subDept === "qc-division")
        ?.subDepartmentId,
    [user],
  );

  const [view, setView] = useState<WorkflowView>("list");
  const [activeBatch, setActiveBatch] = useState<QCBatch | null>(null);
  const activeBatchRef = useRef(activeBatch);
  activeBatchRef.current = activeBatch;
  const [isEditMode, setIsEditMode] = useState(false);
  const [readOnly, setReadOnly] = useState(false);
  const defaultFormState = createDefaultQualityControlFormState();
  const defaultSplit = splitFormState(defaultFormState);
  const [formBase, setFormBase] = useState<QualityControlFormBase>(defaultSplit.formBase);
  const [divisionEntryValues, setDivisionEntryValues] = useState<
    Record<string, QcDivisionEntryValues>
  >(defaultSplit.divisionEntryValues);
  const [mixingFinalMixDetailsValues, setMixingFinalMixDetailsValues] = useState<
    SchemaFormValues | undefined
  >(defaultSplit.mixingFinalMixDetailsValues);
  const [isFormDirty, setIsFormDirty] = useState(false);
  const formData = useMemo(
    () => mergeFormState(formBase, divisionEntryValues, mixingFinalMixDetailsValues),
    [formBase, divisionEntryValues, mixingFinalMixDetailsValues],
  );
  const formDataRef = useRef(formData);
  formDataRef.current = formData;
  const schemasByKeyRef = useRef(formBase.schemasByKey);
  schemasByKeyRef.current = formBase.schemasByKey;

  const applyFullFormState = useCallback((state: QualityControlFormState) => {
    const split = splitFormState(state);
    setFormBase(split.formBase);
    setDivisionEntryValues(split.divisionEntryValues);
    setMixingFinalMixDetailsValues(split.mixingFinalMixDetailsValues);
  }, []);

  const markFormDirty = useCallback(() => setIsFormDirty(true), []);

  const updateFormData = useCallback(
    (updater: (prev: QualityControlFormState) => QualityControlFormState) => {
      applyFullFormState(updater(formDataRef.current));
      markFormDirty();
    },
    [applyFullFormState, markFormDirty],
  );

  const [selectedDivision, setSelectedDivision] = useState("");
  const [divisionCatalog, setDivisionCatalog] = useState<QcDivisionCatalogItem[]>([]);
  const [divisionsLoading, setDivisionsLoading] = useState(false);
  const [divisionAutoPopulateData, setDivisionAutoPopulateData] = useState<Record<
    string,
    unknown
  > | null>(null);
  const divisionAutoPopulateDataRef = useRef(divisionAutoPopulateData);
  divisionAutoPopulateDataRef.current = divisionAutoPopulateData;
  const batchDetailsPayloadRef = useRef<unknown>(null);
  const resolvePropellantFmCount = useCallback(
    () =>
      resolveQcPropellantPremixCount(
        (divisionAutoPopulateDataRef.current as { __batchDetails?: unknown } | null)?.__batchDetails,
        divisionAutoPopulateDataRef.current,
        batchDetailsPayloadRef.current,
        activeBatchRef.current,
      ),
    [],
  );
  // Derive Mixing parameter/spec rows from division-details / QC details (no quality-checks API).
  const mixingQualityChecksByStage = useMemo(
    () =>
      selectedDivision === "MIXING"
        ? {
            PREMIX: extractMixingQualityCheckDefinitionsFromPayload(
              divisionAutoPopulateData,
              "PREMIX",
            ),
            FINAL_MIX: extractMixingQualityCheckDefinitionsFromPayload(
              divisionAutoPopulateData,
              "FINAL_MIX",
            ),
          }
        : {
            PREMIX: [] as QcMixingQualityCheckDefinition[],
            FINAL_MIX: [] as QcMixingQualityCheckDefinition[],
          },
    [divisionAutoPopulateData, selectedDivision],
  );
  const mixingQualityChecksByStageRef = useRef(mixingQualityChecksByStage);
  mixingQualityChecksByStageRef.current = mixingQualityChecksByStage;

  const buildSeededPremixDetailsValues = (premixNo: number, autoPopulatePayload?: unknown) => {
    const payload = autoPopulatePayload ?? divisionAutoPopulateDataRef.current;
    const fromPayload = extractMixingQualityCheckDefinitionsFromPayload(payload, "PREMIX");
    return createSeededMixingDetailsValues("premix", {
      premixNo,
      autoPopulatePayload: payload,
      batchPayload: activeBatchRef.current,
      qualityCheckDefinitions: fromPayload.length
        ? fromPayload
        : mixingQualityChecksByStageRef.current.PREMIX,
    });
  };
  const buildSeededFinalMixDetailsValues = (premixNo: number, autoPopulatePayload?: unknown) => {
    const payload = autoPopulatePayload ?? divisionAutoPopulateDataRef.current;
    const fromPayload = extractMixingQualityCheckDefinitionsFromPayload(payload, "FINAL_MIX");
    return createSeededMixingDetailsValues("finalMix", {
      premixNo,
      autoPopulatePayload: payload,
      batchPayload: activeBatchRef.current,
      qualityCheckDefinitions: fromPayload.length
        ? fromPayload
        : mixingQualityChecksByStageRef.current.FINAL_MIX,
    });
  };
  const [divisionAutoPopulateLoading, setDivisionAutoPopulateLoading] = useState(false);
  const divisionAutoPopulateRequestIdRef = useRef(0);
  const [partialNavItems, setPartialNavItems] = useState<QcPartialNavItem[]>([]);
  const [activePartialNavIndex, setActivePartialNavIndex] = useState(0);
  const [partialItemLoading, setPartialItemLoading] = useState(false);
  const [divisionStatusByFlowKey, setDivisionStatusByFlowKey] = useState<
    Record<string, QcPartialItemStatus>
  >({});
  const divisionStatusByFlowKeyRef = useRef(divisionStatusByFlowKey);
  divisionStatusByFlowKeyRef.current = divisionStatusByFlowKey;
  /** Cached /qc-division/details payload — used once a division/unit leaves TO_BE_INITIATED. */
  const qcFormDetailsPayloadRef = useRef<Record<string, unknown> | null>(null);
  /** Cross-division unit statuses from form details — used for previous-division gating. */
  const [formUnitStatuses, setFormUnitStatuses] = useState<{
    premixStatuses: unknown;
    motorStatuses: unknown;
  }>({ premixStatuses: null, motorStatuses: null });
  const formUnitStatusesRef = useRef(formUnitStatuses);
  formUnitStatusesRef.current = formUnitStatuses;
  /** Batch stageProgress / currentStage — manufacturing + QC last-used unit approvals. */
  const [batchStageArrays, setBatchStageArrays] = useState<{
    stageProgress: unknown;
    currentStage: unknown;
  }>({ stageProgress: null, currentStage: null });
  const partialNavLoadRequestIdRef = useRef(0);
  const partialNavSeedKeyRef = useRef("");
  const autoLoadRequestKeyRef = useRef("");
  const [selectedRawMaterialType, setSelectedRawMaterialType] = useState("");
  const [selectedProcessingType, setSelectedProcessingType] = useState("");
  const [selectedPremixSlot, setSelectedPremixSlot] =
    useState<QcProcessingSlot>("SOLID_PROCESSING");
  const [selectedPremix, setSelectedPremix] = useState<number | "">("");
  const [selectedMixingStage, setSelectedMixingStage] = useState("");
  const [selectedStfMotorType, setSelectedStfMotorType] = useState("");
  const [selectedMotorId, setSelectedMotorId] = useState("");
  const [selectedHardwareProcesses, setSelectedHardwareProcesses] = useState<string[]>([]);
  const [selectedTrimmingMotorCount, setSelectedTrimmingMotorCount] = useState<number | "">("");
  const [trimmingMotorReceivedDate, setTrimmingMotorReceivedDate] = useState("");
  const [selectedPostCureOperation, setSelectedPostCureOperation] = useState("");
  const [selectedInhibitorType, setSelectedInhibitorType] = useState("");
  const [selectedPropellantProcess, setSelectedPropellantProcess] = useState("");
  const [activeDivisionGroupIndex, setActiveDivisionGroupIndex] = useState(0);
  const [activeDivisionSubIndex, setActiveDivisionSubIndex] = useState(0);
  const [loadingFormDetails, setLoadingFormDetails] = useState(false);
  const [schemaLoading, setSchemaLoading] = useState(false);
  const [schemaError, setSchemaError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [backConfirmOpen, setBackConfirmOpen] = useState(false);
  const [hasSavedDraft, setHasSavedDraft] = useState(false);
  const [detailsRow, setDetailsRow] = useState<QCBatch | null>(null);
  const [detailsData, setDetailsData] = useState<Record<string, unknown> | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const batches = useMemo(
    () => (listParams.batches ?? []).map(normalizeBatch),
    [listParams.batches],
  );

  const addedDivisionEntryKeys = useMemo(
    () => getAddedDivisionEntryKeys(formBase.divisionEntries),
    [formBase.divisionEntries],
  );

  const navigateToEntry = useCallback((entries: QcDivisionEntry[], entryId: string) => {
    const { groupIndex, subIndex } = resolveNavIndicesForEntry(entries, entryId);
    setActiveDivisionGroupIndex(groupIndex);
    setActiveDivisionSubIndex(subIndex);
  }, []);

  const navigateToMixingDetails = useCallback((entries: QcDivisionEntry[]) => {
    const groups = buildDivisionNavGroups(entries);
    const mixingGroupIndex = groups.findIndex((group) => group.flowKey === "MIXING");
    setActiveDivisionGroupIndex(mixingGroupIndex >= 0 ? mixingGroupIndex : 0);
    setActiveDivisionSubIndex(0);
  }, []);

  const addedPremixNumbers = useMemo(
    () =>
      getAddedPremixNumbersForPicker(formBase.divisionEntries, {
        flowKey: selectedDivision,
        rawMaterialType: selectedRawMaterialType,
        processingType: selectedProcessingType,
        mixingStage: selectedMixingStage,
        selectedPremix,
        stfMotorType: selectedStfMotorType,
      }),
    [
      formBase.divisionEntries,
      selectedDivision,
      selectedMixingStage,
      selectedPremix,
      selectedProcessingType,
      selectedRawMaterialType,
      selectedStfMotorType,
    ],
  );

  const isFormDirtyForView = view === "form" && isFormDirty;

  const resetProcessingFormState = () => ({
    schemaFormLoaded: false,
    division: null,
    subType: null,
    qcSchema: null,
    schemaFormValues: {},
    divisionEntries: [],
    divisionEntryValues: {},
    solidPremixEntries: [],
    solidPremixValuesByNo: {},
    liquidPremixEntries: [],
    liquidPremixValuesByNo: {},
  });

  const resetFormContext = useCallback(() => {
    const defaults = createDefaultQualityControlFormState();
    setView("list");
    setActiveBatch(null);
    setIsEditMode(false);
    applyFullFormState(defaults);
    setIsFormDirty(false);
    setSelectedDivision("");
    setSelectedRawMaterialType("");
    setSelectedProcessingType("");
    setSelectedPremixSlot("SOLID_PROCESSING");
    setSelectedPremix("");
    setSelectedMixingStage("");
    setSelectedStfMotorType("");
    setSelectedMotorId("");
    setSelectedHardwareProcesses([]);
    setSelectedTrimmingMotorCount("");
    setTrimmingMotorReceivedDate("");
    setSelectedPostCureOperation("");
    setSelectedInhibitorType("");
    setSelectedPropellantProcess("");
    setActiveDivisionGroupIndex(0);
    setActiveDivisionSubIndex(0);
    setLoadingFormDetails(false);
    setSchemaLoading(false);
    setSchemaError(null);
    setActionLoading(false);
    setBackConfirmOpen(false);
    setHasSavedDraft(false);
    setReadOnly(false);
    setDetailsRow(null);
    setDetailsData(null);
    setDetailsLoading(false);
    divisionAutoPopulateRequestIdRef.current += 1;
    partialNavLoadRequestIdRef.current += 1;
    setDivisionAutoPopulateData(null);
    setDivisionAutoPopulateLoading(false);
    setPartialNavItems([]);
    setActivePartialNavIndex(0);
    setPartialItemLoading(false);
    setDivisionStatusByFlowKey({});
    qcFormDetailsPayloadRef.current = null;
    setFormUnitStatuses({ premixStatuses: null, motorStatuses: null });
    setBatchStageArrays({ stageProgress: null, currentStage: null });
    partialNavSeedKeyRef.current = "";
  }, [applyFullFormState]);

  const getErrorMessage = (response: any, fallbackMessage: string) => {
    if (response?.error?.details) return response.error.details;
    if (response?.message) return response.message;
    return fallbackMessage;
  };

  const fetchQcSchemaDocumentCore = useCallback(
    async (
      division: QcApiDivision,
      subType: QcApiSubType,
      inhibitorType?: QcInhibitorType | null,
      options?: { silent?: boolean },
    ) => {
      if (shouldSkipQcSchemaFetch(division, subType)) return null;
      if (!subDepartmentId) {
        if (!options?.silent) showAlert(messages.SUB_DEPARTMENT_MISSING, "error");
        return null;
      }

      const cacheKey = getQcSchemaCacheKey(division, subType, inhibitorType);
      const cached = schemasByKeyRef.current?.[cacheKey] ?? getCachedQcSchema(cacheKey);
      if (cached) return { schema: cached, division, subType, inhibitorType };

      const schema = await fetchQcSchemaWithInflightDedup(cacheKey, async () => {
        const response = await fetchQcSchema({
          subDepartmentId,
          division,
          subType,
          inhibitorType,
        });
        if (!response?.success || !response?.data) {
          const message = getErrorMessage(response, messages.SCHEMA_FETCH_ERROR);
          setSchemaError(message);
          if (!options?.silent) showAlert(message, "error");
          return null;
        }
        return response.data;
      });

      if (!schema) return null;
      return { schema, division, subType, inhibitorType };
    },
    [messages.SCHEMA_FETCH_ERROR, messages.SUB_DEPARTMENT_MISSING, showAlert, subDepartmentId],
  );

  const fetchQcSchemaDocument = useCallback(
    async (
      division: QcApiDivision,
      subType: QcApiSubType,
      inhibitorType?: QcInhibitorType | null,
    ) => {
      setSchemaLoading(true);
      setSchemaError(null);
      try {
        return await fetchQcSchemaDocumentCore(division, subType, inhibitorType);
      } finally {
        setSchemaLoading(false);
      }
    },
    [fetchQcSchemaDocumentCore],
  );

  const resetUnitPickers = useCallback(() => {
    setSelectedProcessingType("");
    setSelectedPremixSlot("SOLID_PROCESSING");
    setSelectedPremix("");
    setSelectedMixingStage("");
    setSelectedStfMotorType("");
    setSelectedMotorId("");
    setSelectedHardwareProcesses([]);
    setSelectedTrimmingMotorCount("");
    setTrimmingMotorReceivedDate("");
    setSelectedPostCureOperation("");
    setSelectedInhibitorType("");
    setSelectedPropellantProcess("");
    setSchemaError(null);
  }, []);

  /** Keep active division tab; clear only unit-level pickers after Add. */
  const resetFlowBarSelection = useCallback(() => {
    resetUnitPickers();
  }, [resetUnitPickers]);

  const clearPartialNav = useCallback(() => {
    partialNavLoadRequestIdRef.current += 1;
    partialNavSeedKeyRef.current = "";
    setPartialNavItems([]);
    setActivePartialNavIndex(0);
    setPartialItemLoading(false);
  }, []);

  const ensureQcFormDetailsPayload = useCallback(
    async (options?: { forceRefresh?: boolean }): Promise<Record<string, unknown> | null> => {
      if (!options?.forceRefresh && qcFormDetailsPayloadRef.current) {
        return qcFormDetailsPayloadRef.current;
      }
      const formId = String(activeBatch?.formId ?? "").trim();
      if (!formId || !subDepartmentId) return null;
      try {
        const detailsResponse = await qcDivisionController.fetchFormDetails({
          formId,
          subDepartmentId,
        });
        if (!detailsResponse?.success || !detailsResponse.data) return null;
        const payload = detailsResponse.data as unknown as Record<string, unknown>;
        qcFormDetailsPayloadRef.current = payload;
        return payload;
      } catch (error) {
        console.error("Failed to load QC form details for division data:", error);
        return null;
      }
    },
    [activeBatch?.formId, subDepartmentId],
  );

  const fetchManufacturingDivisionDetails = useCallback(
    async (params: {
      batchId: string;
      divisionId: number;
    }): Promise<Record<string, unknown> | null> => {
      const response = await qcDivisionController.fetchDivisionDetails({
        batchId: params.batchId,
        divisionId: params.divisionId,
      });
      if (!response?.success) {
        showAlert(response?.message || messages.DETAILS_FETCH_ERROR, "error");
        return null;
      }
      const data = response.data;
      return data && typeof data === "object" && !Array.isArray(data)
        ? (data as Record<string, unknown>)
        : null;
    },
    [messages.DETAILS_FETCH_ERROR, showAlert],
  );

  const loadDivisionAutoPopulate = useCallback(
    async (divisionFlowKey: string, typeValue?: string | null) => {
      const batchId = String(activeBatch?.batchId ?? "").trim();
      const divisionId = resolveQcManufacturingDivisionDetailsId(
        divisionCatalog,
        divisionFlowKey,
        typeValue,
      );

      if (!batchId || !divisionFlowKey || divisionId == null) {
        divisionAutoPopulateRequestIdRef.current += 1;
        setDivisionAutoPopulateData(null);
        setDivisionAutoPopulateLoading(false);
        clearPartialNav();
        return null;
      }

      const requestId = ++divisionAutoPopulateRequestIdRef.current;
      setDivisionAutoPopulateLoading(true);
      clearPartialNav();
      try {
        const typeKey = String(typeValue ?? "").trim();

        // Prefer cached form details (and fetch when formId exists) before deciding the API.
        const formDetailsForStatus =
          qcFormDetailsPayloadRef.current ??
          (String(activeBatch?.formId ?? "").trim() ? await ensureQcFormDetailsPayload() : null);
        if (requestId !== divisionAutoPopulateRequestIdRef.current) return null;

        const divisionStatus = resolveQcDivisionStatusFromSources({
          statusByKey: divisionStatusByFlowKeyRef.current,
          formDetails: formDetailsForStatus,
          flowKey: divisionFlowKey,
          rawMaterialType: typeKey,
        });
        const useFormDetails = shouldUseQcFormDetailsData(divisionStatus);

        let batchPayload: unknown = null;
        try {
          batchPayload =
            batchDetailsPayloadRef.current ??
            (await batchManagementController.getBatchById(batchId));
          if (batchPayload) {
            batchDetailsPayloadRef.current = batchPayload;
            const stageArrays = getBatchStageProgressArrays(
              batchPayload as Record<string, unknown>,
            );
            if (stageArrays.stageProgress || stageArrays.currentStage) {
              setBatchStageArrays(stageArrays);
            }
          }
        } catch (error) {
          console.error("Failed to load batch details for QC unit gating:", error);
        }

        let seedRecord: Record<string, unknown> | null = null;

        if (useFormDetails) {
          // IN_PROGRESS / APPROVED / etc. → /qc-division/details only (all divisions).
          // Manufacturing /division-details is lazy-loaded per TO_BE_INITIATED unit on open.
          const formDetails = formDetailsForStatus ?? (await ensureQcFormDetailsPayload());
          if (requestId !== divisionAutoPopulateRequestIdRef.current) return null;
          const matchingDetail = findQcFormDivisionDetail(formDetails, {
            flowKey: divisionFlowKey,
            rawMaterialType: typeKey,
          });
          // Mixing QC details split PREMIX + FINAL_MIX across divisionDetails — merge by premixNo.
          const qcData =
            (divisionFlowKey === "MIXING" ? resolveMixingQcFormData(formDetails) : null) ??
            toDivisionAutoPopulateRecord(matchingDetail) ??
            matchingDetail ??
            null;

          seedRecord = {
            ...(qcData ?? {}),
            ...(qcData ? { __qcFormDivisionData: qcData } : {}),
            ...(batchPayload ? { __batchDetails: batchPayload } : {}),
          };
        } else if (isBatchMotorSeededQcFlow(divisionFlowKey)) {
          // QC / Weighment have no manufacturing seed — load empty motor UI from batch motors.
          seedRecord = {
            ...(batchPayload ? { __batchDetails: batchPayload } : {}),
          };
        } else {
          // TO_BE_INITIATED → seed from /qc-division/division-details
          seedRecord = await fetchManufacturingDivisionDetails({ batchId, divisionId });
          if (requestId !== divisionAutoPopulateRequestIdRef.current) return null;
          if (!seedRecord) {
            setDivisionAutoPopulateData(null);
            return null;
          }
          seedRecord = {
            ...seedRecord,
            __manufacturingDivisionData: seedRecord,
            ...(batchPayload ? { __batchDetails: batchPayload } : {}),
          };
        }

        setDivisionAutoPopulateData(seedRecord);

        let withStatuses = buildQcDivisionPartialNav({
          flowKey: divisionFlowKey,
          rawMaterialType: typeKey,
          autoPopulatePayload: seedRecord,
          batchPayload,
          motorStatuses: formUnitStatusesRef.current.motorStatuses,
          premixStatuses: formUnitStatusesRef.current.premixStatuses,
        });
        if (isBatchMotorSeededQcFlow(divisionFlowKey)) {
          const fromBatch = resolveQcMotorIdOptions(activeBatch).map((option) => ({
            id: `motor:${option.value}`,
            kind: "MOTOR" as const,
            label: option.value,
            motorId: option.value,
            status: "TO_BE_INITIATED" as const,
          }));
          withStatuses = mergePartialNavItems(withStatuses, fromBatch);
        }
        setPartialNavItems(withStatuses);
        setActivePartialNavIndex(0);
        return withStatuses;
      } catch (error) {
        console.error("Failed to auto-populate QC division details:", error);
        if (requestId !== divisionAutoPopulateRequestIdRef.current) return null;
        setDivisionAutoPopulateData(null);
        clearPartialNav();
        showAlert(messages.DETAILS_FETCH_ERROR, "error");
        return null;
      } finally {
        if (requestId === divisionAutoPopulateRequestIdRef.current) {
          setDivisionAutoPopulateLoading(false);
        }
      }
    },
    [
      activeBatch,
      clearPartialNav,
      divisionCatalog,
      ensureQcFormDetailsPayload,
      fetchManufacturingDivisionDetails,
      messages.DETAILS_FETCH_ERROR,
      showAlert,
    ],
  );

  const handleDivisionChange = useCallback(
    (value: string) => {
      setSelectedDivision(value);
      setSelectedRawMaterialType("");
      resetUnitPickers();
      setDivisionAutoPopulateData(null);
      void loadDivisionAutoPopulate(value, null);
    },
    [loadDivisionAutoPopulate, resetUnitPickers],
  );

  const loadDivisionCatalog = useCallback(async () => {
    setDivisionsLoading(true);
    try {
      const response = await qcDivisionController.fetchDivisions();
      if (!response?.success) {
        showAlert(response?.message || messages.DETAILS_FETCH_ERROR, "error");
        setDivisionCatalog([]);
        return;
      }
      setDivisionCatalog(mapQcDivisionsFromApi(response.data));
    } catch (error) {
      console.error("Failed to load QC divisions:", error);
      setDivisionCatalog([]);
      showAlert(messages.DETAILS_FETCH_ERROR, "error");
    } finally {
      setDivisionsLoading(false);
    }
  }, [messages.DETAILS_FETCH_ERROR, showAlert]);

  useEffect(() => {
    if (view !== "form") return;
    if (divisionCatalog.length > 0 || divisionsLoading) return;
    void loadDivisionCatalog();
  }, [divisionCatalog.length, divisionsLoading, loadDivisionCatalog, view]);

  const divisionOptions = useMemo(
    () => toQcDivisionSelectOptions(divisionCatalog),
    [divisionCatalog],
  );

  const divisionNavTabs = useMemo(() => toQcDivisionNavTabs(divisionCatalog), [divisionCatalog]);

  const activeDivisionTabKey = useMemo(() => {
    if (!selectedDivision) return "";
    if (selectedDivision === "RAW_MATERIAL" && selectedRawMaterialType) {
      return selectedRawMaterialType;
    }
    return selectedDivision;
  }, [selectedDivision, selectedRawMaterialType]);

  const entryMatchesDivisionTab = useCallback(
    (entry: QcDivisionEntry, tab: QcDivisionCatalogNavTab) => {
      if (entry.flowKey !== tab.flowKey) return false;
      if (!tab.rawMaterialType) return true;
      if (isRawMaterialRevalidationType(tab.rawMaterialType)) {
        return entry.kind === "REVALIDATION";
      }
      if (isRawMaterialProcessingType(tab.rawMaterialType)) {
        return (
          entry.kind === "PROCESSING_MATERIAL" ||
          entry.kind === "SOLID_PREMIX" ||
          entry.kind === "LIQUID_PREMIX" ||
          entry.kind === "BOTH_PREMIX"
        );
      }
      return true;
    },
    [],
  );

  const syncActiveGroupForTab = useCallback(
    (tab: QcDivisionCatalogNavTab) => {
      const entries = formData.divisionEntries ?? [];
      if (!entries.length) {
        setActiveDivisionGroupIndex(0);
        setActiveDivisionSubIndex(0);
        return;
      }
      const groups = buildDivisionNavGroups(entries);
      const groupIndex = groups.findIndex((group) => group.flowKey === tab.flowKey);
      if (groupIndex >= 0) {
        setActiveDivisionGroupIndex(groupIndex);
        setActiveDivisionSubIndex(0);
      }
    },
    [formData.divisionEntries],
  );

  const handleDivisionNavTabChange = useCallback(
    (tabKey: string) => {
      const tab = divisionNavTabs.find((entry) => entry.tabKey === tabKey);
      if (!tab) return;
      setSelectedDivision(tab.flowKey);
      setSelectedRawMaterialType(tab.rawMaterialType);
      resetUnitPickers();
      setDivisionAutoPopulateData(null);
      syncActiveGroupForTab(tab);
      void loadDivisionAutoPopulate(tab.flowKey, tab.rawMaterialType || null);
    },
    [divisionNavTabs, loadDivisionAutoPopulate, resetUnitPickers, syncActiveGroupForTab],
  );

  // Auto-select first enabled division tab once catalog is available.
  useEffect(() => {
    if (view !== "form") return;
    if (!divisionNavTabs.length) return;
    if (selectedDivision) return;
    const first = divisionNavTabs[0];
    if (!first) return;
    setSelectedDivision(first.flowKey);
    setSelectedRawMaterialType(first.rawMaterialType);
    void loadDivisionAutoPopulate(first.flowKey, first.rawMaterialType || null);
  }, [divisionNavTabs, loadDivisionAutoPopulate, selectedDivision, view]);

  const rawMaterialTypeOptions = useMemo(
    () => resolveQcRawMaterialTypeOptions(divisionCatalog, selectedDivision),
    [divisionCatalog, selectedDivision],
  );

  const handleRawMaterialTypeChange = useCallback(
    (value: string) => {
      setSelectedRawMaterialType(value);
      setSelectedProcessingType("");
      setSelectedPremixSlot("SOLID_PROCESSING");
      setSelectedPremix("");
      setSchemaError(null);
      void loadDivisionAutoPopulate(selectedDivision, value);
    },
    [loadDivisionAutoPopulate, selectedDivision],
  );

  const handleProcessingTypeChange = useCallback((value: string) => {
    setSelectedProcessingType(value);
    setSelectedPremixSlot("SOLID_PROCESSING");
    setSelectedPremix("");
    setSchemaError(null);
  }, []);

  const handlePremixSlotChange = useCallback((value: QcProcessingSlot) => {
    setSelectedPremixSlot(value);
    setSelectedPremix("");
  }, []);

  const handlePremixChange = useCallback((value: number | "") => {
    setSelectedPremix(value);
  }, []);

  const handleMixingStageChange = useCallback((value: string) => {
    setSelectedMixingStage(value);
    setSelectedPremix("");
    setSchemaError(null);
  }, []);

  const handleStfMotorTypeChange = useCallback((value: string) => {
    setSelectedStfMotorType(value);
    setSchemaError(null);
  }, []);

  const handleMotorIdChange = useCallback((value: string) => {
    setSelectedMotorId(value);
    setSelectedHardwareProcesses([]);
    setSelectedPropellantProcess("");
    setSchemaError(null);
  }, []);

  const handleHardwareProcessesChange = useCallback((values: string[]) => {
    setSelectedHardwareProcesses(values);
    setSchemaError(null);
  }, []);

  const handleTrimmingMotorCountChange = useCallback((value: number | "") => {
    setSelectedTrimmingMotorCount(value);
    setSelectedMotorId("");
    setTrimmingMotorReceivedDate("");
    setSchemaError(null);
  }, []);

  const handleTrimmingMotorReceivedDateChange = useCallback((value: string) => {
    setTrimmingMotorReceivedDate(value);
    setSchemaError(null);
  }, []);

  const handlePostCureOperationChange = useCallback((value: string) => {
    setSelectedPostCureOperation(value);
    setSelectedInhibitorType("");
    setSelectedMotorId("");
    setSchemaError(null);
  }, []);

  const handleInhibitorTypeChange = useCallback((value: string) => {
    setSelectedInhibitorType(value);
    setSchemaError(null);
  }, []);

  const handlePropellantProcessChange = useCallback((value: string) => {
    setSelectedPropellantProcess(value);
    setSchemaError(null);
  }, []);

  const divisionFlowState = useMemo(
    () => ({
      rawMaterialType: selectedRawMaterialType,
      processingType: selectedProcessingType,
      mixingStage: selectedMixingStage,
      selectedPremix,
      addedPremixNumbers,
      stfMotorType: selectedStfMotorType,
      selectedMotorId,
      selectedHardwareProcesses,
      selectedTrimmingMotorCount,
      trimmingMotorReceivedDate,
      selectedPostCureOperation,
      selectedInhibitorType,
      selectedPropellantProcess,
      addedDivisionEntryKeys,
    }),
    [
      addedDivisionEntryKeys,
      addedPremixNumbers,
      selectedTrimmingMotorCount,
      trimmingMotorReceivedDate,
      selectedPostCureOperation,
      selectedInhibitorType,
      selectedPropellantProcess,
      selectedHardwareProcesses,
      selectedMixingStage,
      selectedMotorId,
      selectedPremix,
      selectedProcessingType,
      selectedRawMaterialType,
      selectedStfMotorType,
    ],
  );

  const buildEntryFromSelection = useCallback(
    (
      kind: NonNullable<ReturnType<typeof resolveDivisionEntryKind>>,
      selection: {
        division: QcApiDivision;
        subType: QcApiSubType;
        inhibitorType?: QcInhibitorType;
      },
      premixNo?: number,
      motorId?: string,
      motorMeta?: {
        motorCount?: number;
        motorReceivedDate?: string;
        weighscaleNo?: string;
        calibrationDueDate?: string;
      },
      overrides?: {
        flowKey?: string;
        rawMaterialType?: string;
        processingType?: string;
        mixingStage?: string;
      },
    ): QcDivisionEntry => {
      const flowKey = overrides?.flowKey ?? selectedDivision;
      const rawMaterialType = overrides?.rawMaterialType ?? selectedRawMaterialType;
      const processingType = overrides?.processingType ?? selectedProcessingType;
      const mixingStage = overrides?.mixingStage ?? selectedMixingStage;
      const entryId = createDivisionEntryId();
      return {
        entryId,
        flowKey,
        kind,
        apiDivision: selection.division,
        subType: selection.subType,
        inhibitorType: selection.inhibitorType,
        premixNo,
        motorId,
        motorCount: motorMeta?.motorCount,
        motorReceivedDate: motorMeta?.motorReceivedDate,
        weighscaleNo: motorMeta?.weighscaleNo,
        calibrationDueDate: motorMeta?.calibrationDueDate,
        label: buildDivisionEntryLabel({
          flowKey,
          kind,
          rawMaterialType,
          processingType,
          premixNo,
          motorId,
          subType: selection.subType,
          mixingStage: isQcMixingStage(mixingStage) ? mixingStage : undefined,
        }),
      };
    },
    [selectedDivision, selectedMixingStage, selectedProcessingType, selectedRawMaterialType],
  );

  const handleLoadQcForm = useCallback(async () => {
    const entryKind = resolveDivisionEntryKind(
      selectedDivision,
      selectedRawMaterialType,
      selectedProcessingType,
      selectedMixingStage,
    );
    if (!entryKind) return;

    if (entryKind === "HARDWARE_PROCESS") {
      // Hardware processes are auto-created from Motor Navigation (all 4 at once).
      return;
    }

    if (entryKind === "CASTING_MOTOR") {
      if (!selectedMotorId) return;

      const dedupKey = buildDivisionEntryDedupKey({
        flowKey: selectedDivision,
        kind: "CASTING_MOTOR",
        motorId: selectedMotorId,
      });
      if (addedDivisionEntryKeys.includes(dedupKey)) {
        showAlert(messages.DIVISION_ALREADY_ADDED, "warning");
        return;
      }

      const entry = buildEntryFromSelection(
        "CASTING_MOTOR",
        { division: "CASTING", subType: null },
        undefined,
        selectedMotorId,
      );
      const batchPayload =
        (divisionAutoPopulateDataRef.current as { __batchDetails?: unknown } | null)
          ?.__batchDetails ?? null;
      const motorNavItem = partialNavItems.find(
        (nav) => nav.kind === "MOTOR" && nav.motorId === selectedMotorId,
      );
      const motorStatus = motorNavItem?.status ?? "TO_BE_INITIATED";

      let initialValues = createInitialCastingValues();
      if (shouldUseQcFormDetailsData(motorStatus)) {
        const formDetails = await ensureQcFormDetailsPayload();
        const matchingDetail = findQcFormDivisionDetail(formDetails, {
          flowKey: selectedDivision,
          rawMaterialType: selectedRawMaterialType,
        });
        const seedRoot =
          matchingDetail && typeof matchingDetail === "object"
            ? (matchingDetail as Record<string, unknown>)
            : null;
        const sections = expandDivisionDetailSections(seedRoot);
        const motorSections = sections.filter(
          (section) =>
            String((section as { motorId?: string }).motorId ?? "").trim() === selectedMotorId,
        );
        if (motorSections.length) {
          initialValues = hydrateCastingValuesFromSections(motorSections);
        }
        initialValues = applyCastingDivisionDetailsSeed(
          initialValues,
          null,
          selectedMotorId,
          { onlyIfEmpty: true, batchPayload },
        );
      } else {
        const seedPayload =
          resolveManufacturingDivisionDetailsPayload(divisionAutoPopulateDataRef.current) ??
          divisionAutoPopulateDataRef.current;
        initialValues = applyCastingDivisionDetailsSeed(
          initialValues,
          seedPayload,
          selectedMotorId,
          { onlyIfEmpty: false, batchPayload },
        );
      }

      const nextEntries = [...(formData.divisionEntries ?? []), entry];
      updateFormData((prev) =>
        appendDivisionEntryToForm(prev, entry, { schemaValues: initialValues }, []),
      );
      navigateToEntry(nextEntries, entry.entryId);
      resetFlowBarSelection();
      return;
    }

    if (entryKind === "DE_CORING_MOTOR") {
      // De-coring motors are auto-created from Motor Navigation.
      return;
    }

    if (entryKind === "NDT_MOTOR") {
      // NDT motors are auto-created from Motor Navigation.
      return;
    }

    if (entryKind === "PROPELLANT_MOTOR") {
      // QC motors are auto-created from Motor Navigation.
      return;
    }

    if (entryKind === "WEIGHTMENT_MOTOR") {
      // Weighment motors are auto-created from Motor Navigation.
      return;
    }

    if (entryKind === "CURING_MOTOR") {
      // Curing motors are auto-created from Motor Navigation.
      return;
    }

    if (entryKind === "TRIMMING_MOTOR") {
      // Trimming motors are auto-created from Motor Navigation.
      return;
    }

    if (entryKind === "POST_CURE_MOTOR") {
      // Post Cure motors are auto-created from Motor Navigation (operationType from division-details).
      return;
    }

    const premixNo =
      entryKind === "MIXING_PREMIX" ||
      entryKind === "MIXING_FINAL_MIX" ||
      entryKind === "SOLID_PREMIX" ||
      entryKind === "LIQUID_PREMIX" ||
      entryKind === "BOTH_PREMIX"
        ? Number(selectedPremix)
        : undefined;

    if (premixNo != null && (selectedPremix === "" || Number.isNaN(premixNo))) return;

    const dedupKey = buildDivisionEntryDedupKey({
      flowKey: selectedDivision,
      kind: entryKind,
      premixNo,
      subType: (selectedStfMotorType || undefined) as QcApiSubType,
    });

    if (addedDivisionEntryKeys.includes(dedupKey)) {
      showAlert(
        premixNo != null ? messages.PREMIX_ALREADY_ADDED : messages.DIVISION_ALREADY_ADDED,
        "warning",
      );
      return;
    }

    if (
      (entryKind === "BOTH_PREMIX" ||
        entryKind === "SOLID_PREMIX" ||
        entryKind === "LIQUID_PREMIX") &&
      premixNo != null
    ) {
      const premixNavItem = partialNavItems.find(
        (nav) => nav.kind === "PREMIX" && nav.premixNo === premixNo,
      );
      const premixStatus = premixNavItem?.status ?? "TO_BE_INITIATED";
      if (shouldUseQcFormDetailsData(premixStatus)) {
        // IN_PROGRESS+ premix units are loaded from /qc-division/details via motor/premix nav.
        return;
      }

      let seedPayload =
        resolveManufacturingDivisionDetailsPayload(divisionAutoPopulateData) ??
        divisionAutoPopulateData;
      const materialSeeds = getProcessingMaterialsForPremix(seedPayload, premixNo);
      if (!materialSeeds.length) {
        const divisionId = resolveQcManufacturingDivisionDetailsId(
          divisionCatalog,
          selectedDivision,
          selectedRawMaterialType,
        );
        const batchId = String(activeBatch?.batchId ?? "").trim();
        if (divisionId != null && batchId) {
          try {
            const response = await qcDivisionController.fetchDivisionDetails({
              batchId,
              divisionId,
            });
            if (response?.success) {
              seedPayload = response.data;
            }
          } catch (error) {
            console.error("Failed to load raw material division-details seed:", error);
          }
        }
      }

      const resolvedSeeds = getProcessingMaterialsForPremix(seedPayload, premixNo);
      if (!resolvedSeeds.length || !subDepartmentId) {
        showAlert(messages.SCHEMA_FETCH_ERROR, "error");
        return;
      }

      const additions: Array<{
        entry: QcDivisionEntry;
        schema: SchemaDocumentV2;
        values: SchemaFormValues;
      }> = [];

      setSchemaLoading(true);
      setSchemaError(null);
      try {
        for (const seed of resolvedSeeds) {
          const schema = await fetchQcProcessingMaterialSchema({ subDepartmentId, seed });
          if (!schema) {
            showAlert(messages.SCHEMA_FETCH_ERROR, "error");
            return;
          }
          additions.push({
            entry: buildProcessingMaterialEntry(seed),
            schema,
            values: hydrateProcessingMaterialValuesFromSeed(schema, seed),
          });
        }

        if (!additions.length) return;

        const nextEntries = [
          ...(formData.divisionEntries ?? []),
          ...additions.map((item) => item.entry),
        ];
        updateFormData((prev) => {
          let next = prev;
          additions.forEach(({ entry, schema, values }) => {
            next = appendDivisionEntryToForm(next, entry, { schemaValues: values }, [
              { schema, cacheKey: entry.schemaCacheKey },
            ]);
          });
          return next;
        });
        navigateToEntry(nextEntries, additions[0].entry.entryId);
        resetFlowBarSelection();
      } finally {
        setSchemaLoading(false);
      }
      return;
    }

    // Raw Material Revalidation uses a dedicated table UI — no schema fetch.
    // TO_BE_INITIATED → /qc-division/division-details; IN_PROGRESS+ → /qc-division/details.
    if (entryKind === "REVALIDATION") {
      const selection = resolveDivisionSchemaRequest(selectedDivision, divisionFlowState);
      if (!selection) return;

      const divisionStatus = resolveQcDivisionStatus(divisionStatusByFlowKeyRef.current, {
        flowKey: selectedDivision,
        rawMaterialType: selectedRawMaterialType,
      });

      let autoPopulatePayload: unknown = null;
      if (shouldUseQcFormDetailsData(divisionStatus)) {
        const formDetails = await ensureQcFormDetailsPayload();
        const matchingDetail = findQcFormDivisionDetail(formDetails, {
          flowKey: selectedDivision,
          rawMaterialType: selectedRawMaterialType,
        });
        autoPopulatePayload =
          toDivisionAutoPopulateRecord(matchingDetail) ?? matchingDetail ?? null;
      } else {
        autoPopulatePayload = divisionAutoPopulateData;
        const divisionId = resolveQcDivisionIdForSelection(
          divisionCatalog,
          selectedDivision,
          selectedRawMaterialType,
        );
        const batchId = String(activeBatch?.batchId ?? "").trim();
        if (!autoPopulatePayload && divisionId && batchId) {
          try {
            const response = await qcDivisionController.fetchDivisionDetails({
              batchId,
              divisionId,
            });
            if (response?.success) {
              autoPopulatePayload = response.data;
              const record =
                response.data && typeof response.data === "object" && !Array.isArray(response.data)
                  ? (response.data as Record<string, unknown>)
                  : null;
              setDivisionAutoPopulateData(record);
            }
          } catch (error) {
            console.error("Failed to load revalidation division-details seed:", error);
          }
        }
      }

      const schemaValues = await buildRevalidationValuesFromDivisionDetails(
        autoPopulatePayload,
        async (materialCode) => {
          const response = await operationsController.fetchMaterialSpecificationList({
            materialCode,
            gradeCode: null,
          });
          const model =
            response?.data instanceof MaterialSpecificationListModel
              ? response.data
              : MaterialSpecificationListModel.fromApi(response?.data ?? response);
          return (model.specifications ?? []).map((spec) => ({
            specificationName: spec.specificationName,
            specificationCode: spec.specificationCode,
            specsLabel: spec.formattedReferenceRange,
          }));
        },
      );

      const entry = buildEntryFromSelection(entryKind, selection, premixNo);
      const nextEntries = [...(formData.divisionEntries ?? []), entry];
      updateFormData((prev) => appendDivisionEntryToForm(prev, entry, { schemaValues }, []));
      navigateToEntry(nextEntries, entry.entryId);
      resetFlowBarSelection();
      return;
    }

    const selection = resolveDivisionSchemaRequest(selectedDivision, divisionFlowState);
    if (!selection) return;

    const entry = buildEntryFromSelection(entryKind, selection, premixNo);

    if (entryKind === "MIXING_PREMIX") {
      const nextEntries = [...(formData.divisionEntries ?? []), entry];
      updateFormData((prev) =>
        appendDivisionEntryToForm(
          prev,
          entry,
          { schemaValues: buildSeededPremixDetailsValues(premixNo!) },
          [],
        ),
      );
      navigateToEntry(nextEntries, entry.entryId);
      resetFlowBarSelection();
      return;
    }

    if (entryKind === "MIXING_FINAL_MIX") {
      const nextEntries = [...(formData.divisionEntries ?? []), entry];
      const detailsValues = buildSeededFinalMixDetailsValues(premixNo!);
      updateFormData((prev) => {
        const next = appendDivisionEntryToForm(
          prev,
          entry,
          {
            schemaValues: mergeFinalMixEntrySchemaValues(
              detailsValues,
              createInitialViscosityValues(),
            ),
          },
          [],
        );
        return {
          ...next,
          mixingFinalMixDetailsValues: detailsValues,
        };
      });
      navigateToEntry(nextEntries, entry.entryId);
      resetFlowBarSelection();
      return;
    }

    const result = await fetchQcSchemaDocument(selection.division, selection.subType);
    if (!result) return;

    const nextEntries = [...(formData.divisionEntries ?? []), entry];
    updateFormData((prev) =>
      appendDivisionEntryToForm(
        prev,
        entry,
        { schemaValues: createQcInitialValues(result.schema) },
        [{ schema: result.schema, division: result.division, subType: result.subType }],
      ),
    );
    navigateToEntry(nextEntries, entry.entryId);
    resetFlowBarSelection();
  }, [
    addedDivisionEntryKeys,
    buildEntryFromSelection,
    divisionFlowState,
    fetchQcSchemaDocument,
    formData.divisionEntries,
    messages.DIVISION_ALREADY_ADDED,
    messages.PREMIX_ALREADY_ADDED,
    selectedDivision,
    selectedMixingStage,
    selectedPremix,
    selectedProcessingType,
    selectedRawMaterialType,
    selectedStfMotorType,
    selectedMotorId,
    selectedHardwareProcesses,
    selectedTrimmingMotorCount,
    trimmingMotorReceivedDate,
    selectedPostCureOperation,
    selectedInhibitorType,
    selectedPropellantProcess,
    showAlert,
    navigateToEntry,
    resetFlowBarSelection,
    ensureQcFormDetailsPayload,
    divisionAutoPopulateData,
    divisionCatalog,
    activeBatch?.batchId,
    partialNavItems,
  ]);

  // Tab / picker selection auto-loads the form UI — no separate Load Form click.
  useEffect(() => {
    if (view !== "form" || readOnly) return;
    if (hasPartialChildNav(partialNavItems)) return;
    if (!selectedDivision) return;
    if (!canLoadDivisionSchema(selectedDivision, divisionFlowState)) return;

    const requestKey = [
      activeDivisionTabKey,
      selectedRawMaterialType,
      selectedProcessingType,
      selectedMixingStage,
      String(selectedPremix),
      selectedMotorId,
      String(selectedTrimmingMotorCount),
      trimmingMotorReceivedDate,
      selectedPostCureOperation,
      selectedInhibitorType,
      selectedPropellantProcess,
      selectedHardwareProcesses.join(","),
    ].join("|");

    if (autoLoadRequestKeyRef.current === requestKey) return;
    autoLoadRequestKeyRef.current = requestKey;
    void handleLoadQcForm();
  }, [
    activeDivisionTabKey,
    divisionFlowState,
    handleLoadQcForm,
    partialNavItems,
    readOnly,
    selectedDivision,
    selectedHardwareProcesses,
    selectedInhibitorType,
    selectedMixingStage,
    selectedMotorId,
    selectedPostCureOperation,
    selectedPremix,
    selectedProcessingType,
    selectedPropellantProcess,
    selectedRawMaterialType,
    selectedTrimmingMotorCount,
    trimmingMotorReceivedDate,
    view,
  ]);

  const loadFormForPartialItem = useCallback(
    async (item: QcPartialNavItem) => {
      const flowKey = selectedDivision;
      if (!flowKey || !item) return;

      const requestId = ++partialNavLoadRequestIdRef.current;
      setPartialItemLoading(true);
      setSchemaError(null);

      const resolveSeedPayloadForUnit = async (): Promise<unknown> => {
        const auto = divisionAutoPopulateDataRef.current;
        if (shouldUseQcFormDetailsData(item.status)) {
          const formDetails = await ensureQcFormDetailsPayload();
          if (flowKey === "MIXING") {
            return (
              resolveMixingQcFormData(formDetails) ??
              (auto as { __qcFormDivisionData?: unknown } | null)?.__qcFormDivisionData ??
              null
            );
          }
          const matchingDetail = findQcFormDivisionDetail(formDetails, {
            flowKey,
            rawMaterialType: selectedRawMaterialType,
          });
          // IN_PROGRESS+ (all divisions): QC form details only — never manufacturing fallback.
          return (
            toDivisionAutoPopulateRecord(matchingDetail) ??
            (auto as { __qcFormDivisionData?: unknown } | null)?.__qcFormDivisionData ??
            null
          );
        }

        // TO_BE_INITIATED → manufacturing /qc-division/division-details
        // QC / Weighment have no manufacturing auto-populate.
        if (isBatchMotorSeededQcFlow(flowKey)) {
          return auto;
        }
        const manufacturing =
          (auto as any)?.__manufacturingDivisionData ??
          (auto && !(auto as any).__qcFormDivisionData ? auto : null);
        if (manufacturing) return manufacturing;

        const batchId = String(activeBatch?.batchId ?? "").trim();
        const divisionId = resolveQcManufacturingDivisionDetailsId(
          divisionCatalog,
          flowKey,
          selectedRawMaterialType,
        );
        if (!batchId || divisionId == null) return auto;
        const fetched = await fetchManufacturingDivisionDetails({ batchId, divisionId });
        if (fetched) {
          setDivisionAutoPopulateData((prev) =>
            prev ? { ...prev, __manufacturingDivisionData: fetched } : fetched,
          );
        }
        return fetched ?? auto;
      };

      try {
        const currentEntries = formDataRef.current.divisionEntries ?? [];
        const existingIds = resolveEntryIdsForPartialItem(currentEntries, item, { flowKey });
        const hardwareNeedsMoreProcesses =
          flowKey === "HARDWARE" &&
          item.kind === "MOTOR" &&
          existingIds.length > 0 &&
          existingIds.length < QC_HARDWARE_PROCESS_OPTIONS.length;
        if (existingIds.length && !hardwareNeedsMoreProcesses) {
          navigateToEntry(currentEntries, existingIds[0]);

          if (
            flowKey === "HARDWARE" &&
            item.kind === "MOTOR" &&
            item.motorId &&
            !shouldUseQcFormDetailsData(item.status)
          ) {
            const seedPayload = await resolveSeedPayloadForUnit();
            if (requestId !== partialNavLoadRequestIdRef.current) return;
            updateFormData((prev) => {
              let entryValues = { ...(prev.divisionEntryValues ?? {}) };
              for (const entry of prev.divisionEntries ?? []) {
                if (entry.kind !== "HARDWARE_PROCESS" || entry.motorId !== item.motorId) continue;
                const subType = String(entry.subType ?? "");
                if (!isQcHardwareProcessSubType(subType)) continue;
                entryValues = {
                  ...entryValues,
                  [entry.entryId]: {
                    ...entryValues[entry.entryId],
                    schemaValues: applyHardwareDivisionDetailsSeed(
                      entryValues[entry.entryId]?.schemaValues,
                      seedPayload,
                      item.motorId!,
                      subType,
                      { onlyIfEmpty: true },
                    ),
                  },
                };
              }
              return {
                ...prev,
                divisionEntryValues: entryValues,
              };
            });
          } else if (
            flowKey === "HARDWARE" &&
            item.kind === "MOTOR" &&
            item.motorId &&
            shouldUseQcFormDetailsData(item.status)
          ) {
            const seedPayload = await resolveSeedPayloadForUnit();
            if (requestId !== partialNavLoadRequestIdRef.current) return;
            const seedRoot =
              seedPayload && typeof seedPayload === "object"
                ? (seedPayload as Record<string, unknown>)
                : null;
            updateFormData((prev) => ({
              ...prev,
              divisionEntryValues: applyHardwareSharedUploadsToEntryValues(
                prev.divisionEntries ?? [],
                prev.divisionEntryValues ?? {},
                seedRoot ? expandDivisionDetailSections(seedRoot) : null,
              ),
            }));
          } else if (
            flowKey === "CASTING" &&
            item.kind === "MOTOR" &&
            item.motorId &&
            shouldUseQcFormDetailsData(item.status)
          ) {
            const seedPayload = await resolveSeedPayloadForUnit();
            if (requestId !== partialNavLoadRequestIdRef.current) return;
            const batchPayload =
              (divisionAutoPopulateDataRef.current as { __batchDetails?: unknown } | null)
                ?.__batchDetails ?? null;
            const seedRoot =
              seedPayload && typeof seedPayload === "object"
                ? (seedPayload as Record<string, unknown>)
                : null;
            updateFormData((prev) => {
              let entryValues = { ...(prev.divisionEntryValues ?? {}) };
              for (const entryId of existingIds) {
                let schemaValues = entryValues[entryId]?.schemaValues ?? createInitialCastingValues();
                const sections = expandDivisionDetailSections(seedRoot);
                const motorSections = sections.filter(
                  (section) =>
                    String((section as { motorId?: string }).motorId ?? "").trim() ===
                    item.motorId,
                );
                if (motorSections.length) {
                  schemaValues = hydrateCastingValuesFromSections(motorSections);
                }
                schemaValues = applyCastingDivisionDetailsSeed(
                  schemaValues,
                  null,
                  item.motorId!,
                  { onlyIfEmpty: true, batchPayload },
                );
                entryValues = {
                  ...entryValues,
                  [entryId]: {
                    ...entryValues[entryId],
                    schemaValues,
                  },
                };
              }
              return {
                ...prev,
                divisionEntryValues: entryValues,
              };
            });
          } else if (
            flowKey === "CASTING" &&
            item.kind === "MOTOR" &&
            item.motorId &&
            !shouldUseQcFormDetailsData(item.status)
          ) {
            const seedPayload = await resolveSeedPayloadForUnit();
            if (requestId !== partialNavLoadRequestIdRef.current) return;
            const batchPayload =
              (divisionAutoPopulateDataRef.current as { __batchDetails?: unknown } | null)
                ?.__batchDetails ?? null;
            updateFormData((prev) => {
              let entryValues = { ...(prev.divisionEntryValues ?? {}) };
              for (const entryId of existingIds) {
                entryValues = {
                  ...entryValues,
                  [entryId]: {
                    ...entryValues[entryId],
                    schemaValues: applyCastingDivisionDetailsSeed(
                      entryValues[entryId]?.schemaValues,
                      seedPayload,
                      item.motorId!,
                      { onlyIfEmpty: true, batchPayload },
                    ),
                  },
                };
              }
              return {
                ...prev,
                divisionEntryValues: entryValues,
              };
            });
          } else if (
            flowKey === "CURING" &&
            item.kind === "MOTOR" &&
            item.motorId &&
            shouldUseQcFormDetailsData(item.status)
          ) {
            const seedPayload = await resolveSeedPayloadForUnit();
            if (requestId !== partialNavLoadRequestIdRef.current) return;
            const seedRoot =
              seedPayload && typeof seedPayload === "object"
                ? (seedPayload as Record<string, unknown>)
                : null;
            updateFormData((prev) => {
              let entryValues = { ...(prev.divisionEntryValues ?? {}) };
              for (const entryId of existingIds) {
                let schemaValues = entryValues[entryId]?.schemaValues ?? createInitialCuringValues();
                const sections = expandDivisionDetailSections(seedRoot);
                const motorSections = sections.filter(
                  (section) =>
                    String((section as { motorId?: string }).motorId ?? "").trim() ===
                    item.motorId,
                );
                if (motorSections.length) {
                  schemaValues = hydrateCuringValuesFromSections(motorSections);
                }
                entryValues = {
                  ...entryValues,
                  [entryId]: {
                    ...entryValues[entryId],
                    schemaValues,
                  },
                };
              }
              return {
                ...prev,
                divisionEntryValues: entryValues,
              };
            });
          } else if (
            flowKey === "CURING" &&
            item.kind === "MOTOR" &&
            item.motorId &&
            !shouldUseQcFormDetailsData(item.status)
          ) {
            const seedPayload = await resolveSeedPayloadForUnit();
            if (requestId !== partialNavLoadRequestIdRef.current) return;
            updateFormData((prev) => {
              let entryValues = { ...(prev.divisionEntryValues ?? {}) };
              for (const entryId of existingIds) {
                entryValues = {
                  ...entryValues,
                  [entryId]: {
                    ...entryValues[entryId],
                    schemaValues: applyCuringDivisionDetailsSeed(
                      entryValues[entryId]?.schemaValues,
                      seedPayload,
                      item.motorId!,
                      { onlyIfEmpty: true },
                    ),
                  },
                };
              }
              return {
                ...prev,
                divisionEntryValues: entryValues,
              };
            });
          } else if (
            flowKey === "DE_CORING" &&
            item.kind === "MOTOR" &&
            item.motorId &&
            shouldUseQcFormDetailsData(item.status)
          ) {
            const seedPayload = await resolveSeedPayloadForUnit();
            if (requestId !== partialNavLoadRequestIdRef.current) return;
            const seedRoot =
              seedPayload && typeof seedPayload === "object"
                ? (seedPayload as Record<string, unknown>)
                : null;
            updateFormData((prev) => {
              let entryValues = { ...(prev.divisionEntryValues ?? {}) };
              for (const entryId of existingIds) {
                let schemaValues =
                  entryValues[entryId]?.schemaValues ?? createInitialDeCoringValues();
                const sections = expandDivisionDetailSections(seedRoot);
                const motorSections = sections.filter(
                  (section) =>
                    String((section as { motorId?: string }).motorId ?? "").trim() ===
                    item.motorId,
                );
                if (motorSections.length) {
                  schemaValues = hydrateDeCoringValuesFromSections(motorSections);
                }
                entryValues = {
                  ...entryValues,
                  [entryId]: {
                    ...entryValues[entryId],
                    schemaValues,
                  },
                };
              }
              return {
                ...prev,
                divisionEntryValues: entryValues,
              };
            });
          } else if (
            flowKey === "DE_CORING" &&
            item.kind === "MOTOR" &&
            item.motorId &&
            !shouldUseQcFormDetailsData(item.status)
          ) {
            const seedPayload = await resolveSeedPayloadForUnit();
            if (requestId !== partialNavLoadRequestIdRef.current) return;
            updateFormData((prev) => {
              let entryValues = { ...(prev.divisionEntryValues ?? {}) };
              for (const entryId of existingIds) {
                entryValues = {
                  ...entryValues,
                  [entryId]: {
                    ...entryValues[entryId],
                    schemaValues: applyDeCoringDivisionDetailsSeed(
                      entryValues[entryId]?.schemaValues ?? createInitialDeCoringValues(),
                      seedPayload,
                      item.motorId!,
                      { onlyIfEmpty: true },
                    ),
                  },
                };
              }
              return {
                ...prev,
                divisionEntryValues: entryValues,
              };
            });
          } else if (
            flowKey === "TRIMMING" &&
            item.kind === "MOTOR" &&
            item.motorId &&
            !shouldUseQcFormDetailsData(item.status)
          ) {
            const seedPayload = await resolveSeedPayloadForUnit();
            if (requestId !== partialNavLoadRequestIdRef.current) return;
            updateFormData((prev) => {
              let entryValues = { ...(prev.divisionEntryValues ?? {}) };
              for (const entryId of existingIds) {
                entryValues = {
                  ...entryValues,
                  [entryId]: {
                    ...entryValues[entryId],
                    schemaValues: applyTrimmingDivisionDetailsSeed(
                      entryValues[entryId]?.schemaValues ?? createInitialTrimmingValues(),
                      seedPayload,
                      item.motorId!,
                      { onlyIfEmpty: true },
                    ),
                  },
                };
              }
              return {
                ...prev,
                divisionEntryValues: entryValues,
              };
            });
          } else if (
            flowKey === "TRIMMING" &&
            item.kind === "MOTOR" &&
            item.motorId &&
            shouldUseQcFormDetailsData(item.status)
          ) {
            // IN_PROGRESS+ → reload saved unit from /qc-division/details
            const seedPayload = await resolveSeedPayloadForUnit();
            if (requestId !== partialNavLoadRequestIdRef.current) return;
            updateFormData((prev) => {
              let entryValues = { ...(prev.divisionEntryValues ?? {}) };
              for (const entryId of existingIds) {
                entryValues = {
                  ...entryValues,
                  [entryId]: {
                    ...entryValues[entryId],
                    schemaValues: buildInitialTrimmingValuesForMotor(seedPayload, item.motorId!),
                  },
                };
              }
              return {
                ...prev,
                divisionEntryValues: entryValues,
              };
            });
          } else if (
            flowKey === "NDT" &&
            item.kind === "MOTOR" &&
            item.motorId &&
            shouldUseQcFormDetailsData(item.status)
          ) {
            const seedPayload = await resolveSeedPayloadForUnit();
            if (requestId !== partialNavLoadRequestIdRef.current) return;
            updateFormData((prev) => {
              let entryValues = { ...(prev.divisionEntryValues ?? {}) };
              for (const entryId of existingIds) {
                entryValues = {
                  ...entryValues,
                  [entryId]: {
                    ...entryValues[entryId],
                    schemaValues: buildInitialNdtValuesForMotor(seedPayload, item.motorId!),
                  },
                };
              }
              return {
                ...prev,
                divisionEntryValues: entryValues,
              };
            });
          } else if (
            flowKey === "NDT" &&
            item.kind === "MOTOR" &&
            item.motorId &&
            !shouldUseQcFormDetailsData(item.status)
          ) {
            // TO_BE_INITIATED → manufacturing /qc-division/division-details
            const seedPayload = await resolveSeedPayloadForUnit();
            if (requestId !== partialNavLoadRequestIdRef.current) return;
            updateFormData((prev) => {
              let entryValues = { ...(prev.divisionEntryValues ?? {}) };
              for (const entryId of existingIds) {
                entryValues = {
                  ...entryValues,
                  [entryId]: {
                    ...entryValues[entryId],
                    schemaValues: applyNdtDivisionDetailsSeed(
                      entryValues[entryId]?.schemaValues ?? createInitialNdtValues(),
                      seedPayload,
                      item.motorId!,
                      { onlyIfEmpty: true },
                    ),
                  },
                };
              }
              return {
                ...prev,
                divisionEntryValues: entryValues,
              };
            });
          } else if (
            flowKey === "WEIGHTMENT" &&
            item.kind === "MOTOR" &&
            item.motorId &&
            shouldUseQcFormDetailsData(item.status)
          ) {
            const seedPayload = await resolveSeedPayloadForUnit();
            if (requestId !== partialNavLoadRequestIdRef.current) return;
            updateFormData((prev) => {
              let entryValues = { ...(prev.divisionEntryValues ?? {}) };
              for (const entryId of existingIds) {
                entryValues = {
                  ...entryValues,
                  [entryId]: {
                    ...entryValues[entryId],
                    schemaValues: buildInitialWeighmentValuesForMotor(seedPayload, item.motorId!),
                  },
                };
              }
              return {
                ...prev,
                divisionEntryValues: entryValues,
              };
            });
          } else if (
            flowKey === "POST_CURE" &&
            item.kind === "MOTOR" &&
            item.motorId &&
            shouldUseQcFormDetailsData(item.status)
          ) {
            // IN_PROGRESS+ → reload saved unit from /qc-division/details postCureMotorDetails
            const seedPayload = await resolveSeedPayloadForUnit();
            if (requestId !== partialNavLoadRequestIdRef.current) return;
            const formDetails = await ensureQcFormDetailsPayload();
            if (requestId !== partialNavLoadRequestIdRef.current) return;
            const valuePayload = seedPayload ?? formDetails;
            updateFormData((prev) => {
              let entryValues = { ...(prev.divisionEntryValues ?? {}) };
              for (const entryId of existingIds) {
                const entry = (prev.divisionEntries ?? []).find((row) => row.entryId === entryId);
                entryValues = {
                  ...entryValues,
                  [entryId]: {
                    ...entryValues[entryId],
                    schemaValues: buildInitialPostCureValuesForMotor(
                      valuePayload,
                      item.motorId!,
                      entry?.subType,
                      entry?.inhibitorType,
                    ),
                  },
                };
              }
              return {
                ...prev,
                divisionEntryValues: entryValues,
              };
            });
          } else if (
            flowKey === "POST_CURE" &&
            item.kind === "MOTOR" &&
            item.motorId &&
            !shouldUseQcFormDetailsData(item.status)
          ) {
            // TO_BE_INITIATED → manufacturing /division-details (fill empty fields only)
            const seedPayload = await resolveSeedPayloadForUnit();
            if (requestId !== partialNavLoadRequestIdRef.current) return;
            updateFormData((prev) => {
              let entryValues = { ...(prev.divisionEntryValues ?? {}) };
              for (const entryId of existingIds) {
                const entry = (prev.divisionEntries ?? []).find((row) => row.entryId === entryId);
                entryValues = {
                  ...entryValues,
                  [entryId]: {
                    ...entryValues[entryId],
                    schemaValues: applyPostCureDivisionDetailsSeed(
                      entryValues[entryId]?.schemaValues ??
                        createInitialPostCureValues(entry?.subType, entry?.inhibitorType),
                      seedPayload,
                      item.motorId!,
                      entry?.subType,
                      entry?.inhibitorType,
                      { onlyIfEmpty: true },
                    ),
                  },
                };
              }
              return {
                ...prev,
                divisionEntryValues: entryValues,
              };
            });
          } else if (
            flowKey === "QC" &&
            item.kind === "MOTOR" &&
            item.motorId &&
            shouldUseQcFormDetailsData(item.status)
          ) {
            const seedPayload = await resolveSeedPayloadForUnit();
            if (requestId !== partialNavLoadRequestIdRef.current) return;
            const seedRoot =
              seedPayload && typeof seedPayload === "object"
                ? (seedPayload as Record<string, unknown>)
                : null;
            const motorSections = expandDivisionDetailSections(seedRoot).filter(
              (section) =>
                String((section as { motorId?: string }).motorId ?? "").trim() === item.motorId,
            );
            updateFormData((prev) => {
              let entryValues = { ...(prev.divisionEntryValues ?? {}) };
              for (const entryId of existingIds) {
                entryValues = {
                  ...entryValues,
                  [entryId]: {
                    ...entryValues[entryId],
                    schemaValues: motorSections.length
                      ? hydratePropellantValuesFromSections(motorSections, resolvePropellantFmCount())
                      : entryValues[entryId]?.schemaValues ??
                        createInitialPropellantValues(resolvePropellantFmCount()),
                  },
                };
              }
              return {
                ...prev,
                divisionEntryValues: entryValues,
              };
            });
          }

          // Unit-status rule (all QC divisions):
          // TO_BE_INITIATED → manufacturing /division-details seed
          // IN_PROGRESS+ → saved /qc-division/details
          if (flowKey === "MIXING" && (item.kind === "PREMIX" || item.kind === "FINAL_MIX")) {
            const mixNo =
              item.kind === "FINAL_MIX" ? (item.finalMixNo ?? item.premixNo) : item.premixNo;
            if (mixNo == null) return;

            if (shouldUseQcFormDetailsData(item.status)) {
              const formDetails = await ensureQcFormDetailsPayload({ forceRefresh: true });
              if (requestId !== partialNavLoadRequestIdRef.current) return;
              const formData =
                resolveMixingQcFormData(formDetails) ??
                toDivisionAutoPopulateRecord(
                  findQcFormDivisionDetail(formDetails, {
                    flowKey,
                    rawMaterialType: selectedRawMaterialType,
                  }),
                ) ??
                toDivisionAutoPopulateRecord(formDetails);
              if (!formData) return;
              const domainEntry = findMixingPremixDomainEntry(formData, mixNo);
              const hydrated = hydrateMixingDivisionFromFormData(formData);
              updateFormData((prev) => {
                let next = { ...prev };
                const entryValues = { ...(prev.divisionEntryValues ?? {}) };
                if (item.kind === "PREMIX" && domainEntry?.premixDetails) {
                  entryValues[existingIds[0]] = {
                    ...entryValues[existingIds[0]],
                    schemaValues: hydrateMixingDetailsValuesFromDomain(
                      domainEntry.premixDetails,
                      "premix",
                    ),
                  };
                }
                if (item.kind === "FINAL_MIX") {
                  const finalMixDetails =
                    domainEntry?.finalMixDetails &&
                    typeof domainEntry.finalMixDetails === "object" &&
                    !Array.isArray(domainEntry.finalMixDetails)
                      ? (domainEntry.finalMixDetails as Record<string, unknown>)
                      : null;
                  let viscosityValues: SchemaFormValues | undefined;
                  if (finalMixDetails?.viscosityBuildUp) {
                    viscosityValues = hydrateViscosityValuesFromDomain(
                      finalMixDetails.viscosityBuildUp,
                    );
                  } else {
                    const fromHydrated = hydrated?.finalMixEntries.find(
                      (row) => row.premixNo === mixNo,
                    );
                    if (fromHydrated) viscosityValues = fromHydrated.values;
                  }
                  const detailsValues = finalMixDetails
                    ? hydrateMixingDetailsValuesFromDomain(finalMixDetails, "finalMix")
                    : hydrated?.finalMixDetailsValues;
                  if (viscosityValues || detailsValues) {
                    entryValues[existingIds[0]] = {
                      ...entryValues[existingIds[0]],
                      schemaValues: mergeFinalMixEntrySchemaValues(
                        detailsValues,
                        viscosityValues ?? entryValues[existingIds[0]]?.schemaValues,
                      ),
                    };
                  }
                  if (detailsValues) {
                    next = {
                      ...next,
                      mixingFinalMixDetailsValues: detailsValues,
                    };
                  }
                }
                return { ...next, divisionEntryValues: entryValues };
              });
            } else {
              // TO_BE_INITIATED → re-seed empty fields from manufacturing division-details.
              const seedPayload = await resolveSeedPayloadForUnit();
              if (requestId !== partialNavLoadRequestIdRef.current) return;
              const premixDefs = extractMixingQualityCheckDefinitionsFromPayload(
                seedPayload,
                "PREMIX",
              );
              updateFormData((prev) => {
                let next = { ...prev };
                const entryValues = { ...(prev.divisionEntryValues ?? {}) };
                if (item.kind === "PREMIX") {
                  const current = entryValues[existingIds[0]]?.schemaValues;
                  entryValues[existingIds[0]] = {
                    ...entryValues[existingIds[0]],
                    schemaValues: applyMixingDivisionEntryToValues(
                      current ?? buildSeededPremixDetailsValues(mixNo, seedPayload),
                      {
                        variant: "premix",
                        premixNo: mixNo,
                        autoPopulatePayload: seedPayload,
                        batchPayload: activeBatchRef.current,
                        qualityCheckDefinitions: premixDefs.length
                          ? premixDefs
                          : mixingQualityChecksByStageRef.current.PREMIX,
                      },
                      { onlyIfEmpty: true },
                    ),
                  };
                }
                if (item.kind === "FINAL_MIX") {
                  // Unit-status rule: TO_BE_INITIATED always reseeds from manufacturing for this mixNo.
                  // Do not keep prior Final Mix unit's QC details in the shared / entry blob.
                  const detailsValues = buildSeededFinalMixDetailsValues(mixNo, seedPayload);
                  const current = entryValues[existingIds[0]]?.schemaValues;
                  entryValues[existingIds[0]] = {
                    ...entryValues[existingIds[0]],
                    schemaValues: mergeFinalMixEntrySchemaValues(detailsValues, current),
                  };
                  next = {
                    ...next,
                    mixingFinalMixDetailsValues: detailsValues,
                  };
                }
                return { ...next, divisionEntryValues: entryValues };
              });
            }
          }
          return;
        }

        if (item.kind === "MOTOR" && item.motorId) {
          setSelectedMotorId(item.motorId);

          if (flowKey === "HARDWARE") {
            const currentEntries = formDataRef.current.divisionEntries ?? [];
            const existingIds = resolveEntryIdsForPartialItem(currentEntries, item, { flowKey });
            if (existingIds.length >= QC_HARDWARE_PROCESS_OPTIONS.length) {
              navigateToEntry(currentEntries, existingIds[0]);
              return;
            }

            const seedPayload = await resolveSeedPayloadForUnit();
            if (requestId !== partialNavLoadRequestIdRef.current) return;

            const additions: Array<{
              entry: QcDivisionEntry;
              values: SchemaFormValues;
            }> = [];

            for (const process of QC_HARDWARE_PROCESS_OPTIONS) {
              const dedupKey = buildDivisionEntryDedupKey({
                flowKey,
                kind: "HARDWARE_PROCESS",
                motorId: item.motorId,
                subType: process.value,
              });
              if (
                getAddedDivisionEntryKeys(formDataRef.current.divisionEntries ?? []).includes(
                  dedupKey,
                )
              ) {
                continue;
              }

              let values = createInitialHardwareProcessValues(process.value);
              if (shouldUseQcFormDetailsData(item.status)) {
                const expectedSectionId = getHardwareSectionIdForSubType(process.value);
                const seedRoot =
                  seedPayload && typeof seedPayload === "object"
                    ? (seedPayload as Record<string, unknown>)
                    : null;
                const allSections = expandDivisionDetailSections(
                  seedRoot && typeof seedRoot === "object"
                    ? (seedRoot as Record<string, unknown>)
                    : null,
                );
                const processSections = allSections.filter((section) => {
                  const sectionMotorId = String(
                    (section as { motorId?: string }).motorId ?? "",
                  ).trim();
                  if (sectionMotorId && sectionMotorId !== item.motorId) return false;
                  const sid = String(section.sectionId ?? "").trim();
                  if (process.value === "ABRADING" && sid === QC_HARDWARE_ATTACHMENTS_SECTION_ID) {
                    return true;
                  }
                  if (expectedSectionId && sid !== expectedSectionId) return false;
                  const sectionSubType = String((section as { subType?: string }).subType ?? "")
                    .trim()
                    .toUpperCase();
                  return !sectionSubType || sectionSubType === process.value;
                });
                if (processSections.length) {
                  values = hydrateHardwareProcessValuesFromSections(processSections, process.value);
                  if (process.value === "ABRADING") {
                    values = mergeHardwareUploadValuesIntoEntryValues(
                      values,
                      hydrateHardwareUploadValuesFromSections(processSections),
                    );
                  }
                }
              } else {
                values = applyHardwareDivisionDetailsSeed(
                  values,
                  seedPayload,
                  item.motorId,
                  process.value,
                  { onlyIfEmpty: false },
                );
              }

              additions.push({
                entry: buildEntryFromSelection(
                  "HARDWARE_PROCESS",
                  { division: "HARDWARE", subType: process.value },
                  undefined,
                  item.motorId,
                  undefined,
                  { flowKey },
                ),
                values,
              });
            }

            if (!additions.length) {
              const ids = resolveEntryIdsForPartialItem(
                formDataRef.current.divisionEntries ?? [],
                item,
                { flowKey },
              );
              if (ids[0]) navigateToEntry(formDataRef.current.divisionEntries ?? [], ids[0]);
              return;
            }

            const nextEntries = [
              ...(formDataRef.current.divisionEntries ?? []),
              ...additions.map((row) => row.entry),
            ];
            updateFormData((prev) => {
              let next = prev;
              additions.forEach(({ entry, values }) => {
                next = appendDivisionEntryToForm(next, entry, { schemaValues: values }, []);
              });
              if (shouldUseQcFormDetailsData(item.status)) {
                const seedRoot =
                  seedPayload && typeof seedPayload === "object"
                    ? (seedPayload as Record<string, unknown>)
                    : null;
                next = {
                  ...next,
                  divisionEntryValues: applyHardwareSharedUploadsToEntryValues(
                    next.divisionEntries ?? [],
                    next.divisionEntryValues ?? {},
                    seedRoot ? expandDivisionDetailSections(seedRoot) : null,
                  ),
                };
              }
              return next;
            });
            navigateToEntry(nextEntries, additions[0].entry.entryId);
            return;
          }

          const motorLoaders: Record<
            string,
            {
              kind: NonNullable<ReturnType<typeof resolveDivisionEntryKind>>;
              division: QcApiDivision;
              subType: QcApiSubType;
            }
          > = {
            CASTING: { kind: "CASTING_MOTOR", division: "CASTING", subType: null },
            CURING: { kind: "CURING_MOTOR", division: "CURING", subType: null },
            DE_CORING: { kind: "DE_CORING_MOTOR", division: "DE_CORING", subType: null },
            TRIMMING: {
              kind: "TRIMMING_MOTOR",
              division: "TRIMMING",
              subType: mapQcTrimmingSubTypeToApi(resolveQcTrimmingSubType()),
            },
            POST_CURE: { kind: "POST_CURE_MOTOR", division: "POST_CURE", subType: null },
            NDT: { kind: "NDT_MOTOR", division: "NDT", subType: null },
            QC: { kind: "PROPELLANT_MOTOR", division: "PROPELLANT_PROPERTIES", subType: null },
            WEIGHTMENT: { kind: "WEIGHTMENT_MOTOR", division: "WEIGHTMENT", subType: null },
          };

          const loader = motorLoaders[flowKey];
          if (!loader) {
            return;
          }

          const dedupKey = buildDivisionEntryDedupKey({
            flowKey,
            kind: loader.kind,
            motorId: item.motorId,
          });
          if (
            getAddedDivisionEntryKeys(formDataRef.current.divisionEntries ?? []).includes(dedupKey)
          ) {
            return;
          }

          if (loader.division === "CASTING") {
            let initialValues = createInitialCastingValues();
            const seedPayload = await resolveSeedPayloadForUnit();
            if (requestId !== partialNavLoadRequestIdRef.current) return;
            const batchPayload =
              (divisionAutoPopulateDataRef.current as { __batchDetails?: unknown } | null)
                ?.__batchDetails ?? null;

            if (shouldUseQcFormDetailsData(item.status)) {
              const seedRoot =
                seedPayload && typeof seedPayload === "object"
                  ? (seedPayload as Record<string, unknown>)
                  : null;
              const sections = expandDivisionDetailSections(seedRoot);
              const motorSections = sections.filter(
                (section) =>
                  String((section as { motorId?: string }).motorId ?? "").trim() === item.motorId,
              );
              if (motorSections.length) {
                initialValues = hydrateCastingValuesFromSections(motorSections);
              }
              // Batch metadata only — saved fields already hydrated from QC form details above.
              if (item.motorId) {
                initialValues = applyCastingDivisionDetailsSeed(
                  initialValues,
                  null,
                  item.motorId,
                  { onlyIfEmpty: true, batchPayload },
                );
              }
            } else if (item.motorId) {
              // TO_BE_INITIATED → division-details form seed + batch metadata casting type.
              initialValues = applyCastingDivisionDetailsSeed(
                initialValues,
                seedPayload,
                item.motorId,
                { onlyIfEmpty: false, batchPayload },
              );
            }

            const entry = buildEntryFromSelection(
              loader.kind,
              { division: loader.division, subType: loader.subType },
              undefined,
              item.motorId,
              undefined,
              { flowKey },
            );
            const nextEntries = [...(formDataRef.current.divisionEntries ?? []), entry];
            updateFormData((prev) =>
              appendDivisionEntryToForm(prev, entry, { schemaValues: initialValues }, []),
            );
            navigateToEntry(nextEntries, entry.entryId);
            return;
          }

          if (loader.division === "CURING") {
            const seedPayload = await resolveSeedPayloadForUnit();
            if (requestId !== partialNavLoadRequestIdRef.current) return;

            const curingSubType =
              normalizeQcCuringType(
                resolveCuringSubTypeFromDivisionDetails(seedPayload, item.motorId),
              ) || "NORMAL";
            let initialValues = createInitialCuringValues(curingSubType);

            if (shouldUseQcFormDetailsData(item.status)) {
              const seedRoot =
                seedPayload && typeof seedPayload === "object"
                  ? (seedPayload as Record<string, unknown>)
                  : null;
              const sections = expandDivisionDetailSections(seedRoot);
              const motorSections = sections.filter(
                (section) =>
                  String((section as { motorId?: string }).motorId ?? "").trim() === item.motorId,
              );
              if (motorSections.length) {
                initialValues = hydrateCuringValuesFromSections(motorSections);
              }
            } else if (item.motorId) {
              initialValues = buildInitialCuringValuesForMotor(
                seedPayload,
                item.motorId,
                curingSubType,
              );
            }

            const entry = buildEntryFromSelection(
              loader.kind,
              { division: loader.division, subType: curingSubType },
              undefined,
              item.motorId,
              undefined,
              { flowKey },
            );
            const nextEntries = [...(formDataRef.current.divisionEntries ?? []), entry];
            updateFormData((prev) =>
              appendDivisionEntryToForm(prev, entry, { schemaValues: initialValues }, []),
            );
            navigateToEntry(nextEntries, entry.entryId);
            return;
          }

          if (loader.division === "DE_CORING") {
            const seedPayload = await resolveSeedPayloadForUnit();
            if (requestId !== partialNavLoadRequestIdRef.current) return;

            let initialValues = createInitialDeCoringValues();

            if (shouldUseQcFormDetailsData(item.status)) {
              const seedRoot =
                seedPayload && typeof seedPayload === "object"
                  ? (seedPayload as Record<string, unknown>)
                  : null;
              const sections = expandDivisionDetailSections(seedRoot);
              const motorSections = sections.filter(
                (section) =>
                  String((section as { motorId?: string }).motorId ?? "").trim() === item.motorId,
              );
              if (motorSections.length) {
                initialValues = hydrateDeCoringValuesFromSections(motorSections);
              }
            } else if (item.motorId) {
              initialValues = buildInitialDeCoringValuesForMotor(seedPayload, item.motorId);
            }

            const entry = buildEntryFromSelection(
              loader.kind,
              { division: loader.division, subType: loader.subType },
              undefined,
              item.motorId,
              undefined,
              { flowKey },
            );
            const nextEntries = [...(formDataRef.current.divisionEntries ?? []), entry];
            updateFormData((prev) =>
              appendDivisionEntryToForm(prev, entry, { schemaValues: initialValues }, []),
            );
            navigateToEntry(nextEntries, entry.entryId);
            return;
          }

          if (loader.division === "TRIMMING") {
            const seedPayload = await resolveSeedPayloadForUnit();
            if (requestId !== partialNavLoadRequestIdRef.current) return;

            // TO_BE_INITIATED → manufacturing division-details
            // IN_PROGRESS+ → /qc-division/details trimmingDetails[]
            const initialValues = item.motorId
              ? buildInitialTrimmingValuesForMotor(seedPayload, item.motorId)
              : createInitialTrimmingValues();

            const motorReceivedDate = String(
              (initialValues as Record<string, unknown>).motorReceivedAt ?? "",
            ).trim();

            const entry = buildEntryFromSelection(
              loader.kind,
              { division: loader.division, subType: loader.subType },
              undefined,
              item.motorId,
              motorReceivedDate ? { motorReceivedDate } : undefined,
              { flowKey },
            );
            const nextEntries = [...(formDataRef.current.divisionEntries ?? []), entry];
            updateFormData((prev) =>
              appendDivisionEntryToForm(prev, entry, { schemaValues: initialValues }, []),
            );
            navigateToEntry(nextEntries, entry.entryId);
            return;
          }

          if (loader.division === "POST_CURE") {
            const seedPayload = await resolveSeedPayloadForUnit();
            if (requestId !== partialNavLoadRequestIdRef.current) return;

            const manufacturingPayload = resolveManufacturingDivisionDetailsPayload(
              divisionAutoPopulateDataRef.current,
            );
            const seedRoot =
              seedPayload && typeof seedPayload === "object"
                ? (seedPayload as Record<string, unknown>)
                : null;
            const useQcDetails = shouldUseQcFormDetailsData(item.status);

            // IN_PROGRESS+ → /qc-division/details postCureMotorDetails
            // TO_BE_INITIATED → manufacturing /qc-division/division-details
            const formDetails = useQcDetails ? await ensureQcFormDetailsPayload() : null;
            if (requestId !== partialNavLoadRequestIdRef.current) return;
            const valuePayload = useQcDetails
              ? seedRoot ?? formDetails
              : manufacturingPayload ?? seedRoot;

            const selection = item.motorId
              ? resolvePostCureSelectionFromMotorDetails(valuePayload, item.motorId) ??
                (!useQcDetails
                  ? resolvePostCureSelectionFromMotorDetails(manufacturingPayload, item.motorId)
                  : null)
              : null;
            if (!selection || !item.motorId) {
              return;
            }

            const dedupWithOp = buildDivisionEntryDedupKey({
              flowKey,
              kind: "POST_CURE_MOTOR",
              motorId: item.motorId,
              subType: selection.subType,
              inhibitorType: selection.inhibitorType,
            });
            if (
              getAddedDivisionEntryKeys(formDataRef.current.divisionEntries ?? []).includes(
                dedupWithOp,
              )
            ) {
              return;
            }

            const initialValues = buildInitialPostCureValuesForMotor(
              valuePayload,
              item.motorId,
              selection.subType,
              selection.inhibitorType,
            );

            const entry = buildEntryFromSelection(
              loader.kind,
              {
                division: selection.division,
                subType: selection.subType,
                inhibitorType: selection.inhibitorType,
              },
              undefined,
              item.motorId,
              undefined,
              { flowKey },
            );
            const nextEntries = [...(formDataRef.current.divisionEntries ?? []), entry];
            updateFormData((prev) =>
              appendDivisionEntryToForm(prev, entry, { schemaValues: initialValues }, []),
            );
            navigateToEntry(nextEntries, entry.entryId);
            return;
          }

          if (loader.division === "NDT") {
            const seedPayload = await resolveSeedPayloadForUnit();
            if (requestId !== partialNavLoadRequestIdRef.current) return;

            let initialValues = createInitialNdtValues();
            if (shouldUseQcFormDetailsData(item.status)) {
              const seedRoot =
                seedPayload && typeof seedPayload === "object"
                  ? (seedPayload as Record<string, unknown>)
                  : null;
              const sections = expandDivisionDetailSections(seedRoot);
              const motorSections = sections.filter(
                (section) =>
                  String((section as { motorId?: string }).motorId ?? "").trim() === item.motorId,
              );
              if (motorSections.length) {
                initialValues = hydrateNdtValuesFromSections(motorSections);
              } else if (item.motorId) {
                initialValues = buildInitialNdtValuesForMotor(seedRoot, item.motorId);
              }
            } else if (item.motorId) {
              initialValues = buildInitialNdtValuesForMotor(seedPayload, item.motorId);
            }

            const entry = buildEntryFromSelection(
              loader.kind,
              { division: loader.division, subType: loader.subType },
              undefined,
              item.motorId,
              undefined,
              { flowKey },
            );
            const nextEntries = [...(formDataRef.current.divisionEntries ?? []), entry];
            updateFormData((prev) =>
              appendDivisionEntryToForm(prev, entry, { schemaValues: initialValues }, []),
            );
            navigateToEntry(nextEntries, entry.entryId);
            return;
          }

          if (loader.division === "WEIGHTMENT") {
            let initialValues = createInitialWeighmentValues();
            if (shouldUseQcFormDetailsData(item.status)) {
              const seedPayload = await resolveSeedPayloadForUnit();
              if (requestId !== partialNavLoadRequestIdRef.current) return;
              const seedRoot =
                seedPayload && typeof seedPayload === "object"
                  ? (seedPayload as Record<string, unknown>)
                  : null;
              const sections = expandDivisionDetailSections(seedRoot);
              const motorSections = sections.filter(
                (section) =>
                  String((section as { motorId?: string }).motorId ?? "").trim() === item.motorId,
              );
              if (motorSections.length) {
                initialValues = hydrateWeighmentValuesFromSections(motorSections);
              } else if (item.motorId) {
                initialValues = buildInitialWeighmentValuesForMotor(seedRoot, item.motorId);
              }
            }

            const entry = buildEntryFromSelection(
              loader.kind,
              { division: loader.division, subType: loader.subType },
              undefined,
              item.motorId,
              undefined,
              { flowKey },
            );
            const nextEntries = [...(formDataRef.current.divisionEntries ?? []), entry];
            updateFormData((prev) =>
              appendDivisionEntryToForm(prev, entry, { schemaValues: initialValues }, []),
            );
            navigateToEntry(nextEntries, entry.entryId);
            return;
          }

          if (loader.division === "PROPELLANT_PROPERTIES") {
            let initialValues = createInitialPropellantValues(resolvePropellantFmCount());
            if (shouldUseQcFormDetailsData(item.status)) {
              const seedPayload = await resolveSeedPayloadForUnit();
              if (requestId !== partialNavLoadRequestIdRef.current) return;
              const seedRoot =
                seedPayload && typeof seedPayload === "object"
                  ? (seedPayload as Record<string, unknown>)
                  : null;
              const motorSections = expandDivisionDetailSections(seedRoot).filter(
                (section) =>
                  String((section as { motorId?: string }).motorId ?? "").trim() === item.motorId,
              );
              if (motorSections.length) {
                initialValues = hydratePropellantValuesFromSections(
                  motorSections,
                  resolvePropellantFmCount(),
                );
              }
            }

            const entry = buildEntryFromSelection(
              loader.kind,
              { division: loader.division, subType: loader.subType },
              undefined,
              item.motorId,
              undefined,
              { flowKey },
            );
            const nextEntries = [...(formDataRef.current.divisionEntries ?? []), entry];
            updateFormData((prev) =>
              appendDivisionEntryToForm(prev, entry, { schemaValues: initialValues }, []),
            );
            navigateToEntry(nextEntries, entry.entryId);
            return;
          }

          const result = await fetchQcSchemaDocument(loader.division, loader.subType);
          if (!result || requestId !== partialNavLoadRequestIdRef.current) return;

          // IN_PROGRESS+ motors: prefer saved sections from form details when present.
          let initialValues = createQcInitialValues(result.schema);
          if (shouldUseQcFormDetailsData(item.status)) {
            const seedPayload = await resolveSeedPayloadForUnit();
            if (requestId !== partialNavLoadRequestIdRef.current) return;
            const seedRoot =
              seedPayload && typeof seedPayload === "object"
                ? (seedPayload as Record<string, unknown>)
                : null;
            const sections = expandDivisionDetailSections(seedRoot);
            const motorSections = sections.filter(
              (section) =>
                String((section as { motorId?: string }).motorId ?? "").trim() === item.motorId,
            );
            if (motorSections.length) {
              initialValues = hydrateQcValuesFromSections(result.schema, motorSections);
            }
          }

          const entry = buildEntryFromSelection(
            loader.kind,
            { division: loader.division, subType: loader.subType },
            undefined,
            item.motorId,
            undefined,
            { flowKey },
          );
          const nextEntries = [...(formDataRef.current.divisionEntries ?? []), entry];
          updateFormData((prev) =>
            appendDivisionEntryToForm(prev, entry, { schemaValues: initialValues }, [
              { schema: result.schema, division: result.division, subType: result.subType },
            ]),
          );
          navigateToEntry(nextEntries, entry.entryId);
          return;
        }

        if (item.kind === "PREMIX" && item.premixNo != null) {
          setSelectedPremix(item.premixNo);

          if (flowKey === "MIXING") {
            setSelectedMixingStage("PREMIX");
            // Unit status selects seed: TO_BE_INITIATED → division-details; IN_PROGRESS+ → qc-division/details.
            const seedPayload = await resolveSeedPayloadForUnit();
            if (requestId !== partialNavLoadRequestIdRef.current) return;
            let initialValues = buildSeededPremixDetailsValues(item.premixNo, seedPayload);
            if (shouldUseQcFormDetailsData(item.status)) {
              const formDetails = await ensureQcFormDetailsPayload({ forceRefresh: true });
              if (requestId !== partialNavLoadRequestIdRef.current) return;
              const formData =
                resolveMixingQcFormData(formDetails) ??
                toDivisionAutoPopulateRecord(
                  findQcFormDivisionDetail(formDetails, {
                    flowKey,
                    rawMaterialType: selectedRawMaterialType,
                  }),
                ) ??
                toDivisionAutoPopulateRecord(formDetails);
              const domainEntry = formData
                ? findMixingPremixDomainEntry(formData, item.premixNo)
                : null;
              if (domainEntry?.premixDetails) {
                initialValues = applyMixingDivisionEntryToValues(
                  hydrateMixingDetailsValuesFromDomain(domainEntry.premixDetails, "premix"),
                  {
                    variant: "premix",
                    premixNo: item.premixNo,
                    autoPopulatePayload: seedPayload,
                    batchPayload: activeBatchRef.current,
                    qualityCheckDefinitions: mixingQualityChecksByStageRef.current.PREMIX,
                  },
                  { onlyIfEmpty: true },
                );
              } else {
                const fallbackPayload =
                  formData ?? seedPayload ?? (await resolveSeedPayloadForUnit());
                if (requestId !== partialNavLoadRequestIdRef.current) return;
                const seedRoot =
                  fallbackPayload && typeof fallbackPayload === "object"
                    ? (fallbackPayload as Record<string, unknown>)
                    : null;
                const sections = Array.isArray(seedRoot?.sections)
                  ? (seedRoot!.sections as SchemaSectionSubmission[])
                  : [];
                const premixSections = sections.filter(
                  (section) => Number((section as any)?.premixNo) === item.premixNo,
                );
                if (premixSections.length) {
                  initialValues = applyMixingDivisionEntryToValues(
                    hydrateMixingDetailsValuesFromSections(premixSections, "premix"),
                    {
                      variant: "premix",
                      premixNo: item.premixNo,
                      autoPopulatePayload: seedPayload,
                      batchPayload: activeBatchRef.current,
                      qualityCheckDefinitions: mixingQualityChecksByStageRef.current.PREMIX,
                    },
                    { onlyIfEmpty: true },
                  );
                }
              }
            }

            const entry = buildEntryFromSelection(
              "MIXING_PREMIX",
              { division: "MIXING", subType: "PREMIX" },
              item.premixNo,
              undefined,
              undefined,
              { flowKey, mixingStage: "PREMIX" },
            );
            const nextEntries = [...(formDataRef.current.divisionEntries ?? []), entry];
            updateFormData((prev) =>
              appendDivisionEntryToForm(prev, entry, { schemaValues: initialValues }, []),
            );
            navigateToEntry(nextEntries, entry.entryId);
            return;
          }

          if (flowKey === "RAW_MATERIAL") {
            if (isRawMaterialRevalidationType(selectedRawMaterialType)) {
              return;
            }

            const processingType =
              item.processingType || selectedProcessingType || "SOLID_PROCESSING";
            setSelectedProcessingType(processingType);

            if (shouldUseQcFormDetailsData(item.status)) {
              // IN_PROGRESS+ premix units hydrate from saved /qc-division/details on form load.
              return;
            }

            const seedPayload = await resolveSeedPayloadForUnit();
            if (requestId !== partialNavLoadRequestIdRef.current) return;

            const materialSeeds = getProcessingMaterialsForPremix(seedPayload, item.premixNo);
            if (!materialSeeds.length || !subDepartmentId) {
              showAlert(messages.SCHEMA_FETCH_ERROR, "error");
              return;
            }

            const additions: Array<{
              entry: QcDivisionEntry;
              schema: SchemaDocumentV2;
              values: SchemaFormValues;
            }> = [];

            for (const seed of materialSeeds) {
              const schema = await fetchQcProcessingMaterialSchema({
                subDepartmentId,
                seed,
              });
              if (!schema || requestId !== partialNavLoadRequestIdRef.current) {
                if (!schema) showAlert(messages.SCHEMA_FETCH_ERROR, "error");
                return;
              }
              const entry = buildProcessingMaterialEntry(seed);
              additions.push({
                entry,
                schema,
                values: hydrateProcessingMaterialValuesFromSeed(schema, seed),
              });
            }

            if (!additions.length || requestId !== partialNavLoadRequestIdRef.current) return;

            const nextEntries = [
              ...(formDataRef.current.divisionEntries ?? []),
              ...additions.map((row) => row.entry),
            ];
            updateFormData((prev) => {
              let next = prev;
              additions.forEach(({ entry, schema, values }) => {
                next = appendDivisionEntryToForm(next, entry, { schemaValues: values }, [
                  { schema, cacheKey: entry.schemaCacheKey },
                ]);
              });
              return next;
            });
            navigateToEntry(nextEntries, additions[0].entry.entryId);
          }
          return;
        }

        if (item.kind === "FINAL_MIX") {
          const mixNo = item.finalMixNo ?? item.premixNo;
          if (mixNo == null || flowKey !== "MIXING") return;
          setSelectedMixingStage("FINAL_MIX");
          setSelectedPremix(mixNo);

          let initialValues = createInitialViscosityValues();
          let sharedFinalMixDetails: SchemaFormValues | undefined;
          const seedPayload = await resolveSeedPayloadForUnit();
          if (requestId !== partialNavLoadRequestIdRef.current) return;

          if (shouldUseQcFormDetailsData(item.status)) {
            const formDetails = await ensureQcFormDetailsPayload({ forceRefresh: true });
            if (requestId !== partialNavLoadRequestIdRef.current) return;
            const formData =
              resolveMixingQcFormData(formDetails) ??
              toDivisionAutoPopulateRecord(
                findQcFormDivisionDetail(formDetails, {
                  flowKey,
                  rawMaterialType: selectedRawMaterialType,
                }),
              ) ??
              toDivisionAutoPopulateRecord(formDetails);
            const hydrated = formData ? hydrateMixingDivisionFromFormData(formData) : null;
            const domainEntry = formData ? findMixingPremixDomainEntry(formData, mixNo) : null;
            const finalMixDetails =
              domainEntry?.finalMixDetails &&
              typeof domainEntry.finalMixDetails === "object" &&
              !Array.isArray(domainEntry.finalMixDetails)
                ? (domainEntry.finalMixDetails as Record<string, unknown>)
                : null;

            if (finalMixDetails?.viscosityBuildUp) {
              initialValues = hydrateViscosityValuesFromDomain(finalMixDetails.viscosityBuildUp);
            } else {
              const fromHydrated = hydrated?.finalMixEntries.find((row) => row.premixNo === mixNo);
              if (fromHydrated) initialValues = fromHydrated.values;
            }
            if (finalMixDetails) {
              sharedFinalMixDetails = hydrateMixingDetailsValuesFromDomain(
                finalMixDetails,
                "finalMix",
              );
            } else if (hydrated?.finalMixDetailsValues) {
              sharedFinalMixDetails = hydrated.finalMixDetailsValues;
            } else {
              const fallbackPayload =
                formData ?? seedPayload ?? (await resolveSeedPayloadForUnit());
              if (requestId !== partialNavLoadRequestIdRef.current) return;
              const seedRoot =
                fallbackPayload && typeof fallbackPayload === "object"
                  ? (fallbackPayload as Record<string, unknown>)
                  : null;
              const sections = Array.isArray(seedRoot?.sections)
                ? (seedRoot!.sections as SchemaSectionSubmission[])
                : [];
              const visSections = sections.filter(
                (section) =>
                  Number((section as any)?.premixNo) === mixNo &&
                  String(section.sectionId ?? "") === QC_MIXING_VISCOSITY_SECTION_ID,
              );
              if (visSections.length) {
                initialValues = hydrateViscosityValuesFromSections(visSections);
              }
            }
          } else {
            // TO_BE_INITIATED → always seed this mixNo from manufacturing division-details.
            sharedFinalMixDetails = buildSeededFinalMixDetailsValues(mixNo, seedPayload);
          }

          const entry = buildEntryFromSelection(
            "MIXING_FINAL_MIX",
            { division: "MIXING", subType: "FINAL_MIX" },
            mixNo,
            undefined,
            undefined,
            { flowKey, mixingStage: "FINAL_MIX" },
          );
          const nextEntries = [...(formDataRef.current.divisionEntries ?? []), entry];
          updateFormData((prev) => {
            const entrySchemaValues = mergeFinalMixEntrySchemaValues(
              sharedFinalMixDetails,
              initialValues,
            );
            const next = appendDivisionEntryToForm(
              prev,
              entry,
              { schemaValues: entrySchemaValues },
              [],
            );
            return {
              ...next,
              mixingFinalMixDetailsValues:
                sharedFinalMixDetails ??
                pickFinalMixDetailsSchemaValues(
                  entrySchemaValues,
                  prev.mixingFinalMixDetailsValues,
                ),
            };
          });
          navigateToEntry(nextEntries, entry.entryId);
        }
      } finally {
        if (requestId === partialNavLoadRequestIdRef.current) {
          setPartialItemLoading(false);
        }
      }
    },
    [
      activeBatch?.batchId,
      buildEntryFromSelection,
      divisionCatalog,
      ensureQcFormDetailsPayload,
      fetchManufacturingDivisionDetails,
      fetchQcSchemaDocument,
      messages.SCHEMA_FETCH_ERROR,
      navigateToEntry,
      resolvePropellantFmCount,
      selectedDivision,
      selectedProcessingType,
      selectedRawMaterialType,
      showAlert,
      subDepartmentId,
      updateFormData,
    ],
  );

  const qcPreviousDivisionGate = useMemo(
    () =>
      resolveQcPreviousDivisionApprovedUnits({
        currentDivisionKey: resolveQcGateDivisionKey({
          flowKey: selectedDivision,
          rawMaterialType: selectedRawMaterialType,
          tabKey: activeDivisionTabKey,
        }),
        stageProgress: batchStageArrays.stageProgress,
        currentStage: batchStageArrays.currentStage,
        premixStatuses: formUnitStatuses.premixStatuses,
        motorStatuses: formUnitStatuses.motorStatuses,
        candidateMotorIds: partialNavItems
          .filter((item) => item.kind === "MOTOR")
          .map((item) => item.motorId)
          .filter((id): id is string => Boolean(id)),
        candidatePremixNos: partialNavItems
          .filter((item) => item.kind === "PREMIX" || item.kind === "FINAL_MIX")
          .map((item) => item.premixNo ?? item.finalMixNo)
          .filter((no): no is number => no != null),
      }),
    [
      activeDivisionTabKey,
      batchStageArrays.currentStage,
      batchStageArrays.stageProgress,
      formUnitStatuses.motorStatuses,
      formUnitStatuses.premixStatuses,
      partialNavItems,
      selectedDivision,
      selectedRawMaterialType,
    ],
  );

  const isPartialNavItemEnabled = useCallback(
    (item: QcPartialNavItem | undefined) => {
      if (!item) return false;
      const qcStatus = normalizePartialItemStatus(item.status);
      if (qcStatus !== "TO_BE_INITIATED" && qcStatus !== "REJECTED") return true;
      return isQcPartialItemEnabledByPreviousDivision(item, qcPreviousDivisionGate);
    },
    [qcPreviousDivisionGate],
  );

  const isPartialNavTabEnabled = useCallback(
    (index: number) => isPartialNavItemEnabled(partialNavItems[index]),
    [isPartialNavItemEnabled, partialNavItems],
  );

  const getPartialNavTabDisabledReason = useCallback(
    (index: number) => {
      const item = partialNavItems[index];
      if (!item || isPartialNavItemEnabled(item)) return undefined;
      return getQcPartialNavTabDisabledReason(item, index, partialNavItems, qcPreviousDivisionGate, {
        previousStage:
          item.kind === "PREMIX" || item.kind === "FINAL_MIX"
            ? messages.PREVIOUS_STAGE_PREMIX_TAB_DISABLED
            : messages.PREVIOUS_STAGE_MOTOR_TAB_DISABLED,
      });
    },
    [
      isPartialNavItemEnabled,
      messages.PREVIOUS_STAGE_MOTOR_TAB_DISABLED,
      messages.PREVIOUS_STAGE_PREMIX_TAB_DISABLED,
      partialNavItems,
      qcPreviousDivisionGate,
    ],
  );

  const handlePartialNavIndexChange = useCallback(
    (index: number) => {
      const item = partialNavItems[index];
      if (item && !isPartialNavItemEnabled(item)) {
        return;
      }
      setActivePartialNavIndex(index);
      if (item) {
        const { groupIndex, subIndex } = resolveFormNavForPartialItem(
          formDataRef.current.divisionEntries,
          item,
          { flowKey: selectedDivision },
        );
        setActiveDivisionGroupIndex(groupIndex);
        setActiveDivisionSubIndex(subIndex);
        void loadFormForPartialItem(item);
      }
    },
    [isPartialNavItemEnabled, loadFormForPartialItem, partialNavItems, selectedDivision],
  );

  useEffect(() => {
    if (!hasPartialChildNav(partialNavItems)) return;
    const seedKey = partialNavItems
      .map((item) => `${item.id}:${isPartialNavItemEnabled(item) ? "1" : "0"}`)
      .join("|");
    if (!seedKey || seedKey === partialNavSeedKeyRef.current) return;
    partialNavSeedKeyRef.current = seedKey;

    const isTabEnabled = (index: number) => isPartialNavItemEnabled(partialNavItems[index]);

    const firstEnabledIndex = findFirstEnabledPartialNavIndex(partialNavItems, isTabEnabled);
    setActivePartialNavIndex(firstEnabledIndex);
    const firstItem = partialNavItems[firstEnabledIndex];
    if (firstItem) {
      const { groupIndex, subIndex } = resolveFormNavForPartialItem(
        formDataRef.current.divisionEntries,
        firstItem,
        { flowKey: selectedDivision },
      );
      setActiveDivisionGroupIndex(groupIndex);
      setActiveDivisionSubIndex(subIndex);
    }
    if (firstItem && isTabEnabled(firstEnabledIndex)) {
      void loadFormForPartialItem(firstItem);
    }
  }, [isPartialNavItemEnabled, loadFormForPartialItem, partialNavItems, selectedDivision]);

  const handleDivisionEntryValuesChange = useCallback(
    (entryId: string, values: SchemaFormValues) => {
      setDivisionEntryValues((prev) => ({
        ...prev,
        [entryId]: {
          ...(prev[entryId] ?? { schemaValues: {} }),
          schemaValues: values,
        },
      }));
      markFormDirty();
    },
    [markFormDirty],
  );

  const handleMixingFinalMixDetailsChange = useCallback(
    (values: SchemaFormValues) => {
      setMixingFinalMixDetailsValues(values);
      markFormDirty();
    },
    [markFormDirty],
  );

  const handleDivisionEntryLiquidValuesChange = useCallback(
    (entryId: string, values: SchemaFormValues) => {
      setDivisionEntryValues((prev) => ({
        ...prev,
        [entryId]: {
          ...(prev[entryId] ?? { schemaValues: {} }),
          liquidSchemaValues: values,
        },
      }));
      markFormDirty();
    },
    [markFormDirty],
  );

  const handleRemoveDivisionEntry = useCallback((entryId: string) => {
    updateFormData((prev) => {
      const nextEntries = (prev.divisionEntries ?? []).filter((entry) => entry.entryId !== entryId);
      const nextValues = { ...(prev.divisionEntryValues ?? {}) };
      delete nextValues[entryId];
      const hasFinalMixEntries = getMixingFinalMixEntries(nextEntries).length > 0;
      const nextGroups = buildDivisionNavGroups(nextEntries);

      setActiveDivisionGroupIndex((current) =>
        Math.min(current, Math.max(0, nextGroups.length - 1)),
      );
      setActiveDivisionSubIndex(0);

      return {
        ...prev,
        divisionEntries: nextEntries,
        divisionEntryValues: nextValues,
        mixingFinalMixDetailsValues: hasFinalMixEntries
          ? prev.mixingFinalMixDetailsValues
          : undefined,
        schemaFormLoaded: nextEntries.length > 0,
        qcSchema: nextEntries.length > 0 ? prev.qcSchema : null,
        division: nextEntries.length > 0 ? prev.division : null,
        subType: nextEntries.length > 0 ? prev.subType : null,
      };
    });
  }, []);

  const handleFormValuesChange = useCallback(
    (values: SchemaFormValues) => {
      setFormBase((prev) => ({ ...prev, schemaFormValues: values }));
      markFormDirty();
    },
    [markFormDirty],
  );

  const openFormWithResolvedData = useCallback(
    async (
      batch: QCBatch,
      editMode: boolean,
      options?: { forDetails?: boolean },
    ): Promise<boolean> => {
      // Same as other subdepts: Fill Details (TO_BE_INITIATED) opens empty form;
      // any other status (or edit/view) loads /qc-division/details.
      const shouldFetchDetails =
        Boolean(options?.forDetails) ||
        editMode ||
        !isManufacturingFillDetailsStatus(batch.qcStatus);

      let resolvedData = createDefaultQualityControlFormState();
      let resolvedFormId = batch.formId ?? null;
      let rejectionReason = batch.rejectionReason ?? null;
      let initialDivision = "";
      const flowSelection = resolveBatchFlowSelection(batch.division, batch.subType);
      let initialRawMaterialType = flowSelection.rawMaterialType;
      let initialProcessingType = flowSelection.processingType;
      let fetchedDetailsPayload: Record<string, unknown> | null = null;

      // Load stageProgress so QC can gate units on the last manufacturing/QC subdept
      // where each premix/motor was approved (e.g. Mixing → QC Raw Material Processing).
      setLoadingFormDetails(true);
      try {
        const batchId = String(batch.batchId ?? "").trim();
        if (batchId) {
          try {
            const batchDetails = await batchManagementController.getBatchById(batchId);
            if (batchDetails) batchDetailsPayloadRef.current = batchDetails;
            const fromDetails = getBatchStageProgressArrays(
              (batchDetails as Record<string, unknown> | null) ?? null,
            );
            const fromList = getBatchStageProgressArrays(
              batch as unknown as Record<string, unknown>,
            );
            setBatchStageArrays({
              stageProgress: fromDetails.stageProgress ?? fromList.stageProgress ?? null,
              currentStage: fromDetails.currentStage ?? fromList.currentStage ?? null,
            });
          } catch (error) {
            console.error("Unable to load batch stage progress for QC gating:", error);
            setBatchStageArrays(
              getBatchStageProgressArrays(batch as unknown as Record<string, unknown>),
            );
          }
        } else {
          setBatchStageArrays({ stageProgress: null, currentStage: null });
        }
      } finally {
        if (!shouldFetchDetails) {
          setLoadingFormDetails(false);
        }
      }

      if (shouldFetchDetails) {
        if (!subDepartmentId) {
          showAlert(messages.SUB_DEPARTMENT_MISSING, "error");
          return false;
        }
        if (!resolvedFormId) {
          showAlert(messages.FORM_ID_MISSING, "error");
          return false;
        }

        setLoadingFormDetails(true);
        const detailsResponse = await qcDivisionController.fetchFormDetails({
          formId: resolvedFormId,
          subDepartmentId,
        });
        setLoadingFormDetails(false);

        if (!detailsResponse?.success || !detailsResponse.data) {
          const fallback =
            detailsResponse?.statusCode === 404
              ? messages.DETAILS_NOT_FOUND
              : messages.DETAILS_FETCH_ERROR;
          showAlert(getErrorMessage(detailsResponse, fallback), "error");
          return false;
        }

        if (options?.forDetails) {
          setDetailsData(detailsResponse.data as unknown as Record<string, unknown>);
        }

        fetchedDetailsPayload = detailsResponse.data as unknown as Record<string, unknown>;
        qcFormDetailsPayloadRef.current = fetchedDetailsPayload;

        const rawDivisionDetails = detailsResponse.data?.divisionDetails;
        const hasDivisionDetails =
          Array.isArray(rawDivisionDetails) && rawDivisionDetails.length > 0;

        if (hasDivisionDetails && subDepartmentId) {
          resolvedData = QCDivisionDetailsModel.toFormState(detailsResponse.data!);

          const entries: QcDivisionEntry[] = [];
          const entryValues: Record<string, QcDivisionEntryValues> = {};
          const schemasByKey: Record<string, SchemaDocumentV2> = {};
          const schemaFetchQueue = new Map<
            string,
            { division: QcApiDivision; subType: QcApiSubType; inhibitorType?: QcInhibitorType }
          >();
          const mixingFinalMixDetailSections: SchemaSectionSubmission[] = [];
          let domainMixingFinalMixDetailsValues: SchemaFormValues | undefined;

          const enqueueSchema = (
            division: QcApiDivision,
            subType: QcApiSubType,
            inhibitorType?: QcInhibitorType,
          ) => {
            if (shouldSkipQcSchemaFetch(division, subType)) return "";
            const key = getQcSchemaCacheKey(division, subType, inhibitorType);
            if (!schemaFetchQueue.has(key)) {
              schemaFetchQueue.set(key, { division, subType, inhibitorType });
            }
            return key;
          };

          const getEntryKind = (
            division: QcApiDivision,
            subType: QcApiSubType,
          ): { flowKey: string; kind: QcDivisionEntry["kind"] } => {
            if (
              division === "RAW_MATERIAL_REVALIDATION" ||
              (division === "RAW_MATERIAL" && subType === "RAW_MATERIAL_REVALIDATION")
            ) {
              return { flowKey: "RAW_MATERIAL", kind: "REVALIDATION" };
            }
            if (
              division === "RAW_MATERIAL_PROCESSING" ||
              (division === "RAW_MATERIAL" && subType === "RAW_MATERIAL_PROCESSING")
            ) {
              const kind =
                subType === "SOLID_PROCESSING"
                  ? "SOLID_PREMIX"
                  : subType === "LIQUID_PROCESSING"
                    ? "LIQUID_PREMIX"
                    : "BOTH_PREMIX";
              return { flowKey: "RAW_MATERIAL", kind };
            }
            if (division === "MIXING") {
              return {
                flowKey: "MIXING",
                kind: subType === "FINAL_MIX" ? "MIXING_FINAL_MIX" : "MIXING_PREMIX",
              };
            }
            if (division === "HARDWARE") return { flowKey: "HARDWARE", kind: "HARDWARE_PROCESS" };
            if (division === "CASTING") return { flowKey: "CASTING", kind: "CASTING_MOTOR" };
            if (division === "CURING") return { flowKey: "CURING", kind: "CURING_MOTOR" };
            if (division === "TRIMMING") return { flowKey: "TRIMMING", kind: "TRIMMING_MOTOR" };
            if (division === "DE_CORING") return { flowKey: "DE_CORING", kind: "DE_CORING_MOTOR" };
            if (division === "POST_CURE" || division === "POST_CURE_OPERATION") {
              return { flowKey: "POST_CURE", kind: "POST_CURE_MOTOR" };
            }
            if (division === "NDT") return { flowKey: "NDT", kind: "NDT_MOTOR" };
            if (division === "PROPELLANT_PROPERTIES" || division === "QC") {
              return { flowKey: "QC", kind: "PROPELLANT_MOTOR" };
            }
            if (division === "WEIGHTMENT" || division === "WEIGHMENT") {
              return { flowKey: "WEIGHTMENT", kind: "WEIGHTMENT_MOTOR" };
            }
            if (division === "STATIC_TEST_FACILITY") {
              return { flowKey: "STATIC_TEST_FACILITY", kind: "STF" };
            }
            return { flowKey: division, kind: "SIMPLE" };
          };

          const rawMaterialTypeForLabel = (
            division: QcApiDivision,
            subType: QcApiSubType,
          ): string => {
            if (
              division === "RAW_MATERIAL_REVALIDATION" ||
              (division === "RAW_MATERIAL" && subType === "RAW_MATERIAL_REVALIDATION")
            ) {
              return "RAW_MATERIAL_REVALIDATION";
            }
            if (
              division === "RAW_MATERIAL_PROCESSING" ||
              (division === "RAW_MATERIAL" && subType === "RAW_MATERIAL_PROCESSING")
            ) {
              return "RAW_MATERIAL_PROCESSING";
            }
            return "";
          };

          const processingTypeForLabel = (
            _division: QcApiDivision,
            subType: QcApiSubType,
          ): string => {
            if (subType === "SOLID_PROCESSING" || subType === "LIQUID_PROCESSING") return subType;
            return "";
          };

          for (const detail of rawDivisionDetails) {
            const division = detail.division as QcApiDivision;
            const detailSubType = detail.subType as QcApiSubType;
            const detailData = detail.data ?? detail;
            const processingSeeds =
              division === "RAW_MATERIAL_PROCESSING" ||
              (division === "RAW_MATERIAL" && detailSubType === "RAW_MATERIAL_PROCESSING")
                ? parseProcessingMaterialsFromDivisionDetails({ data: detailData })
                : [];

            if (processingSeeds.length > 0) {
              for (const seed of processingSeeds) {
                try {
                  const schema = await fetchQcProcessingMaterialSchema({
                    subDepartmentId,
                    seed,
                  });
                  if (!schema) continue;
                  const entry = buildProcessingMaterialEntry(seed);
                  entries.push(entry);
                  if (entry.schemaCacheKey) {
                    schemasByKey[entry.schemaCacheKey] = schema;
                  }
                  entryValues[entry.entryId] = {
                    schemaValues: hydrateProcessingMaterialValuesFromSeed(schema, seed),
                  };
                } catch {
                  // individual material schema fetch failure should not abort hydration
                }
              }
              continue;
            }

            const sections: SchemaSectionSubmission[] = expandDivisionDetailSections(
              detailData && typeof detailData === "object"
                ? (detailData as Record<string, unknown>)
                : null,
            );

            const makeEntry = (
              entryKind: QcDivisionEntry["kind"],
              entrySubType: QcApiSubType,
              entrySections: SchemaSectionSubmission[],
              premixNo?: number,
              motorId?: string,
              inhibitorType?: string,
            ) => {
              const entryId = createDivisionEntryId();
              const label = buildDivisionEntryLabel({
                flowKey: getEntryKind(division, entrySubType).flowKey,
                kind: entryKind,
                rawMaterialType: rawMaterialTypeForLabel(division, entrySubType),
                processingType: processingTypeForLabel(division, entrySubType),
                premixNo,
                subType: entrySubType,
                motorId,
              });
              const entry: QcDivisionEntry = {
                entryId,
                flowKey: getEntryKind(division, entrySubType).flowKey,
                kind: entryKind,
                apiDivision: division,
                subType: entrySubType,
                label,
                savedSections: entrySections,
                ...(premixNo != null && { premixNo }),
                ...(motorId && { motorId }),
                ...(inhibitorType && { inhibitorType }),
              };
              entries.push(entry);
              return { entryId, entry, entrySections };
            };

            if (division === "MIXING") {
              const hydratedMixing = hydrateMixingDivisionFromFormData(detailData);
              if (hydratedMixing) {
                hydratedMixing.premixEntries.forEach(({ premixNo, values }) => {
                  const { entryId } = makeEntry("MIXING_PREMIX", "PREMIX", [], premixNo);
                  entryValues[entryId] = { schemaValues: values };
                });
                hydratedMixing.finalMixEntries.forEach(({ premixNo, values }) => {
                  const { entryId } = makeEntry("MIXING_FINAL_MIX", "FINAL_MIX", [], premixNo);
                  entryValues[entryId] = { schemaValues: values };
                });
                if (hydratedMixing.finalMixDetailsValues && !domainMixingFinalMixDetailsValues) {
                  domainMixingFinalMixDetailsValues = hydratedMixing.finalMixDetailsValues;
                }
                continue;
              }

              const grouped = groupMixingDetailSections(sections, detailSubType);

              grouped.premixEntries.forEach(({ premixNo, sections: preSections }) => {
                const { entryId } = makeEntry("MIXING_PREMIX", "PREMIX", preSections, premixNo);
                entryValues[entryId] = {
                  schemaValues: hydrateMixingDetailsValuesFromSections(preSections, "premix"),
                };
              });

              grouped.finalMixEntries.forEach(({ premixNo, sections: visSections }) => {
                const { entryId } = makeEntry(
                  "MIXING_FINAL_MIX",
                  "FINAL_MIX",
                  visSections,
                  premixNo,
                );
                entryValues[entryId] = {
                  schemaValues: hydrateViscosityValuesFromSections(visSections),
                };
              });

              if (grouped.finalMixDetailSections.length) {
                mixingFinalMixDetailSections.push(...grouped.finalMixDetailSections);
              }
              continue;
            }

            const sectionsByPremix = new Map<string, SchemaSectionSubmission[]>();
            const sectionsByMotor = new Map<string, SchemaSectionSubmission[]>();
            const simpleSections: SchemaSectionSubmission[] = [];

            for (const section of sections) {
              if (section.premixNo != null) {
                const sectionSubType = (section.subType ?? detailSubType) as QcApiSubType;
                enqueueSchema(division, sectionSubType);
                const groupKey = `${section.premixNo}:${sectionSubType}`;
                const list = sectionsByPremix.get(groupKey) ?? [];
                list.push(section);
                sectionsByPremix.set(groupKey, list);
              } else if ((section as { motorId?: string }).motorId) {
                let sectionSubType = (section.subType ?? detailSubType) as QcApiSubType;
                // Shared hardware uploads belong on the Abrading (anchor) entry.
                if (
                  division === "HARDWARE" &&
                  String(section.sectionId ?? "").trim() === QC_HARDWARE_ATTACHMENTS_SECTION_ID
                ) {
                  sectionSubType = "ABRADING";
                }
                const sectionInhibitorType = resolveQcSectionInhibitorType(
                  division,
                  sectionSubType,
                  (section as { inhibitorType?: string }).inhibitorType,
                );
                if (division !== "HARDWARE") {
                  enqueueSchema(division, sectionSubType, sectionInhibitorType);
                }
                const motorId = String((section as { motorId?: string }).motorId);
                const groupKey = buildMotorDivisionGroupKey(motorId, sectionSubType, {
                  division,
                  inhibitorType: sectionInhibitorType,
                });
                const list = sectionsByMotor.get(groupKey) ?? [];
                list.push(section);
                sectionsByMotor.set(groupKey, list);
              } else {
                if (division !== "RAW_MATERIAL_REVALIDATION") {
                  enqueueSchema(division, detailSubType);
                }
                simpleSections.push(section);
              }
            }

            if (sectionsByPremix.size > 0) {
              for (const [groupKey, preSections] of sectionsByPremix) {
                const colonIdx = groupKey.lastIndexOf(":");
                const premixNo = parseInt(groupKey.slice(0, colonIdx), 10);
                const sectionSubType = groupKey.slice(colonIdx + 1) as QcApiSubType;
                const { kind } = getEntryKind(division, sectionSubType);
                const { entryId } = makeEntry(kind, sectionSubType, preSections, premixNo);
                entryValues[entryId] = { schemaValues: {} };
              }
            } else if (sectionsByMotor.size > 0) {
              for (const [groupKey, motSections] of sectionsByMotor) {
                const parsed = parseMotorDivisionGroupKey(groupKey);
                const { kind } = getEntryKind(division, parsed.subType);
                const { entryId } = makeEntry(
                  kind,
                  parsed.subType,
                  motSections,
                  undefined,
                  parsed.motorId,
                  parsed.inhibitorType,
                );
                entryValues[entryId] = { schemaValues: {} };
              }
            } else if (simpleSections.length > 0) {
              const { kind } = getEntryKind(division, detailSubType);
              const { entryId } = makeEntry(kind, detailSubType, simpleSections);
              entryValues[entryId] = {
                schemaValues:
                  kind === "REVALIDATION"
                    ? hydrateRevalidationValuesFromSections(simpleSections)
                    : {},
              };
            }
          }

          const schemaRequests = Array.from(schemaFetchQueue.values());
          setSchemaLoading(true);
          setSchemaError(null);
          try {
            await mapWithConcurrency(schemaRequests, 4, async (request) => {
              const cacheKey = getQcSchemaCacheKey(
                request.division,
                request.subType,
                request.inhibitorType,
              );
              try {
                const result = await fetchQcSchemaDocumentCore(
                  request.division,
                  request.subType,
                  request.inhibitorType,
                  { silent: true },
                );
                if (result) {
                  schemasByKey[cacheKey] = result.schema;
                }
              } catch {
                // individual schema fetch failure should not abort the entire flow
              }
            });
          } finally {
            setSchemaLoading(false);
          }

          for (const entry of entries) {
            if (entry.kind === "REVALIDATION") {
              const sectionsToHydrate =
                entry.savedSections ??
                (resolvedData.savedSections ?? []).filter(
                  (s) => s.sectionId === "RAW_MATERIAL_DETAILS",
                );
              if (sectionsToHydrate.length > 0) {
                entryValues[entry.entryId] = {
                  schemaValues: hydrateRevalidationValuesFromSections(sectionsToHydrate),
                };
              } else if (
                !entryValues[entry.entryId]?.schemaValues ||
                Object.keys(entryValues[entry.entryId].schemaValues).length === 0
              ) {
                entryValues[entry.entryId] = {
                  schemaValues: createInitialRevalidationSchemaValues(),
                };
              }
              continue;
            }

            if (entry.kind === "MIXING_PREMIX" || entry.kind === "MIXING_FINAL_MIX") {
              const sectionsToHydrate =
                entry.savedSections ??
                (resolvedData.savedSections ?? []).filter((s) => {
                  if (
                    entry.kind === "MIXING_PREMIX" &&
                    s.sectionId !== QC_MIXING_PREMIX_SECTION_ID
                  ) {
                    return false;
                  }
                  if (
                    entry.kind === "MIXING_FINAL_MIX" &&
                    s.sectionId !== QC_MIXING_VISCOSITY_SECTION_ID
                  ) {
                    return false;
                  }
                  if (entry.premixNo != null && s.premixNo !== entry.premixNo) return false;
                  return true;
                });
              if (sectionsToHydrate.length > 0) {
                entryValues[entry.entryId] = {
                  schemaValues:
                    entry.kind === "MIXING_FINAL_MIX"
                      ? hydrateViscosityValuesFromSections(sectionsToHydrate)
                      : hydrateMixingDetailsValuesFromSections(sectionsToHydrate, "premix"),
                };
              } else if (
                !entryValues[entry.entryId]?.schemaValues ||
                Object.keys(entryValues[entry.entryId].schemaValues).length === 0
              ) {
                entryValues[entry.entryId] = {
                  schemaValues:
                    entry.kind === "MIXING_FINAL_MIX"
                      ? createInitialViscosityValues()
                      : buildSeededPremixDetailsValues(entry.premixNo ?? 1),
                };
              }
              continue;
            }

            if (entry.kind === "HARDWARE_PROCESS") {
              const subType = String(entry.subType ?? "");
              const sectionsToHydrate =
                entry.savedSections ??
                (resolvedData.savedSections ?? []).filter((s) => {
                  const expectedSectionId = getHardwareSectionIdForSubType(subType);
                  if (expectedSectionId && s.sectionId !== expectedSectionId) return false;
                  if (entry.motorId != null) {
                    const sectionMotorId = String((s as { motorId?: string }).motorId ?? "").trim();
                    if (sectionMotorId && sectionMotorId !== entry.motorId) return false;
                  }
                  const sectionSubType = String((s as { subType?: string }).subType ?? "")
                    .trim()
                    .toUpperCase();
                  return !sectionSubType || sectionSubType === subType.toUpperCase();
                });
              if (sectionsToHydrate.length > 0 && isQcHardwareProcessSubType(subType)) {
                let schemaValues = hydrateHardwareProcessValuesFromSections(
                  sectionsToHydrate,
                  subType,
                );
                // Abrading is the upload anchor — merge HARDWARE_ATTACHMENTS / per-section uploads.
                if (subType === "ABRADING") {
                  const motorSections =
                    entry.savedSections ??
                    (resolvedData.savedSections ?? []).filter((s) => {
                      const sectionMotorId = String(
                        (s as { motorId?: string }).motorId ?? "",
                      ).trim();
                      return !sectionMotorId || sectionMotorId === entry.motorId;
                    });
                  const uploads = hydrateHardwareUploadValuesFromSections([
                    ...sectionsToHydrate,
                    ...motorSections,
                  ]);
                  schemaValues = mergeHardwareUploadValuesIntoEntryValues(schemaValues, uploads);
                }
                entryValues[entry.entryId] = { schemaValues };
              } else if (
                isQcHardwareProcessSubType(subType) &&
                (!entryValues[entry.entryId]?.schemaValues ||
                  Object.keys(entryValues[entry.entryId].schemaValues).length === 0)
              ) {
                const motorStatus =
                  entry.motorId != null
                    ? resolveMotorQcStatusFromFormDetails(
                        fetchedDetailsPayload,
                        entry.motorId,
                        "HARDWARE",
                      )
                    : null;
                // Only TO_BE_INITIATED motors seed from manufacturing /division-details.
                const manufacturingPayload =
                  motorStatus != null && isQcStatusAwaitingInitiation(motorStatus)
                    ? resolveManufacturingDivisionDetailsPayload(
                        divisionAutoPopulateDataRef.current,
                      )
                    : null;
                entryValues[entry.entryId] = {
                  schemaValues:
                    manufacturingPayload && entry.motorId
                      ? applyHardwareDivisionDetailsSeed(
                          createInitialHardwareProcessValues(subType),
                          manufacturingPayload,
                          entry.motorId,
                          subType,
                          { onlyIfEmpty: false },
                        )
                      : createInitialHardwareProcessValues(subType),
                };
              }
              continue;
            }

            if (entry.kind === "CASTING_MOTOR") {
              const sectionsToHydrate =
                entry.savedSections ??
                (resolvedData.savedSections ?? []).filter((s) => {
                  if (entry.motorId != null) {
                    const sectionMotorId = String((s as { motorId?: string }).motorId ?? "").trim();
                    if (sectionMotorId && sectionMotorId !== entry.motorId) return false;
                  }
                  return true;
                });
              if (sectionsToHydrate.length > 0) {
                entryValues[entry.entryId] = {
                  schemaValues: hydrateCastingValuesFromSections(sectionsToHydrate),
                };
              } else if (
                !entryValues[entry.entryId]?.schemaValues ||
                Object.keys(entryValues[entry.entryId].schemaValues).length === 0
              ) {
                const motorStatus =
                  entry.motorId != null
                    ? resolveMotorQcStatusFromFormDetails(
                        fetchedDetailsPayload,
                        entry.motorId,
                        "CASTING",
                      )
                    : null;
                const manufacturingPayload =
                  motorStatus != null && isQcStatusAwaitingInitiation(motorStatus)
                    ? resolveManufacturingDivisionDetailsPayload(
                        divisionAutoPopulateDataRef.current,
                      )
                    : null;
                const batchPayload =
                  (divisionAutoPopulateDataRef.current as { __batchDetails?: unknown } | null)
                    ?.__batchDetails ?? null;
                entryValues[entry.entryId] = {
                  schemaValues:
                    manufacturingPayload && entry.motorId
                      ? applyCastingDivisionDetailsSeed(
                          createInitialCastingValues(),
                          manufacturingPayload,
                          entry.motorId,
                          { onlyIfEmpty: false, batchPayload },
                        )
                      : createInitialCastingValues(),
                };
              }
              continue;
            }

            if (entry.kind === "CURING_MOTOR") {
              const sectionsToHydrate =
                entry.savedSections ??
                (resolvedData.savedSections ?? []).filter((s) => {
                  if (entry.motorId != null) {
                    const sectionMotorId = String((s as { motorId?: string }).motorId ?? "").trim();
                    if (sectionMotorId && sectionMotorId !== entry.motorId) return false;
                  }
                  return true;
                });
              if (sectionsToHydrate.length > 0) {
                entryValues[entry.entryId] = {
                  schemaValues: hydrateCuringValuesFromSections(sectionsToHydrate),
                };
              } else if (
                !entryValues[entry.entryId]?.schemaValues ||
                Object.keys(entryValues[entry.entryId].schemaValues).length === 0
              ) {
                const motorStatus =
                  entry.motorId != null
                    ? resolveMotorQcStatusFromFormDetails(
                        fetchedDetailsPayload,
                        entry.motorId,
                        "CURING",
                      )
                    : null;
                const manufacturingPayload =
                  motorStatus != null && isQcStatusAwaitingInitiation(motorStatus)
                    ? resolveManufacturingDivisionDetailsPayload(
                        divisionAutoPopulateDataRef.current,
                      )
                    : null;
                const curingSubType =
                  normalizeQcCuringType(
                    entry.subType ||
                      (entry.motorId && manufacturingPayload
                        ? resolveCuringSubTypeFromDivisionDetails(
                            manufacturingPayload,
                            entry.motorId,
                          )
                        : null),
                  ) || "NORMAL";
                entryValues[entry.entryId] = {
                  schemaValues:
                    manufacturingPayload && entry.motorId
                      ? buildInitialCuringValuesForMotor(
                          manufacturingPayload,
                          entry.motorId,
                          curingSubType,
                        )
                      : createInitialCuringValues(curingSubType),
                };
              }
              continue;
            }

            if (entry.kind === "DE_CORING_MOTOR") {
              const sectionsToHydrate =
                entry.savedSections ??
                (resolvedData.savedSections ?? []).filter((s) => {
                  if (entry.motorId != null) {
                    const sectionMotorId = String((s as { motorId?: string }).motorId ?? "").trim();
                    if (sectionMotorId && sectionMotorId !== entry.motorId) return false;
                  }
                  return true;
                });
              const motorStatus =
                entry.motorId != null
                  ? resolveMotorQcStatusFromFormDetails(
                      fetchedDetailsPayload,
                      entry.motorId,
                      "DE_CORING",
                    )
                  : null;
              const awaitingInitiation =
                motorStatus == null || isQcStatusAwaitingInitiation(motorStatus);

              if (sectionsToHydrate.length > 0) {
                let schemaValues = hydrateDeCoringValuesFromSections(sectionsToHydrate);
                if (awaitingInitiation) {
                  const manufacturingPayload = resolveManufacturingDivisionDetailsPayload(
                    divisionAutoPopulateDataRef.current,
                  );
                  if (manufacturingPayload && entry.motorId) {
                    schemaValues = applyDeCoringDivisionDetailsSeed(
                      schemaValues,
                      manufacturingPayload,
                      entry.motorId,
                      { onlyIfEmpty: true },
                    );
                  }
                }
                entryValues[entry.entryId] = { schemaValues };
              } else if (
                !entryValues[entry.entryId]?.schemaValues ||
                Object.keys(entryValues[entry.entryId].schemaValues).length === 0
              ) {
                const manufacturingPayload = awaitingInitiation
                  ? resolveManufacturingDivisionDetailsPayload(
                      divisionAutoPopulateDataRef.current,
                    )
                  : null;
                entryValues[entry.entryId] = {
                  schemaValues:
                    manufacturingPayload && entry.motorId
                      ? buildInitialDeCoringValuesForMotor(manufacturingPayload, entry.motorId)
                      : createInitialDeCoringValues(),
                };
              }
              continue;
            }

            if (entry.kind === "TRIMMING_MOTOR") {
              const sectionsToHydrate =
                entry.savedSections ??
                (resolvedData.savedSections ?? []).filter((s) => {
                  if (entry.motorId != null) {
                    const sectionMotorId = String((s as { motorId?: string }).motorId ?? "").trim();
                    if (sectionMotorId && sectionMotorId !== entry.motorId) return false;
                  }
                  return true;
                });
              const motorStatus =
                entry.motorId != null
                  ? resolveMotorQcStatusFromFormDetails(
                      fetchedDetailsPayload,
                      entry.motorId,
                      "TRIMMING",
                    )
                  : null;
              const awaitingInitiation =
                motorStatus == null || isQcStatusAwaitingInitiation(motorStatus);

              // IN_PROGRESS+ → map from /qc-division/details data.trimmingDetails[]
              if (!awaitingInitiation && entry.motorId) {
                const qcDetail = toDivisionAutoPopulateRecord(
                  findQcFormDivisionDetail(fetchedDetailsPayload, { flowKey: "TRIMMING" }),
                );
                if (qcDetail) {
                  entryValues[entry.entryId] = {
                    schemaValues: buildInitialTrimmingValuesForMotor(qcDetail, entry.motorId),
                  };
                  continue;
                }
              }

              if (sectionsToHydrate.length > 0) {
                let schemaValues = hydrateTrimmingValuesFromSections(sectionsToHydrate, {
                  motorReceivedAt: entry.motorReceivedDate ?? "",
                });
                if (awaitingInitiation) {
                  const manufacturingPayload = resolveManufacturingDivisionDetailsPayload(
                    divisionAutoPopulateDataRef.current,
                  );
                  if (manufacturingPayload && entry.motorId) {
                    schemaValues = applyTrimmingDivisionDetailsSeed(
                      schemaValues,
                      manufacturingPayload,
                      entry.motorId,
                      { onlyIfEmpty: true },
                    );
                  }
                }
                entryValues[entry.entryId] = { schemaValues };
              } else if (
                !entryValues[entry.entryId]?.schemaValues ||
                Object.keys(entryValues[entry.entryId].schemaValues).length === 0
              ) {
                const manufacturingPayload = awaitingInitiation
                  ? resolveManufacturingDivisionDetailsPayload(
                      divisionAutoPopulateDataRef.current,
                    )
                  : null;
                entryValues[entry.entryId] = {
                  schemaValues:
                    manufacturingPayload && entry.motorId
                      ? buildInitialTrimmingValuesForMotor(manufacturingPayload, entry.motorId)
                      : createInitialTrimmingValues(entry.motorReceivedDate ?? ""),
                };
              }
              continue;
            }

            if (entry.kind === "POST_CURE_MOTOR") {
              const motorStatus =
                entry.motorId != null
                  ? resolveMotorQcStatusFromFormDetails(
                      fetchedDetailsPayload,
                      entry.motorId,
                      "POST_CURE",
                    )
                  : null;
              const awaitingInitiation =
                motorStatus == null || isQcStatusAwaitingInitiation(motorStatus);

              // IN_PROGRESS+ → map from /qc-division/details data.postCureMotorDetails[]
              if (!awaitingInitiation && entry.motorId && fetchedDetailsPayload) {
                const nestedValues = buildInitialPostCureValuesForMotor(
                  fetchedDetailsPayload,
                  entry.motorId,
                  entry.subType,
                  entry.inhibitorType,
                );
                if (postCureFormValuesHaveUserData(nestedValues)) {
                  entryValues[entry.entryId] = { schemaValues: nestedValues };
                  continue;
                }

                const qcDetail = toDivisionAutoPopulateRecord(
                  findQcFormDivisionDetail(fetchedDetailsPayload, { flowKey: "POST_CURE" }),
                );
                if (qcDetail) {
                  const fromDetail = buildInitialPostCureValuesForMotor(
                    qcDetail,
                    entry.motorId,
                    entry.subType,
                    entry.inhibitorType,
                  );
                  if (postCureFormValuesHaveUserData(fromDetail)) {
                    entryValues[entry.entryId] = { schemaValues: fromDetail };
                    continue;
                  }
                }
              }

              const sectionsToHydrate =
                entry.savedSections ??
                (resolvedData.savedSections ?? []).filter((s) => {
                  if (entry.motorId != null) {
                    const sectionMotorId = String((s as { motorId?: string }).motorId ?? "").trim();
                    if (sectionMotorId && sectionMotorId !== entry.motorId) return false;
                  }
                  if (
                    entry.subType &&
                    (s as { subType?: string }).subType &&
                    (s as { subType?: string }).subType !== entry.subType
                  ) {
                    return false;
                  }
                  if (
                    entry.inhibitorType &&
                    (s as { inhibitorType?: string }).inhibitorType &&
                    (s as { inhibitorType?: string }).inhibitorType !== entry.inhibitorType
                  ) {
                    return false;
                  }
                  return true;
                });

              if (sectionsToHydrate.length > 0) {
                const fromSections = hydratePostCureValuesFromSections(
                  sectionsToHydrate,
                  entry.subType,
                  entry.inhibitorType,
                );
                if (postCureFormValuesHaveUserData(fromSections) || !awaitingInitiation) {
                  entryValues[entry.entryId] = { schemaValues: fromSections };
                  continue;
                }
              }

              if (
                !entryValues[entry.entryId]?.schemaValues ||
                Object.keys(entryValues[entry.entryId].schemaValues).length === 0
              ) {
                const manufacturingPayload = awaitingInitiation
                  ? resolveManufacturingDivisionDetailsPayload(
                      divisionAutoPopulateDataRef.current,
                    )
                  : null;
                entryValues[entry.entryId] = {
                  schemaValues:
                    manufacturingPayload && entry.motorId
                      ? buildInitialPostCureValuesForMotor(
                          manufacturingPayload,
                          entry.motorId,
                          entry.subType,
                          entry.inhibitorType,
                        )
                      : createInitialPostCureValues(entry.subType, entry.inhibitorType),
                };
              }
              continue;
            }

            if (entry.kind === "NDT_MOTOR") {
              const motorStatus =
                entry.motorId != null
                  ? resolveMotorQcStatusFromFormDetails(
                      fetchedDetailsPayload,
                      entry.motorId,
                      "NDT",
                    )
                  : null;
              const awaitingInitiation =
                motorStatus == null || isQcStatusAwaitingInitiation(motorStatus);

              // IN_PROGRESS+ → /qc-division/details
              if (!awaitingInitiation && entry.motorId) {
                const qcDetail = toDivisionAutoPopulateRecord(
                  findQcFormDivisionDetail(fetchedDetailsPayload, { flowKey: "NDT" }),
                );
                if (qcDetail) {
                  entryValues[entry.entryId] = {
                    schemaValues: buildInitialNdtValuesForMotor(qcDetail, entry.motorId),
                  };
                  continue;
                }
              }

              // TO_BE_INITIATED → manufacturing /qc-division/division-details
              if (awaitingInitiation && entry.motorId) {
                const manufacturingPayload = resolveManufacturingDivisionDetailsPayload(
                  divisionAutoPopulateDataRef.current,
                );
                if (manufacturingPayload) {
                  const fromManufacturing = buildInitialNdtValuesForMotor(
                    manufacturingPayload,
                    entry.motorId,
                  );
                  if (ndtFormValuesHaveUserData(fromManufacturing)) {
                    entryValues[entry.entryId] = { schemaValues: fromManufacturing };
                    continue;
                  }
                }
              }

              const sectionsToHydrate =
                entry.savedSections ??
                (resolvedData.savedSections ?? []).filter((s) => {
                  if (entry.motorId != null) {
                    const sectionMotorId = String((s as { motorId?: string }).motorId ?? "").trim();
                    if (sectionMotorId && sectionMotorId !== entry.motorId) return false;
                  }
                  return true;
                });

              if (sectionsToHydrate.length > 0) {
                entryValues[entry.entryId] = {
                  schemaValues: hydrateNdtValuesFromSections(sectionsToHydrate),
                };
              } else if (
                !entryValues[entry.entryId]?.schemaValues ||
                Object.keys(entryValues[entry.entryId].schemaValues).length === 0
              ) {
                entryValues[entry.entryId] = {
                  schemaValues: createInitialNdtValues(),
                };
              }
              continue;
            }

            if (entry.kind === "WEIGHTMENT_MOTOR") {
              const motorStatus =
                entry.motorId != null
                  ? resolveMotorQcStatusFromFormDetails(
                      fetchedDetailsPayload,
                      entry.motorId,
                      "WEIGHTMENT",
                    )
                  : null;
              const awaitingInitiation =
                motorStatus == null || isQcStatusAwaitingInitiation(motorStatus);

              if (!awaitingInitiation && entry.motorId) {
                const qcDetail = toDivisionAutoPopulateRecord(
                  findQcFormDivisionDetail(fetchedDetailsPayload, { flowKey: "WEIGHTMENT" }),
                );
                if (qcDetail) {
                  entryValues[entry.entryId] = {
                    schemaValues: buildInitialWeighmentValuesForMotor(qcDetail, entry.motorId),
                  };
                  continue;
                }
              }

              const sectionsToHydrate =
                entry.savedSections ??
                (resolvedData.savedSections ?? []).filter((s) => {
                  if (entry.motorId != null) {
                    const sectionMotorId = String((s as { motorId?: string }).motorId ?? "").trim();
                    if (sectionMotorId && sectionMotorId !== entry.motorId) return false;
                  }
                  return true;
                });

              if (sectionsToHydrate.length > 0) {
                entryValues[entry.entryId] = {
                  schemaValues: hydrateWeighmentValuesFromSections(sectionsToHydrate),
                };
              } else if (
                !entryValues[entry.entryId]?.schemaValues ||
                Object.keys(entryValues[entry.entryId].schemaValues).length === 0
              ) {
                entryValues[entry.entryId] = {
                  schemaValues: createInitialWeighmentValues(),
                };
              }
              continue;
            }

            if (entry.kind === "PROPELLANT_MOTOR" || entry.kind === "PROPELLANT_PROCESS") {
              const motorStatus =
                entry.motorId != null
                  ? resolveMotorQcStatusFromFormDetails(
                      fetchedDetailsPayload,
                      entry.motorId,
                      "QC",
                    )
                  : null;
              const awaitingInitiation =
                motorStatus == null || isQcStatusAwaitingInitiation(motorStatus);

              if (!awaitingInitiation && entry.motorId) {
                const qcDetail = toDivisionAutoPopulateRecord(
                  findQcFormDivisionDetail(fetchedDetailsPayload, { flowKey: "QC" }),
                );
                if (qcDetail) {
                  const motorSections = expandDivisionDetailSections(qcDetail).filter(
                    (section) =>
                      String((section as { motorId?: string }).motorId ?? "").trim() ===
                      entry.motorId,
                  );
                  if (motorSections.length) {
                    entryValues[entry.entryId] = {
                      schemaValues: hydratePropellantValuesFromSections(
                      motorSections,
                      resolvePropellantFmCount(),
                    ),
                    };
                    continue;
                  }
                }
              }

              const sectionsToHydrate =
                entry.savedSections ??
                (resolvedData.savedSections ?? []).filter((s) => {
                  if (entry.motorId != null) {
                    const sectionMotorId = String((s as { motorId?: string }).motorId ?? "").trim();
                    if (sectionMotorId && sectionMotorId !== entry.motorId) return false;
                  }
                  return true;
                });

              if (sectionsToHydrate.length > 0) {
                entryValues[entry.entryId] = {
                  schemaValues: hydratePropellantValuesFromSections(
                    sectionsToHydrate,
                    resolvePropellantFmCount(),
                  ),
                };
              } else if (
                !entryValues[entry.entryId]?.schemaValues ||
                Object.keys(entryValues[entry.entryId].schemaValues).length === 0
              ) {
                entryValues[entry.entryId] = {
                  schemaValues: createInitialPropellantValues(resolvePropellantFmCount()),
                };
              }
              continue;
            }

            const cacheKey = getQcSchemaCacheKey(
              entry.apiDivision,
              entry.subType,
              entry.inhibitorType,
            );
            const schema = schemasByKey[cacheKey];
            if (!schema) continue;

            const sectionsToHydrate =
              entry.savedSections ??
              (resolvedData.savedSections ?? []).filter((s) => {
                if (entry.kind === "REVALIDATION" && s.sectionId !== "RAW_MATERIAL_DETAILS")
                  return false;
                if (entry.premixNo != null) {
                  if (s.premixNo !== entry.premixNo) return false;
                  if (entry.subType && (s as any).subType && (s as any).subType !== entry.subType)
                    return false;
                  return true;
                }
                if (entry.motorId != null) {
                  if ((s as { motorId?: string }).motorId !== entry.motorId) return false;
                  if (
                    entry.subType &&
                    (s as { subType?: string }).subType &&
                    (s as { subType?: string }).subType !== entry.subType
                  ) {
                    return false;
                  }
                  if (
                    entry.inhibitorType &&
                    (s as { inhibitorType?: string }).inhibitorType &&
                    (s as { inhibitorType?: string }).inhibitorType !== entry.inhibitorType
                  ) {
                    return false;
                  }
                  return true;
                }
                return s.premixNo == null && !(s as any).motorId;
              });

            if (sectionsToHydrate.length > 0) {
              entryValues[entry.entryId] = {
                schemaValues: hydrateQcValuesFromSections(schema, sectionsToHydrate),
              };
            }
          }

          const mixingFinalMixDetailsValues =
            domainMixingFinalMixDetailsValues ??
            (mixingFinalMixDetailSections.length > 0
              ? hydrateMixingDetailsValuesFromSections(mixingFinalMixDetailSections, "finalMix")
              : undefined);

          const entryValuesWithHardwareUploads = applyHardwareSharedUploadsToEntryValues(
            entries,
            entryValues,
            resolvedData.savedSections,
          );

          resolvedData = {
            ...resolvedData,
            divisionEntries: entries,
            divisionEntryValues: entryValuesWithHardwareUploads,
            schemasByKey,
            ...(mixingFinalMixDetailsValues && { mixingFinalMixDetailsValues }),
          };
        } else {
          const resolvedFlow = resolveBatchFlowSelection(
            resolvedData.division,
            resolvedData.subType,
          );
          initialRawMaterialType = resolvedFlow.rawMaterialType;
          initialProcessingType = resolvedFlow.processingType;

          if (resolvedData.schemaFormLoaded && resolvedData.division) {
            const schemasToLoad: Array<{ division: QcApiDivision; subType: QcApiSubType }> = [];

            if (
              isRawMaterialRevalidationType(initialRawMaterialType) ||
              isRawMaterialProcessingType(initialRawMaterialType)
            ) {
              // Custom table / processing-material UIs — no QC schema document.
            } else if (initialProcessingType === "SOLID_PROCESSING") {
              schemasToLoad.push({
                division: "RAW_MATERIAL_PROCESSING",
                subType: "SOLID_PROCESSING",
              });
            } else if (initialProcessingType === "LIQUID_PROCESSING") {
              schemasToLoad.push({
                division: "RAW_MATERIAL_PROCESSING",
                subType: "LIQUID_PROCESSING",
              });
            } else if (isBothProcessingType(initialProcessingType)) {
              schemasToLoad.push(
                { division: "RAW_MATERIAL_PROCESSING", subType: "SOLID_PROCESSING" },
                { division: "RAW_MATERIAL_PROCESSING", subType: "LIQUID_PROCESSING" },
              );
            }

            for (const schemaSelection of schemasToLoad) {
              if (shouldSkipQcSchemaFetch(schemaSelection.division, schemaSelection.subType)) {
                continue;
              }
              const cacheKey = getQcSchemaCacheKey(
                schemaSelection.division,
                schemaSelection.subType,
              );
              if (!resolvedData.schemasByKey?.[cacheKey]) {
                const result = await fetchQcSchemaDocument(
                  schemaSelection.division,
                  schemaSelection.subType,
                );
                if (result) {
                  updateFormData((prev) =>
                    hydrateQualityControlFormState(
                      prev,
                      result.schema,
                      result.division,
                      result.subType,
                    ),
                  );
                }
              }
            }
          }
        }

        resolvedFormId = detailsResponse.data.formId || resolvedFormId;
        rejectionReason = detailsResponse.data.workflowInsights?.rejectionReason ?? rejectionReason;
      }

      setActiveBatch({
        ...batch,
        formId: resolvedFormId,
        division: resolvedData.division ?? null,
        subType: resolvedData.subType,
        rejectionReason,
      });
      setSelectedDivision(initialDivision);
      setSelectedRawMaterialType(initialRawMaterialType);
      setSelectedProcessingType(initialProcessingType);
      setSelectedPremixSlot(
        initialProcessingType === "LIQUID_PROCESSING" ? "LIQUID_PROCESSING" : "SOLID_PROCESSING",
      );
      applyFullFormState(resolvedData);
      setIsFormDirty(false);
      setIsEditMode(editMode);

      const detailsPayload = fetchedDetailsPayload as any;
      if (detailsPayload && Array.isArray(detailsPayload.divisionStatuses)) {
        const nextMap: Record<string, QcPartialItemStatus> = {};
        detailsPayload.divisionStatuses.forEach((entry: any) => {
          const key = String(entry?.division ?? "").trim();
          if (!key) return;
          const status = normalizePartialItemStatus(entry?.status);
          nextMap[key] = status;
          // Alias contract shapes used by nav tabs / divisionDetails.
          if (key === "RAW_MATERIAL_PROCESSING") {
            nextMap.RAW_MATERIAL_PROCESSING = status;
          }
          if (key === "RAW_MATERIAL_REVALIDATION") {
            nextMap.RAW_MATERIAL_REVALIDATION = status;
          }
          if (key === "PROPELLANT_PROPERTIES") {
            nextMap.QC = status;
          }
          if (key === "POST_CURE" || key === "POST_CURE_OPERATION") {
            nextMap.POST_CURE = status;
            nextMap.POST_CURE_OPERATION = status;
          }
        });
        // Also absorb status from divisionDetails when divisionStatuses uses a different key.
        if (Array.isArray(detailsPayload.divisionDetails)) {
          detailsPayload.divisionDetails.forEach((detail: any) => {
            const division = String(detail?.division ?? "").trim();
            const subType = String(detail?.subType ?? "").trim();
            const status = normalizePartialItemStatus(
              detail?.status ?? detail?.divisionSubmissionStatus,
            );
            if (!status || status === "TO_BE_INITIATED") return;
            if (division === "RAW_MATERIAL" && subType === "RAW_MATERIAL_PROCESSING") {
              nextMap.RAW_MATERIAL_PROCESSING = status;
            }
            if (division === "RAW_MATERIAL" && subType === "RAW_MATERIAL_REVALIDATION") {
              nextMap.RAW_MATERIAL_REVALIDATION = status;
            }
            if (division) nextMap[division] = nextMap[division] ?? status;
            if (subType) nextMap[subType] = nextMap[subType] ?? status;
          });
        }
        setDivisionStatusByFlowKey(nextMap);
      }

      setFormUnitStatuses({
        premixStatuses: detailsPayload?.premixStatuses ?? null,
        motorStatuses: detailsPayload?.motorStatuses ?? null,
      });

      if (detailsPayload) {
        qcFormDetailsPayloadRef.current = detailsPayload as Record<string, unknown>;
      }

      if (detailsPayload && Array.isArray(detailsPayload.divisionDetails)) {
        const firstDetail = detailsPayload.divisionDetails[0];
        const flowKey = String(initialDivision || firstDetail?.division || "").trim();
        if (flowKey) {
          const navFromDetails = buildQcDivisionPartialNav({
            flowKey,
            rawMaterialType: initialRawMaterialType,
            autoPopulatePayload: {
              data: firstDetail?.data ?? {},
            },
            motorStatuses: detailsPayload.motorStatuses,
            premixStatuses: detailsPayload.premixStatuses,
          });
          if (navFromDetails.length) {
            setPartialNavItems(navFromDetails);
            setActivePartialNavIndex(0);
          }
        }
      }

      if (!options?.forDetails) {
        setView("form");
      }
      return true;
    },
    [fetchQcSchemaDocument, fetchQcSchemaDocumentCore, messages, showAlert, subDepartmentId],
  );

  const handleFillForm = async (batch: QCBatch) => {
    // View-only batch statuses open locked; continue-filling stays editable.
    setReadOnly(isManufacturingViewOnlyStatus(batch.qcStatus));
    await openFormWithResolvedData(batch, false);
  };

  const handleEditForm = async (batch: QCBatch) => {
    setReadOnly(false);
    await openFormWithResolvedData(batch, true);
  };

  const handleViewDetails = async (batch: QCBatch) => {
    if (!batch.formId) {
      showAlert(messages.FORM_ID_MISSING, "error");
      return;
    }

    setReadOnly(true);
    setDetailsRow(batch);
    setDetailsLoading(true);
    setActiveBatch(batch);
    const ok = await openFormWithResolvedData(batch, true, { forDetails: true });
    setDetailsLoading(false);

    if (ok) {
      setIsEditMode(false);
      setView("details");
      return;
    }

    setDetailsRow(null);
    setDetailsData(null);
    setReadOnly(false);
  };

  const handleBackFromDetails = useCallback(() => {
    bumpBatchRefresh();
    resetFormContext();
  }, [bumpBatchRefresh, resetFormContext]);

  const handleBack = () => {
    if (view === "details") {
      handleBackFromDetails();
      return;
    }
    if (view === "form" && isFormDirtyForView) {
      setBackConfirmOpen(true);
      return;
    }

    bumpBatchRefresh();
    resetFormContext();
  };

  const handleDiscardAndBack = useCallback(async () => {
    setBackConfirmOpen(false);
    await discardWorkflowForm({
      subDepartmentId,
      baselineState: null,
      currentState: formDataRef.current,
      extractTempFileIds: collectTempFileIdsFromQcForm,
      deleteTemp,
      resetForm: () => {
        bumpBatchRefresh();
        resetFormContext();
      },
    });
  }, [bumpBatchRefresh, deleteTemp, resetFormContext, subDepartmentId]);

  const submitUnit = async (intent: "draft" | "submit") => {
    if (!activeBatch) return false;

    if (!subDepartmentId) {
      showAlert(messages.SUB_DEPARTMENT_MISSING, "error");
      return false;
    }

    const activePartialItem = hasPartialChildNav(partialNavItems)
      ? (partialNavItems[activePartialNavIndex] ?? null)
      : null;

    if (activePartialItem && isQcUnitLocked(activePartialItem.status)) {
      showAlert(messages.EMPTY_FORM_ERROR, "warning");
      return false;
    }

    const activeDivisionKey = String(activeDivisionTabKey || selectedDivision || "").trim();
    const divisionLocked = isQcUnitLocked(
      divisionStatusByFlowKey[activeDivisionKey] ??
        divisionStatusByFlowKey[selectedDivision] ??
        "TO_BE_INITIATED",
    );
    if (!activePartialItem && divisionLocked) {
      showAlert(messages.DIVISION_LOCKED_WAITING, "warning");
      return false;
    }

    const submitFormState = activePartialItem
      ? scopeFormStateToPartialItem(formDataRef.current, activePartialItem, {
          flowKey: selectedDivision,
        })
      : formDataRef.current;

    if (!hasDivisionEntries(submitFormState) && !submitFormState.schemaFormLoaded) {
      showAlert(messages.EMPTY_FORM_ERROR, "warning");
      return false;
    }

    if (!hasAnyQualityControlValue(submitFormState)) {
      showAlert(messages.EMPTY_FORM_ERROR, "warning");
      return false;
    }

    if (hasIncompleteQcFormUploads(submitFormState)) {
      showAlert(STRINGS.QUALITY_CONTROL.NDT.FILE_UPLOAD_PENDING, "warning");
      return false;
    }

    const unitSubmissionType = intent === "draft" ? "DRAFT" : "SUBMIT";
    // Unit saves always keep root formSubmissionType as DRAFT (Case Prep / RMP pattern).
    const formSubmissionType = "DRAFT" as const;
    // Division-level flag: SUBMIT only when submitting the whole division (no active unit).
    const divisionSubmissionType =
      !activePartialItem && intent === "submit" ? ("SUBMIT" as const) : ("DRAFT" as const);
    const payload = mapQualityControlPayload(submitFormState, {
      unitSubmissionType,
      divisionSubmissionType,
    });
    const isCreateFlow =
      activeBatch.qcStatus === QUALITY_CONTROL_STATUS.TO_BE_INITIATED && !activeBatch.formId;

    setActionLoading(true);
    try {
      let response;

      if (isCreateFlow) {
        if (!activeBatch.batchId) {
          showAlert(messages.BATCH_ID_MISSING, "error");
          return false;
        }

        response = await qcDivisionController.createForm({
          batchId: activeBatch.batchId,
          subDepartmentId,
          formSubmissionType,
          ...payload,
        });
      } else {
        if (!activeBatch.formId) {
          showAlert(messages.FORM_ID_MISSING, "error");
          return false;
        }

        if (!activeBatch.batchId) {
          showAlert(messages.BATCH_ID_MISSING, "error");
          return false;
        }

        response = await qcDivisionController.updateForm({
          formId: activeBatch.formId,
          batchId: activeBatch.batchId,
          subDepartmentId,
          formSubmissionType,
          ...payload,
        });
      }

      if (!response?.success) {
        const fallback = isCreateFlow ? messages.CREATE_FAILED : messages.UPDATE_FAILED;
        showAlert(getErrorMessage(response, fallback), "error");
        return false;
      }

      const nextFormId = response.data?.formId ?? activeBatch.formId ?? null;
      setActiveBatch((prev) =>
        prev
          ? {
              ...prev,
              formId: nextFormId,
              division: formData.division,
              subType: formData.subType,
            }
          : prev,
      );
      setIsFormDirty(false);

      // Refresh /qc-division/details so Mixing (and other) IN_PROGRESS+ tabs read saved QC data.
      let refreshedDetails: Record<string, unknown> | null = null;
      if (nextFormId && subDepartmentId) {
        try {
          const detailsResponse = await qcDivisionController.fetchFormDetails({
            formId: nextFormId,
            subDepartmentId,
          });
          if (detailsResponse?.success && detailsResponse.data) {
            refreshedDetails = detailsResponse.data as unknown as Record<string, unknown>;
            qcFormDetailsPayloadRef.current = refreshedDetails;
            if (Array.isArray((refreshedDetails as any).divisionStatuses)) {
              const nextMap: Record<string, QcPartialItemStatus> = {};
              (refreshedDetails as any).divisionStatuses.forEach((entry: any) => {
                const key = String(entry?.division ?? "").trim();
                if (!key) return;
                nextMap[key] = normalizePartialItemStatus(entry?.status);
              });
              setDivisionStatusByFlowKey((prev) => ({ ...prev, ...nextMap }));
            }
            if (
              (refreshedDetails as any).premixStatuses != null ||
              (refreshedDetails as any).motorStatuses != null
            ) {
              setFormUnitStatuses({
                premixStatuses: (refreshedDetails as any).premixStatuses ?? null,
                motorStatuses: (refreshedDetails as any).motorStatuses ?? null,
              });
            }
          } else {
            qcFormDetailsPayloadRef.current = null;
          }
        } catch {
          qcFormDetailsPayloadRef.current = null;
        }
      }

      // Mixing: rehydrate the active unit from /qc-division/details after create/update.
      const activeFlowKey = String(formData.division ?? selectedDivision ?? "").trim();
      if (
        refreshedDetails &&
        activeFlowKey === "MIXING" &&
        activePartialItem &&
        (activePartialItem.kind === "PREMIX" || activePartialItem.kind === "FINAL_MIX")
      ) {
        const detailRecord =
          resolveMixingQcFormData(refreshedDetails) ??
          toDivisionAutoPopulateRecord(
            findQcFormDivisionDetail(refreshedDetails, {
              flowKey: "MIXING",
              rawMaterialType: selectedRawMaterialType,
            }),
          ) ??
          toDivisionAutoPopulateRecord(refreshedDetails);
        const mixNo =
          activePartialItem.kind === "FINAL_MIX"
            ? (activePartialItem.finalMixNo ?? activePartialItem.premixNo)
            : activePartialItem.premixNo;
        const entryIds = resolveEntryIdsForPartialItem(
          formDataRef.current.divisionEntries ?? [],
          activePartialItem,
          { flowKey: "MIXING" },
        );
        const entryId = entryIds[0];
        if (mixNo != null && detailRecord && entryId) {
          const domainEntry = findMixingPremixDomainEntry(detailRecord, mixNo);
          const hydrated = hydrateMixingDivisionFromFormData(detailRecord);
          updateFormData((prev) => {
            let next = { ...prev };
            const entryValues = { ...(prev.divisionEntryValues ?? {}) };
            if (activePartialItem.kind === "PREMIX" && domainEntry?.premixDetails) {
              entryValues[entryId] = {
                ...entryValues[entryId],
                schemaValues: hydrateMixingDetailsValuesFromDomain(
                  domainEntry.premixDetails,
                  "premix",
                ),
              };
            }
            if (activePartialItem.kind === "FINAL_MIX") {
              const finalMixDetails =
                domainEntry?.finalMixDetails &&
                typeof domainEntry.finalMixDetails === "object" &&
                !Array.isArray(domainEntry.finalMixDetails)
                  ? (domainEntry.finalMixDetails as Record<string, unknown>)
                  : null;
              let viscosityValues: SchemaFormValues | undefined;
              if (finalMixDetails?.viscosityBuildUp) {
                viscosityValues = hydrateViscosityValuesFromDomain(
                  finalMixDetails.viscosityBuildUp,
                );
              } else {
                const fromHydrated = hydrated?.finalMixEntries.find(
                  (row) => row.premixNo === mixNo,
                );
                if (fromHydrated) viscosityValues = fromHydrated.values;
              }
              const detailsValues = finalMixDetails
                ? hydrateMixingDetailsValuesFromDomain(finalMixDetails, "finalMix")
                : hydrated?.finalMixDetailsValues;
              if (viscosityValues || detailsValues) {
                entryValues[entryId] = {
                  ...entryValues[entryId],
                  schemaValues: mergeFinalMixEntrySchemaValues(
                    detailsValues,
                    viscosityValues ?? entryValues[entryId]?.schemaValues,
                  ),
                };
              }
              if (detailsValues) {
                next = {
                  ...next,
                  mixingFinalMixDetailsValues: detailsValues,
                };
              }
            }
            return { ...next, divisionEntryValues: entryValues };
          });
        }
      }

      // Hardware: restore shared upload fields from saved /qc-division/details after create/update.
      if (
        refreshedDetails &&
        activeFlowKey === "HARDWARE" &&
        activePartialItem?.kind === "MOTOR" &&
        activePartialItem.motorId
      ) {
        const detailRecord =
          toDivisionAutoPopulateRecord(
            findQcFormDivisionDetail(refreshedDetails, {
              flowKey: "HARDWARE",
              rawMaterialType: selectedRawMaterialType,
            }),
          ) ?? toDivisionAutoPopulateRecord(refreshedDetails);
        const sections = expandDivisionDetailSections(
          detailRecord && typeof detailRecord === "object"
            ? (detailRecord as Record<string, unknown>)
            : null,
        );
        updateFormData((prev) => ({
          ...prev,
          divisionEntryValues: applyHardwareSharedUploadsToEntryValues(
            prev.divisionEntries ?? [],
            prev.divisionEntryValues ?? {},
            sections,
          ),
        }));
      }

      if (activePartialItem) {
        const nextStatus = intent === "draft" ? "IN_PROGRESS" : "WAITING_FOR_APPROVAL";
        setPartialNavItems((prev) => {
          const updated = updatePartialNavStatus(prev, activePartialItem.id, nextStatus);
          return applyStatusMapsToPartialNav(updated, {
            motorStatuses:
              (refreshedDetails as any)?.motorStatuses ?? (response.data as any)?.motorStatuses,
            premixStatuses:
              (refreshedDetails as any)?.premixStatuses ?? (response.data as any)?.premixStatuses,
            division: String(formData.division ?? selectedDivision ?? ""),
          });
        });
      }

      if (
        (response.data as any)?.premixStatuses != null ||
        (response.data as any)?.motorStatuses != null
      ) {
        const stampDivision = String(
          formData.division ??
            (selectedRawMaterialType === "RAW_MATERIAL_PROCESSING"
              ? "RAW_MATERIAL_PROCESSING"
              : selectedDivision) ??
            "",
        ).trim();
        const stampStageType =
          activePartialItem?.kind === "FINAL_MIX"
            ? "FINAL_MIX"
            : activePartialItem?.kind === "PREMIX"
              ? "PREMIX"
              : undefined;
        const stampRows = (rows: unknown) => {
          if (!Array.isArray(rows) || !stampDivision) return rows;
          return rows.map((row) => {
            if (!row || typeof row !== "object") return row;
            const rec = row as Record<string, unknown>;
            const next: Record<string, unknown> = { ...rec };
            if (!String(rec.division ?? "").trim()) next.division = stampDivision;
            if (stampStageType && !String(rec.stageType ?? rec.stage_type ?? "").trim()) {
              next.stageType = stampStageType;
            }
            return next;
          });
        };
        setFormUnitStatuses((prev) => ({
          premixStatuses:
            (response.data as any)?.premixStatuses != null
              ? stampRows((response.data as any).premixStatuses)
              : prev.premixStatuses,
          motorStatuses:
            (response.data as any)?.motorStatuses != null
              ? stampRows((response.data as any).motorStatuses)
              : prev.motorStatuses,
        }));
      }

      if (Array.isArray((response.data as any)?.divisionStatuses)) {
        const nextMap: Record<string, QcPartialItemStatus> = {};
        (response.data as any).divisionStatuses.forEach((entry: any) => {
          const key = String(entry?.division ?? "").trim();
          if (!key) return;
          nextMap[key] = normalizePartialItemStatus(entry?.status);
        });
        setDivisionStatusByFlowKey((prev) => ({ ...prev, ...nextMap }));
      }

      if (intent === "draft") {
        showAlert(
          isCreateFlow ? messages.CREATE_DRAFT_SUCCESS : messages.UPDATE_DRAFT_SUCCESS,
          "success",
          { autoCloseMs: 2200 },
        );
        setHasSavedDraft(true);
      } else {
        showAlert(
          isCreateFlow ? messages.CREATE_SUBMIT_SUCCESS : messages.UPDATE_SUBMIT_SUCCESS,
          "success",
          { autoCloseMs: 2200 },
        );
        setHasSavedDraft(true);
        await listParams.refreshUserBatches();
      }

      return true;
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveDraft = async () => submitUnit("draft");
  const handleSubmit = async () => submitUnit("submit");

  const handleSubmitDivision = useCallback(async () => {
    if (!activeBatch) return false;
    if (!subDepartmentId) {
      showAlert(messages.SUB_DEPARTMENT_MISSING, "error");
      return false;
    }

    const isRevalidationDivision =
      activeDivisionTabKey === "RAW_MATERIAL_REVALIDATION" ||
      selectedDivision === "RAW_MATERIAL_REVALIDATION" ||
      isRawMaterialRevalidationType(selectedRawMaterialType);
    if (!isRevalidationDivision) return false;

    const hasUnits = hasPartialChildNav(partialNavItems);
    if (hasUnits && !areAllPartialItemsApproved(partialNavItems)) {
      showAlert(messages.DIVISION_APPROVAL_NOT_READY, "warning");
      return false;
    }

    const division =
      (formData.division as QcApiDivision | null) ?? (selectedDivision as QcApiDivision | null);
    if (!division) {
      showAlert(messages.EMPTY_FORM_ERROR, "warning");
      return false;
    }

    const submitFormState = formDataRef.current;
    let payload: ReturnType<typeof mapQualityControlPayload>;

    if (!hasUnits) {
      // Divisions without unit nav (e.g. Raw Material Revalidation): send full form data.
      if (!hasDivisionEntries(submitFormState) && !submitFormState.schemaFormLoaded) {
        showAlert(messages.EMPTY_FORM_ERROR, "warning");
        return false;
      }
      if (!hasAnyQualityControlValue(submitFormState)) {
        showAlert(messages.EMPTY_FORM_ERROR, "warning");
        return false;
      }
      payload = mapQualityControlPayload(submitFormState, {
        unitSubmissionType: "SUBMIT",
        divisionSubmissionType: "SUBMIT",
      });
    } else {
      payload = mapQualityControlDivisionSubmitPayload({
        division,
        subType: formData.subType,
      });
    }

    const isCreateFlow =
      !hasUnits &&
      activeBatch.qcStatus === QUALITY_CONTROL_STATUS.TO_BE_INITIATED &&
      !activeBatch.formId;

    if (!isCreateFlow && !activeBatch.formId) {
      showAlert(messages.FORM_ID_MISSING, "error");
      return false;
    }
    if (!activeBatch.batchId) {
      showAlert(messages.BATCH_ID_MISSING, "error");
      return false;
    }

    setActionLoading(true);
    try {
      const response = isCreateFlow
        ? await qcDivisionController.createForm({
            batchId: activeBatch.batchId,
            subDepartmentId,
            formSubmissionType: "DRAFT",
            ...payload,
          })
        : await qcDivisionController.updateForm({
            formId: activeBatch.formId!,
            batchId: activeBatch.batchId,
            subDepartmentId,
            formSubmissionType: "DRAFT",
            ...payload,
          });

      if (!response?.success) {
        showAlert(getErrorMessage(response, messages.DIVISION_SUBMIT_FAILED), "error");
        return false;
      }

      const nextFormId = response.data?.formId ?? activeBatch.formId ?? null;
      setActiveBatch((prev) =>
        prev
          ? {
              ...prev,
              formId: nextFormId,
              division: formData.division,
              subType: formData.subType,
            }
          : prev,
      );
      setIsFormDirty(false);

      setDivisionStatusByFlowKey((prev) => ({
        ...prev,
        [String(activeDivisionTabKey || selectedDivision || division)]: "WAITING_FOR_APPROVAL",
      }));

      // Refresh /qc-division/details after division submit so status/data stay in sync.
      if (nextFormId && subDepartmentId) {
        try {
          const detailsResponse = await qcDivisionController.fetchFormDetails({
            formId: nextFormId,
            subDepartmentId,
          });
          if (detailsResponse?.success && detailsResponse.data) {
            const refreshed = detailsResponse.data as unknown as Record<string, unknown>;
            qcFormDetailsPayloadRef.current = refreshed;
            if (Array.isArray((refreshed as any).divisionStatuses)) {
              const nextMap: Record<string, QcPartialItemStatus> = {};
              (refreshed as any).divisionStatuses.forEach((entry: any) => {
                const key = String(entry?.division ?? "").trim();
                if (!key) return;
                nextMap[key] = normalizePartialItemStatus(entry?.status ?? "WAITING_FOR_APPROVAL");
              });
              setDivisionStatusByFlowKey((prev) => ({ ...prev, ...nextMap }));
            }
            if (
              (refreshed as any).premixStatuses != null ||
              (refreshed as any).motorStatuses != null
            ) {
              setFormUnitStatuses({
                premixStatuses: (refreshed as any).premixStatuses ?? null,
                motorStatuses: (refreshed as any).motorStatuses ?? null,
              });
            }
          } else {
            qcFormDetailsPayloadRef.current = null;
          }
        } catch {
          qcFormDetailsPayloadRef.current = null;
        }
      }

      if (Array.isArray((response.data as any)?.divisionStatuses)) {
        const nextMap: Record<string, QcPartialItemStatus> = {};
        (response.data as any).divisionStatuses.forEach((entry: any) => {
          const key = String(entry?.division ?? "").trim();
          if (!key) return;
          nextMap[key] = normalizePartialItemStatus(entry?.status ?? "WAITING_FOR_APPROVAL");
        });
        setDivisionStatusByFlowKey((prev) => ({ ...prev, ...nextMap }));
      }

      showAlert(messages.DIVISION_SUBMIT_SUCCESS, "success", { autoCloseMs: 2200 });
      setHasSavedDraft(true);
      await listParams.refreshUserBatches();
      return true;
    } finally {
      setActionLoading(false);
    }
  }, [
    activeBatch,
    activeDivisionTabKey,
    formData.division,
    formData.subType,
    listParams,
    messages,
    partialNavItems,
    selectedDivision,
    showAlert,
    subDepartmentId,
  ]);

  const handleSubmitForFinalApproval = useCallback(async () => {
    if (!activeBatch) return false;
    if (!subDepartmentId) {
      showAlert(messages.SUB_DEPARTMENT_MISSING, "error");
      return false;
    }
    if (!activeBatch.formId) {
      showAlert(messages.FORM_ID_MISSING, "error");
      return false;
    }
    if (!activeBatch.batchId) {
      showAlert(messages.BATCH_ID_MISSING, "error");
      return false;
    }

    setActionLoading(true);
    try {
      const response = await qcDivisionController.updateForm({
        formId: activeBatch.formId,
        batchId: activeBatch.batchId,
        subDepartmentId,
        formSubmissionType: "SUBMIT",
        divisionDetails: [],
      });

      if (!response?.success) {
        showAlert(getErrorMessage(response, messages.FINAL_APPROVAL_FAILED), "error");
        return false;
      }

      showAlert(messages.FINAL_APPROVAL_SUCCESS, "success", { autoCloseMs: 2200 });
      await listParams.refreshUserBatches();
      resetFormContext();
      return true;
    } finally {
      setActionLoading(false);
    }
  }, [activeBatch, listParams, messages, resetFormContext, showAlert, subDepartmentId]);

  const partialNavActive = hasPartialChildNav(partialNavItems);
  const activePartialItem = partialNavActive
    ? (partialNavItems[activePartialNavIndex] ?? null)
    : null;

  const divisionGroupStatusByFlowKey = useMemo(() => {
    const map: Record<string, QcPartialItemStatus> = {};
    Object.entries(divisionStatusByFlowKey).forEach(([key, status]) => {
      map[key] = normalizePartialItemStatus(status);
    });

    // Ensure every catalog tab has a status (default TO_BE_INITIATED).
    // Prefer API divisionStatuses — do not overwrite with aggregated premix/motor nav.
    divisionNavTabs.forEach((tab) => {
      const resolved =
        map[tab.tabKey] ?? map[tab.rawMaterialType] ?? map[tab.flowKey] ?? "TO_BE_INITIATED";
      map[tab.tabKey] = normalizePartialItemStatus(resolved);
      if (!map[tab.flowKey]) {
        map[tab.flowKey] = map[tab.tabKey];
      }
    });

    // Only fill gaps when API has no status for the active tab.
    if (partialNavActive && activeDivisionTabKey && partialNavItems.length) {
      const apiStatus = map[activeDivisionTabKey];
      if (!apiStatus || apiStatus === "TO_BE_INITIATED") {
        const aggregated = aggregatePartialNavStatus(partialNavItems);
        if (aggregated !== "TO_BE_INITIATED") {
          map[activeDivisionTabKey] = aggregated;
          if (
            selectedDivision &&
            (!map[selectedDivision] || map[selectedDivision] === "TO_BE_INITIATED")
          ) {
            map[selectedDivision] = aggregated;
          }
        }
      }
    }
    return map;
  }, [
    activeDivisionTabKey,
    divisionNavTabs,
    divisionStatusByFlowKey,
    partialNavActive,
    partialNavItems,
    selectedDivision,
  ]);

  const activeDivisionStatus = useMemo(() => {
    if (!activeDivisionTabKey && !selectedDivision) return "TO_BE_INITIATED" as QcPartialItemStatus;
    return normalizePartialItemStatus(
      divisionGroupStatusByFlowKey[activeDivisionTabKey] ??
        divisionGroupStatusByFlowKey[selectedDivision] ??
        "TO_BE_INITIATED",
    );
  }, [activeDivisionTabKey, divisionGroupStatusByFlowKey, selectedDivision]);

  const isDivisionNavTabEnabled = useCallback((_tabKey: string) => true, []);

  const getDivisionNavTabDisabledReason = useCallback((_tabKey: string) => undefined, []);

  // Division-level lock applies only to Raw Material Revalidation (no unit nav).
  const isRevalidationDivisionActive =
    activeDivisionTabKey === "RAW_MATERIAL_REVALIDATION" ||
    selectedDivision === "RAW_MATERIAL_REVALIDATION" ||
    isRawMaterialRevalidationType(selectedRawMaterialType);
  const isActiveDivisionReadOnly = isQcUnitLocked(activeDivisionStatus);
  const isActiveDivisionApproved = isQcUnitApproved(activeDivisionStatus);

  // Unit-level lock (premix / motor / final mix) — same rule as RMP / Case Prep / Mixing.
  const isActivePartialReadOnly = Boolean(
    activePartialItem && isQcUnitLocked(activePartialItem.status),
  );
  const isActivePartialApproved = Boolean(
    activePartialItem && isQcUnitApproved(activePartialItem.status),
  );

  // Other divisions: only individual units lock — division status is backend-managed.
  const isFormFieldsLocked =
    readOnly ||
    isActivePartialReadOnly ||
    (isRevalidationDivisionActive && !partialNavActive && isActiveDivisionReadOnly);
  const isFormFieldsReadOnly =
    readOnly ||
    isActivePartialApproved ||
    (isRevalidationDivisionActive && !partialNavActive && isActiveDivisionApproved);

  const formLockMessage = useMemo(() => {
    if (readOnly) return null;
    if (isActivePartialReadOnly && activePartialItem) {
      return activePartialItem.status === "APPROVED"
        ? messages.UNIT_LOCKED_APPROVED
        : messages.UNIT_LOCKED_WAITING;
    }
    if (!partialNavActive && isRevalidationDivisionActive && isActiveDivisionReadOnly) {
      return activeDivisionStatus === "APPROVED"
        ? messages.DIVISION_LOCKED_APPROVED
        : messages.DIVISION_LOCKED_WAITING;
    }
    return null;
  }, [
    activeDivisionStatus,
    activePartialItem,
    isActiveDivisionReadOnly,
    isActivePartialReadOnly,
    isRevalidationDivisionActive,
    messages.DIVISION_LOCKED_APPROVED,
    messages.DIVISION_LOCKED_WAITING,
    messages.UNIT_LOCKED_APPROVED,
    messages.UNIT_LOCKED_WAITING,
    partialNavActive,
    readOnly,
  ]);

  const divisionLabel =
    divisionNavTabs.find((tab) => tab.tabKey === activeDivisionTabKey)?.label ||
    divisionOptions.find((option) => option.value === selectedDivision)?.label ||
    selectedDivision ||
    "Division";

  const divisionApprovalRows = useMemo(
    () => buildDivisionApprovalRows(partialNavItems, divisionLabel),
    [divisionLabel, partialNavItems],
  );

  const canProceedDivisionSubmit = useMemo(() => {
    if (partialNavActive) return areAllPartialItemsApproved(partialNavItems);
    // Division-scoped (revalidation): allow proceed when form has data / draft saved.
    return hasAnyQualityControlValue(formData) || Boolean(activeBatch?.formId);
  }, [activeBatch?.formId, formData, partialNavActive, partialNavItems]);

  const finalApprovalGroups = useMemo(() => {
    const tabs =
      divisionNavTabs.length > 0
        ? divisionNavTabs
        : Object.keys(divisionStatusByFlowKey).map((key) => ({
            tabKey: key,
            flowKey: key,
            label: divisionOptions.find((option) => option.value === key)?.label || key,
            rawMaterialType: "",
          }));

    const cachedDetails = qcFormDetailsPayloadRef.current;
    const premixStatuses =
      formUnitStatuses.premixStatuses ??
      (cachedDetails as { premixStatuses?: unknown } | null)?.premixStatuses ??
      null;
    const motorStatuses =
      formUnitStatuses.motorStatuses ??
      (cachedDetails as { motorStatuses?: unknown } | null)?.motorStatuses ??
      null;
    const unitsByTabKey = groupUnitStatusesByDivisionTabKey({
      premixStatuses,
      motorStatuses,
    });

    const divisions = tabs.map((tab) => {
      const statusKey = String(tab.tabKey || tab.flowKey || "").trim();
      const typeKey = String(tab.rawMaterialType || "").trim();
      const lookupKeys = [statusKey, typeKey].filter(Boolean);
      const isExactActiveTab = statusKey === activeDivisionTabKey;

      // Strict: only units mapped to this tab key (never parent RAW_MATERIAL).
      let units: QcPartialNavItem[] = [];
      lookupKeys.forEach((key) => {
        units = mergePartialNavItems(units, unitsByTabKey[key.toUpperCase()] ?? []);
      });

      if (isExactActiveTab && partialNavItems.length) {
        // Keep only real unit chips from the open division nav.
        const liveUnits = partialNavItems.filter(
          (item) => item.kind === "PREMIX" || item.kind === "FINAL_MIX" || item.kind === "MOTOR",
        );
        units = mergePartialNavItems(liveUnits, units);
      }

      return {
        divisionKey: statusKey,
        divisionLabel: tab.label,
        divisionStatus: normalizePartialItemStatus(
          divisionGroupStatusByFlowKey[statusKey] ??
            divisionGroupStatusByFlowKey[typeKey] ??
            divisionGroupStatusByFlowKey[tab.flowKey] ??
            divisionStatusByFlowKey[statusKey] ??
            "TO_BE_INITIATED",
        ),
        units,
      };
    });

    return buildFinalApprovalDivisionGroups(divisions);
  }, [
    activeDivisionTabKey,
    divisionGroupStatusByFlowKey,
    divisionNavTabs,
    divisionOptions,
    divisionStatusByFlowKey,
    formUnitStatuses.motorStatuses,
    formUnitStatuses.premixStatuses,
    partialNavItems,
  ]);

  /** Flat rows kept for approver overview / legacy consumers. */
  const finalApprovalRows = useMemo(
    () =>
      buildFinalApprovalRows(
        finalApprovalGroups.map((group) => ({
          divisionLabel: group.divisionLabel,
          divisionStatus: group.divisionStatus,
          units: group.units.map((unit) => ({
            id: unit.id,
            kind: unit.kind,
            label: unit.label,
            status: unit.status,
          })),
        })),
      ),
    [finalApprovalGroups],
  );

  const canProceedFinalApproval = useMemo(() => {
    if (!finalApprovalGroups.length) return false;
    if (Object.keys(divisionStatusByFlowKey).length > 0) {
      return Object.values(divisionStatusByFlowKey).every((status) => status === "APPROVED");
    }
    return areAllFinalApprovalGroupsApproved(finalApprovalGroups);
  }, [divisionStatusByFlowKey, finalApprovalGroups]);

  const scopedFormData = useMemo(
    () =>
      activePartialItem
        ? scopeFormStateToPartialItem(formData, activePartialItem, {
            flowKey: selectedDivision || activeDivisionTabKey,
          })
        : formData,
    [activeDivisionTabKey, activePartialItem, formData, selectedDivision],
  );

  const tabScopedFormData = useMemo(() => {
    const tab = divisionNavTabs.find((entry) => entry.tabKey === activeDivisionTabKey);
    const base = scopedFormData;
    if (!tab) return base;
    const entries = (base.divisionEntries ?? []).filter((entry) =>
      entryMatchesDivisionTab(entry, tab),
    );
    if (entries.length === (base.divisionEntries ?? []).length) return base;
    return { ...base, divisionEntries: entries };
  }, [activeDivisionTabKey, divisionNavTabs, entryMatchesDivisionTab, scopedFormData]);

  return {
    ...listParams,
    loading: listParams.loading,
    view,
    activeBatch,
    isEditMode,
    readOnly,
    formData,
    scopedFormData: tabScopedFormData,
    isFormDirty: isFormDirtyForView,
    selectedDivision,
    divisionOptions,
    divisionsLoading,
    divisionNavTabs,
    activeDivisionTabKey,
    rawMaterialTypeOptions,
    selectedRawMaterialType,
    selectedProcessingType,
    selectedPremixSlot,
    selectedPremix,
    selectedMixingStage,
    selectedStfMotorType,
    selectedMotorId,
    selectedHardwareProcesses,
    selectedTrimmingMotorCount,
    trimmingMotorReceivedDate,
    selectedPostCureOperation,
    selectedInhibitorType,
    selectedPropellantProcess,
    addedPremixNumbers,
    addedDivisionEntryKeys,
    activeDivisionGroupIndex,
    activeDivisionSubIndex,
    loadingFormDetails,
    schemaLoading: schemaLoading || partialItemLoading || divisionAutoPopulateLoading,
    schemaError,
    divisionAutoPopulateData,
    mixingQualityChecksByStage,
    divisionAutoPopulateLoading,
    partialNavItems,
    activePartialNavIndex,
    partialNavActive,
    activePartialItem,
    isActivePartialReadOnly,
    isActiveDivisionReadOnly,
    isFormFieldsLocked,
    isFormFieldsReadOnly,
    formLockMessage,
    activeDivisionStatus,
    isPartialNavTabEnabled,
    getPartialNavTabDisabledReason,
    isDivisionNavTabEnabled,
    getDivisionNavTabDisabledReason,
    partialItemLoading,
    divisionGroupStatusByFlowKey,
    actionLoading,
    backConfirmOpen,
    batches,
    subDepartmentId,
    handleFillForm,
    handleEditForm,
    handleViewDetails,
    handleBackFromDetails,
    detailsRow,
    detailsData,
    detailsLoading,
    handleBack,
    handleDiscardAndBack,
    setBackConfirmOpen,
    handleDivisionChange,
    handleDivisionNavTabChange,
    handleRawMaterialTypeChange,
    handleProcessingTypeChange,
    handlePremixSlotChange,
    handlePremixChange,
    handleMixingStageChange,
    handleStfMotorTypeChange,
    handleMotorIdChange,
    handleHardwareProcessesChange,
    handleTrimmingMotorCountChange,
    handleTrimmingMotorReceivedDateChange,
    handlePostCureOperationChange,
    handleInhibitorTypeChange,
    handlePropellantProcessChange,
    handleLoadQcForm,
    handlePartialNavIndexChange,
    handleDivisionEntryValuesChange,
    handleDivisionEntryLiquidValuesChange,
    handleMixingFinalMixDetailsChange,
    handleRemoveDivisionEntry,
    setActiveDivisionGroupIndex,
    setActiveDivisionSubIndex,
    handleFormValuesChange,
    handleSaveDraft,
    handleSubmit,
    handleSubmitDivision,
    handleSubmitForFinalApproval,
    canProceedDivisionSubmit,
    canProceedFinalApproval,
    divisionApprovalRows,
    finalApprovalGroups,
    finalApprovalRows,
  };
};

export default useQCDivisionHook;
