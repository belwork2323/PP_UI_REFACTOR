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
  mapQualityControlDivisionSubmitPayload,
  mapQualityControlPayload,
  type QualityControlFormState,
} from "../../../data/models/user/QualityControlFormModel";
import { createQcInitialValues, fetchQcSchema, hydrateQcValuesFromSections } from "../../../schema-engine/adapters/qc.adapter";
import type { QcApiDivision, QcApiSubType, QcInhibitorType } from "../../../schema-engine/adapters/qc.adapter";
import type { SchemaDocumentV2, SchemaFormValues, SchemaSectionSubmission } from "../../../schema-engine";
import {
  getQcSchemaCacheKey,
  mapQcDivisionsFromApi,
  resolveQcDivisionIdForSelection,
  resolveQcRawMaterialTypeOptions,
  toQcDivisionSelectOptions,
  resolveBatchFlowSelection,
  resolveQcSchemaSelectionForSlot,
  type QcDivisionCatalogItem,
  type QCBatch,
} from "./qcFlowConfig";
import {
  hasPartialChildNav,
  isPartialItemReadOnly,
  mapDivisionDetailsToPartialNav,
  resolveEntryIdsForPartialItem,
  scopeFormStateToPartialItem,
  updatePartialNavStatus,
  aggregatePartialNavStatus,
  areAllPartialItemsApproved,
  buildDivisionApprovalRows,
  buildFinalApprovalRows,
  areAllFinalApprovalRowsApproved,
  applyStatusMapsToPartialNav,
  type QcPartialNavItem,
  type QcPartialItemStatus,
} from "./qcDivisionApprovalUnits";
import { isRawMaterialProcessingType } from "./qcProcessingConfig";
import {
  isBothProcessingType,
  isRawMaterialRevalidationType,
  type QcProcessingSlot,
} from "./qcProcessingConfig";
import {
  resolveDivisionSchemaRequest,
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
import {
  isQcCuringSubType,
  mapQcCuringTypeToSubType,
  QC_CURING_TYPE_OPTIONS,
} from "./qcCuringConfig";
import {
  buildDivisionNavGroups,
  resolveNavIndicesForEntry,
} from "./qcDivisionNav";
import {
  getHardwareSectionIdForSubType,
  getPendingHardwareProcesses,
} from "./qcHardwareConfig";
import {
  isQcPropellantProcessSubType,
  mapQcPropellantProcessToApi,
} from "./qcPropellantConfig";
import {
  mapQcTrimmingSubTypeToApi,
  resolveQcTrimmingSubType,
} from "./qcTrimmingConfig";
import { resolveQcSectionInhibitorType } from "./qcPostCureConfig";
import {
  createMixingFinalMixDetailsValues,
  createMixingFinalMixViscosityValues,
  getMixingFinalMixEntries,
  groupMixingDetailSections,
  hydrateMixingFinalMixDetailsValues,
  isQcMixingStage,
  QC_MIXING_PREMIX_SECTION_ID,
  QC_MIXING_VISCOSITY_SECTION_ID,
  sliceMixingFinalMixSchema,
} from "./qcMixingConfig";
import { useSubdepartmentBatches } from "../useSubdepartmentBatches";
import { QUALITY_CONTROL_STATUS } from "./qualityControlWorkflowData";
import { fetchQcSchemaWithInflightDedup, getCachedQcSchema, mapWithConcurrency } from "./qcSchemaFetchCache";

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
  qcStatus: batch?.qcStatus ?? batch?.qcDivStatus ?? batch?.status ?? QUALITY_CONTROL_STATUS.TO_BE_INITIATED,
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
  const messages = STRINGS.QUALITY_CONTROL.QC_DIVISION;

  const subDepartmentId = useMemo(
    () =>
      user?.allSubDepartments.find((subDept) => subDept.slugs?.subDept === "qc-division")
        ?.subDepartmentId,
    [user],
  );

  const [view, setView] = useState<WorkflowView>("list");
  const [activeBatch, setActiveBatch] = useState<QCBatch | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [readOnly, setReadOnly] = useState(false);
  const defaultFormState = createDefaultQualityControlFormState();
  const defaultSplit = splitFormState(defaultFormState);
  const [formBase, setFormBase] = useState<QualityControlFormBase>(defaultSplit.formBase);
  const [divisionEntryValues, setDivisionEntryValues] = useState<Record<string, QcDivisionEntryValues>>(
    defaultSplit.divisionEntryValues,
  );
  const [mixingFinalMixDetailsValues, setMixingFinalMixDetailsValues] = useState<SchemaFormValues | undefined>(
    defaultSplit.mixingFinalMixDetailsValues,
  );
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

  const updateFormData = useCallback((updater: (prev: QualityControlFormState) => QualityControlFormState) => {
    applyFullFormState(updater(formDataRef.current));
    markFormDirty();
  }, [applyFullFormState, markFormDirty]);

  const [selectedDivision, setSelectedDivision] = useState("");
  const [divisionCatalog, setDivisionCatalog] = useState<QcDivisionCatalogItem[]>([]);
  const [divisionsLoading, setDivisionsLoading] = useState(false);
  const [divisionAutoPopulateData, setDivisionAutoPopulateData] = useState<Record<string, unknown> | null>(
    null,
  );
  const [divisionAutoPopulateLoading, setDivisionAutoPopulateLoading] = useState(false);
  const divisionAutoPopulateRequestIdRef = useRef(0);
  const [partialNavItems, setPartialNavItems] = useState<QcPartialNavItem[]>([]);
  const [activePartialNavIndex, setActivePartialNavIndex] = useState(0);
  const [partialItemLoading, setPartialItemLoading] = useState(false);
  const [divisionStatusByFlowKey, setDivisionStatusByFlowKey] = useState<
    Record<string, QcPartialItemStatus>
  >({});
  const partialNavLoadRequestIdRef = useRef(0);
  const partialNavSeedKeyRef = useRef("");
  const [selectedRawMaterialType, setSelectedRawMaterialType] = useState("");
  const [selectedProcessingType, setSelectedProcessingType] = useState("");
  const [selectedPremixSlot, setSelectedPremixSlot] = useState<QcProcessingSlot>("SOLID_PROCESSING");
  const [selectedPremix, setSelectedPremix] = useState<number | "">("");
  const [selectedMixingStage, setSelectedMixingStage] = useState("");
  const [selectedStfMotorType, setSelectedStfMotorType] = useState("");
  const [selectedMotorId, setSelectedMotorId] = useState("");
  const [selectedHardwareProcesses, setSelectedHardwareProcesses] = useState<string[]>([]);
  const [selectedCuringType, setSelectedCuringType] = useState("");
  const [selectedTrimmingMotorCount, setSelectedTrimmingMotorCount] = useState<number | "">("");
  const [trimmingMotorReceivedDate, setTrimmingMotorReceivedDate] = useState("");
  const [selectedPostCureOperation, setSelectedPostCureOperation] = useState("");
  const [selectedInhibitorType, setSelectedInhibitorType] = useState("");
  const [selectedPropellantProcess, setSelectedPropellantProcess] = useState("");
  const [weightmentWeighscaleNo, setWeightmentWeighscaleNo] = useState("");
  const [weightmentCalibrationDueDate, setWeightmentCalibrationDueDate] = useState("");
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
    setSelectedCuringType("");
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
    ) => {
      if (!subDepartmentId) {
        showAlert(messages.SUB_DEPARTMENT_MISSING, "error");
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
          showAlert(message, "error");
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

  const resetFlowBarSelection = useCallback(() => {
    setSelectedDivision("");
    setSelectedRawMaterialType("");
    setSelectedProcessingType("");
    setSelectedPremixSlot("SOLID_PROCESSING");
    setSelectedPremix("");
    setSelectedMixingStage("");
    setSelectedStfMotorType("");
    setSelectedMotorId("");
    setSelectedHardwareProcesses([]);
    setSelectedCuringType("");
    setSelectedTrimmingMotorCount("");
    setTrimmingMotorReceivedDate("");
    setSelectedPostCureOperation("");
    setSelectedInhibitorType("");
    setSelectedPropellantProcess("");
    setWeightmentWeighscaleNo("");
    setWeightmentCalibrationDueDate("");
    setSchemaError(null);
    setDivisionAutoPopulateData(null);
  }, []);

  const clearPartialNav = useCallback(() => {
    partialNavLoadRequestIdRef.current += 1;
    partialNavSeedKeyRef.current = "";
    setPartialNavItems([]);
    setActivePartialNavIndex(0);
    setPartialItemLoading(false);
  }, []);

  const loadDivisionAutoPopulate = useCallback(
    async (divisionFlowKey: string, typeValue?: string | null) => {
      const batchId = String(activeBatch?.batchId ?? "").trim();
      const divisionId = resolveQcDivisionIdForSelection(
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
        const isRawMaterialProcessing =
          divisionFlowKey === "RAW_MATERIAL" && isRawMaterialProcessingType(typeKey);

        let batchPayload: unknown = null;
        if (isRawMaterialProcessing) {
          try {
            batchPayload = await batchManagementController.getBatchById(batchId);
          } catch (error) {
            console.error("Failed to load batch details for premix auto-populate:", error);
          }
        }

        const response = await qcDivisionController.fetchDivisionDetails({
          batchId,
          divisionId,
        });
        if (requestId !== divisionAutoPopulateRequestIdRef.current) return null;
        if (!response?.success) {
          setDivisionAutoPopulateData(null);
          showAlert(response?.message || messages.DETAILS_FETCH_ERROR, "error");
          return null;
        }
        const data = response.data;
        const record =
          data && typeof data === "object" && !Array.isArray(data)
            ? (data as Record<string, unknown>)
            : null;
        setDivisionAutoPopulateData(record);

        const navItems = mapDivisionDetailsToPartialNav(record ?? data, {
          flowKey: divisionFlowKey,
          rawMaterialType: typeKey,
          batchPayload,
        });
        const withStatuses = applyStatusMapsToPartialNav(navItems, {
          motorStatuses: record?.motorStatuses ?? (record as any)?.motors,
          premixStatuses: record?.premixStatuses ?? (record as any)?.premixes,
          division: divisionFlowKey,
        });
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
      activeBatch?.batchId,
      clearPartialNav,
      divisionCatalog,
      messages.DETAILS_FETCH_ERROR,
      showAlert,
    ],
  );

  const handleDivisionChange = useCallback(
    (value: string) => {
      setSelectedDivision(value);
      setSelectedRawMaterialType("");
      setSelectedProcessingType("");
      setSelectedPremixSlot("SOLID_PROCESSING");
      setSelectedPremix("");
      setSelectedMixingStage("");
      setSelectedStfMotorType("");
      setSelectedMotorId("");
      setSelectedHardwareProcesses([]);
      setSelectedCuringType("");
      setSelectedTrimmingMotorCount("");
      setTrimmingMotorReceivedDate("");
      setSelectedPostCureOperation("");
      setSelectedInhibitorType("");
      setSelectedPropellantProcess("");
      setWeightmentWeighscaleNo("");
      setWeightmentCalibrationDueDate("");
      setSchemaError(null);
      void loadDivisionAutoPopulate(value, null);
    },
    [loadDivisionAutoPopulate],
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
    setWeightmentWeighscaleNo("");
    setWeightmentCalibrationDueDate("");
    setSchemaError(null);
  }, []);

  const handleHardwareProcessesChange = useCallback((values: string[]) => {
    setSelectedHardwareProcesses(values);
    setSchemaError(null);
  }, []);

  const handleCuringTypeChange = useCallback((value: string) => {
    setSelectedCuringType(value);
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

  const handleWeightmentWeighscaleNoChange = useCallback((value: string) => {
    setWeightmentWeighscaleNo(value);
    setSchemaError(null);
  }, []);

  const handleWeightmentCalibrationDueDateChange = useCallback((value: string) => {
    setWeightmentCalibrationDueDate(value);
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
      selectedCuringType,
      selectedTrimmingMotorCount,
      trimmingMotorReceivedDate,
      selectedPostCureOperation,
      selectedInhibitorType,
      selectedPropellantProcess,
      weightmentWeighscaleNo,
      weightmentCalibrationDueDate,
      addedDivisionEntryKeys,
    }),
    [
      addedDivisionEntryKeys,
      addedPremixNumbers,
      selectedCuringType,
      selectedTrimmingMotorCount,
      trimmingMotorReceivedDate,
      selectedPostCureOperation,
      selectedInhibitorType,
      selectedPropellantProcess,
      weightmentWeighscaleNo,
      weightmentCalibrationDueDate,
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
      const pendingProcesses = getPendingHardwareProcesses(
        selectedMotorId,
        selectedHardwareProcesses,
        addedDivisionEntryKeys,
        selectedDivision,
      );
      if (!pendingProcesses.length) return;

      const additions: Array<{
        entry: QcDivisionEntry;
        schema: Awaited<ReturnType<typeof fetchQcSchemaDocument>> & object;
      }> = [];

      for (const process of pendingProcesses) {
        const result = await fetchQcSchemaDocument("HARDWARE", process);
        if (!result) return;
        additions.push({
          entry: buildEntryFromSelection(
            "HARDWARE_PROCESS",
            { division: "HARDWARE", subType: process },
            undefined,
            selectedMotorId,
          ),
          schema: result,
        });
      }

      let nextEntries = [...(formData.divisionEntries ?? [])];
      updateFormData((prev) => {
        let next = prev;
        additions.forEach(({ entry, schema }) => {
          next = appendDivisionEntryToForm(
            next,
            entry,
            { schemaValues: createQcInitialValues(schema.schema) },
            [{ schema: schema.schema, division: schema.division, subType: schema.subType }],
          );
          nextEntries = [...nextEntries, entry];
        });
        return next;
      });

      const lastEntry = additions[additions.length - 1]?.entry;
      if (lastEntry) {
        navigateToEntry(nextEntries, lastEntry.entryId);
      }
      resetFlowBarSelection();
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

      const result = await fetchQcSchemaDocument("CASTING", null);
      if (!result) return;

      const entry = buildEntryFromSelection(
        "CASTING_MOTOR",
        { division: "CASTING", subType: null },
        undefined,
        selectedMotorId,
      );
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
      return;
    }

    if (entryKind === "DE_CORING_MOTOR") {
      if (!selectedMotorId) return;

      const dedupKey = buildDivisionEntryDedupKey({
        flowKey: selectedDivision,
        kind: "DE_CORING_MOTOR",
        motorId: selectedMotorId,
      });
      if (addedDivisionEntryKeys.includes(dedupKey)) {
        showAlert(messages.DIVISION_ALREADY_ADDED, "warning");
        return;
      }

      const result = await fetchQcSchemaDocument("DE_CORING", null);
      if (!result) return;

      const entry = buildEntryFromSelection(
        "DE_CORING_MOTOR",
        { division: "DE_CORING", subType: null },
        undefined,
        selectedMotorId,
      );
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
      return;
    }

    if (entryKind === "NDT_MOTOR") {
      if (!selectedMotorId) return;

      const dedupKey = buildDivisionEntryDedupKey({
        flowKey: selectedDivision,
        kind: "NDT_MOTOR",
        motorId: selectedMotorId,
      });
      if (addedDivisionEntryKeys.includes(dedupKey)) {
        showAlert(messages.DIVISION_ALREADY_ADDED, "warning");
        return;
      }

      const result = await fetchQcSchemaDocument("NDT", null);
      if (!result) return;

      const entry = buildEntryFromSelection(
        "NDT_MOTOR",
        { division: "NDT", subType: null },
        undefined,
        selectedMotorId,
      );
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
      return;
    }

    if (entryKind === "PROPELLANT_PROCESS") {
      if (!selectedMotorId || !isQcPropellantProcessSubType(selectedPropellantProcess)) return;

      const subType = mapQcPropellantProcessToApi(selectedPropellantProcess);
      if (!subType) return;

      const dedupKey = buildDivisionEntryDedupKey({
        flowKey: selectedDivision,
        kind: "PROPELLANT_PROCESS",
        motorId: selectedMotorId,
        subType,
      });
      if (addedDivisionEntryKeys.includes(dedupKey)) {
        showAlert(messages.DIVISION_ALREADY_ADDED, "warning");
        return;
      }

      const result = await fetchQcSchemaDocument("PROPELLANT_PROPERTIES", subType);
      if (!result) return;

      const entry = buildEntryFromSelection(
        "PROPELLANT_PROCESS",
        { division: "PROPELLANT_PROPERTIES", subType },
        undefined,
        selectedMotorId,
      );
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
      return;
    }

    if (entryKind === "WEIGHTMENT_MOTOR") {
      if (
        !selectedMotorId ||
        !weightmentWeighscaleNo.trim() ||
        !weightmentCalibrationDueDate.trim()
      ) {
        return;
      }

      const dedupKey = buildDivisionEntryDedupKey({
        flowKey: selectedDivision,
        kind: "WEIGHTMENT_MOTOR",
        motorId: selectedMotorId,
      });
      if (addedDivisionEntryKeys.includes(dedupKey)) {
        showAlert(messages.DIVISION_ALREADY_ADDED, "warning");
        return;
      }

      const result = await fetchQcSchemaDocument("WEIGHTMENT", null);
      if (!result) return;

      const initialValues = {
        ...createQcInitialValues(result.schema),
        WEIGHSCALE_NO: weightmentWeighscaleNo.trim(),
        CALIBRATION_DUE_DATE: weightmentCalibrationDueDate.trim(),
      };

      const entry = buildEntryFromSelection(
        "WEIGHTMENT_MOTOR",
        { division: "WEIGHTMENT", subType: null },
        undefined,
        selectedMotorId,
        {
          weighscaleNo: weightmentWeighscaleNo.trim(),
          calibrationDueDate: weightmentCalibrationDueDate.trim(),
        },
      );
      const nextEntries = [...(formData.divisionEntries ?? []), entry];
      updateFormData((prev) =>
        appendDivisionEntryToForm(
          prev,
          entry,
          { schemaValues: initialValues },
          [{ schema: result.schema, division: result.division, subType: result.subType }],
        ),
      );
      navigateToEntry(nextEntries, entry.entryId);
      resetFlowBarSelection();
      return;
    }

    if (entryKind === "CURING_MOTOR") {
      if (!selectedMotorId || !isQcCuringSubType(selectedCuringType)) return;

      const curingSubType = mapQcCuringTypeToSubType(selectedCuringType);
      if (!curingSubType) return;

      const dedupKey = buildDivisionEntryDedupKey({
        flowKey: selectedDivision,
        kind: "CURING_MOTOR",
        motorId: selectedMotorId,
        subType: curingSubType,
      });
      if (addedDivisionEntryKeys.includes(dedupKey)) {
        showAlert(messages.DIVISION_ALREADY_ADDED, "warning");
        return;
      }

      const result = await fetchQcSchemaDocument("CURING", curingSubType);
      if (!result) return;

      const entry = buildEntryFromSelection(
        "CURING_MOTOR",
        { division: "CURING", subType: curingSubType },
        undefined,
        selectedMotorId,
      );
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
      return;
    }

    if (entryKind === "TRIMMING_MOTOR") {
      if (
        !selectedMotorId ||
        selectedTrimmingMotorCount === "" ||
        !trimmingMotorReceivedDate.trim()
      ) {
        return;
      }

      const dedupKey = buildDivisionEntryDedupKey({
        flowKey: selectedDivision,
        kind: "TRIMMING_MOTOR",
        motorId: selectedMotorId,
      });
      if (addedDivisionEntryKeys.includes(dedupKey)) {
        showAlert(messages.DIVISION_ALREADY_ADDED, "warning");
        return;
      }

      const trimmingSubType = mapQcTrimmingSubTypeToApi(resolveQcTrimmingSubType());
      const result = await fetchQcSchemaDocument("TRIMMING", trimmingSubType);
      if (!result) return;

      const entry = buildEntryFromSelection(
        "TRIMMING_MOTOR",
        { division: "TRIMMING", subType: trimmingSubType },
        undefined,
        selectedMotorId,
        {
          motorCount: Number(selectedTrimmingMotorCount),
          motorReceivedDate: trimmingMotorReceivedDate,
        },
      );
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
      return;
    }

    if (entryKind === "POST_CURE_MOTOR") {
      const selection = resolveDivisionSchemaRequest(selectedDivision, divisionFlowState);
      if (!selection || !selectedMotorId) return;

      const dedupKey = buildDivisionEntryDedupKey({
        flowKey: selectedDivision,
        kind: "POST_CURE_MOTOR",
        motorId: selectedMotorId,
        subType: selection.subType,
        inhibitorType: selection.inhibitorType,
      });
      if (addedDivisionEntryKeys.includes(dedupKey)) {
        showAlert(messages.DIVISION_ALREADY_ADDED, "warning");
        return;
      }

      const result = await fetchQcSchemaDocument(
        selection.division,
        selection.subType,
        selection.inhibitorType,
      );
      if (!result) return;

      const entry = buildEntryFromSelection(
        "POST_CURE_MOTOR",
        selection,
        undefined,
        selectedMotorId,
      );
      const nextEntries = [...(formData.divisionEntries ?? []), entry];
      updateFormData((prev) =>
        appendDivisionEntryToForm(
          prev,
          entry,
          { schemaValues: createQcInitialValues(result.schema) },
          [
            {
              schema: result.schema,
              division: result.division,
              subType: result.subType,
              inhibitorType: result.inhibitorType,
            },
          ],
        ),
      );
      navigateToEntry(nextEntries, entry.entryId);
      resetFlowBarSelection();
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

    if (entryKind === "BOTH_PREMIX" && premixNo != null) {
      const solidSelection = resolveQcSchemaSelectionForSlot("SOLID_PROCESSING");
      const liquidSelection = resolveQcSchemaSelectionForSlot("LIQUID_PROCESSING");
      const solidResult = await fetchQcSchemaDocument(solidSelection.division, solidSelection.subType);
      const liquidResult = await fetchQcSchemaDocument(liquidSelection.division, liquidSelection.subType);
      if (!solidResult || !liquidResult) return;

      const entry = buildEntryFromSelection(entryKind, solidSelection, premixNo);
      const nextEntries = [...(formData.divisionEntries ?? []), entry];
      updateFormData((prev) =>
        appendDivisionEntryToForm(
          prev,
          entry,
          {
            schemaValues: createQcInitialValues(solidResult.schema),
            liquidSchemaValues: createQcInitialValues(liquidResult.schema),
          },
          [
            { schema: solidResult.schema, division: solidResult.division, subType: solidResult.subType },
            { schema: liquidResult.schema, division: liquidResult.division, subType: liquidResult.subType },
          ],
        ),
      );
      navigateToEntry(nextEntries, entry.entryId);
      resetFlowBarSelection();
      return;
    }

    // Raw Material Revalidation uses a dedicated table UI — no schema fetch.
    // Seed from /qc-division/division-details when available; otherwise empty picker UI.
    if (entryKind === "REVALIDATION") {
      const selection = resolveDivisionSchemaRequest(selectedDivision, divisionFlowState);
      if (!selection) return;

      let autoPopulatePayload: unknown = divisionAutoPopulateData;
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
      updateFormData((prev) =>
        appendDivisionEntryToForm(
          prev,
          entry,
          { schemaValues },
          [],
        ),
      );
      navigateToEntry(nextEntries, entry.entryId);
      resetFlowBarSelection();
      return;
    }

    const selection = resolveDivisionSchemaRequest(selectedDivision, divisionFlowState);
    if (!selection) return;

    const result = await fetchQcSchemaDocument(selection.division, selection.subType);
    if (!result) return;

    const entry = buildEntryFromSelection(entryKind, selection, premixNo);

    if (entryKind === "MIXING_FINAL_MIX") {
      const isFirstFinalMix = getMixingFinalMixEntries(formData.divisionEntries).length === 0;
      const nextEntries = [...(formData.divisionEntries ?? []), entry];
      updateFormData((prev) => {
        const next = appendDivisionEntryToForm(
          prev,
          entry,
          { schemaValues: createMixingFinalMixViscosityValues(result.schema) },
          [{ schema: result.schema, division: result.division, subType: result.subType }],
        );
        if (!isFirstFinalMix) return next;
        return {
          ...next,
          mixingFinalMixDetailsValues: createMixingFinalMixDetailsValues(result.schema),
        };
      });
      if (isFirstFinalMix) {
        navigateToMixingDetails(nextEntries);
      } else {
        navigateToEntry(nextEntries, entry.entryId);
      }
      resetFlowBarSelection();
      return;
    }

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
    selectedCuringType,
    selectedTrimmingMotorCount,
    trimmingMotorReceivedDate,
    selectedPostCureOperation,
    selectedInhibitorType,
    selectedPropellantProcess,
    weightmentWeighscaleNo,
    weightmentCalibrationDueDate,
    showAlert,
    navigateToEntry,
    navigateToMixingDetails,
    resetFlowBarSelection,
  ]);

  const loadFormForPartialItem = useCallback(
    async (item: QcPartialNavItem) => {
      const flowKey = selectedDivision;
      if (!flowKey || !item) return;

      const requestId = ++partialNavLoadRequestIdRef.current;
      setPartialItemLoading(true);
      setSchemaError(null);

      try {
        const currentEntries = formDataRef.current.divisionEntries ?? [];
        const existingIds = resolveEntryIdsForPartialItem(currentEntries, item);
        if (existingIds.length) {
          navigateToEntry(currentEntries, existingIds[0]);
          return;
        }

        if (item.kind === "MOTOR" && item.motorId) {
          setSelectedMotorId(item.motorId);

          const motorLoaders: Record<
            string,
            {
              kind: NonNullable<ReturnType<typeof resolveDivisionEntryKind>>;
              division: QcApiDivision;
              subType: QcApiSubType;
            }
          > = {
            CASTING: { kind: "CASTING_MOTOR", division: "CASTING", subType: null },
            DE_CORING: { kind: "DE_CORING_MOTOR", division: "DE_CORING", subType: null },
            NDT: { kind: "NDT_MOTOR", division: "NDT", subType: null },
          };

          const loader = motorLoaders[flowKey];
          if (!loader) {
            // Motor seeded; remaining fields (curing type, hardware processes, etc.) still use FlowBar + Load form.
            return;
          }

          const dedupKey = buildDivisionEntryDedupKey({
            flowKey,
            kind: loader.kind,
            motorId: item.motorId,
          });
          if (getAddedDivisionEntryKeys(formDataRef.current.divisionEntries ?? []).includes(dedupKey)) {
            return;
          }

          const result = await fetchQcSchemaDocument(loader.division, loader.subType);
          if (!result || requestId !== partialNavLoadRequestIdRef.current) return;

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
            appendDivisionEntryToForm(
              prev,
              entry,
              { schemaValues: createQcInitialValues(result.schema) },
              [{ schema: result.schema, division: result.division, subType: result.subType }],
            ),
          );
          navigateToEntry(nextEntries, entry.entryId);
          return;
        }

        if (item.kind === "PREMIX" && item.premixNo != null) {
          setSelectedPremix(item.premixNo);

          if (flowKey === "MIXING") {
            setSelectedMixingStage("PREMIX");
            const result = await fetchQcSchemaDocument("MIXING", "PREMIX");
            if (!result || requestId !== partialNavLoadRequestIdRef.current) return;

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
              appendDivisionEntryToForm(
                prev,
                entry,
                { schemaValues: createQcInitialValues(result.schema) },
                [{ schema: result.schema, division: result.division, subType: result.subType }],
              ),
            );
            navigateToEntry(nextEntries, entry.entryId);
            return;
          }

          if (flowKey === "RAW_MATERIAL") {
            const processingType = item.processingType || selectedProcessingType || "SOLID_PROCESSING";
            setSelectedProcessingType(processingType);

            if (processingType === "BOTH") {
              const solidSelection = resolveQcSchemaSelectionForSlot("SOLID_PROCESSING");
              const liquidSelection = resolveQcSchemaSelectionForSlot("LIQUID_PROCESSING");
              const solidResult = await fetchQcSchemaDocument(
                solidSelection.division,
                solidSelection.subType,
              );
              const liquidResult = await fetchQcSchemaDocument(
                liquidSelection.division,
                liquidSelection.subType,
              );
              if (!solidResult || !liquidResult || requestId !== partialNavLoadRequestIdRef.current) {
                return;
              }
              const entry = buildEntryFromSelection(
                "BOTH_PREMIX",
                solidSelection,
                item.premixNo,
                undefined,
                undefined,
                { flowKey, processingType, rawMaterialType: selectedRawMaterialType },
              );
              const nextEntries = [...(formDataRef.current.divisionEntries ?? []), entry];
              updateFormData((prev) =>
                appendDivisionEntryToForm(
                  prev,
                  entry,
                  {
                    schemaValues: createQcInitialValues(solidResult.schema),
                    liquidSchemaValues: createQcInitialValues(liquidResult.schema),
                  },
                  [
                    {
                      schema: solidResult.schema,
                      division: solidResult.division,
                      subType: solidResult.subType,
                    },
                    {
                      schema: liquidResult.schema,
                      division: liquidResult.division,
                      subType: liquidResult.subType,
                    },
                  ],
                ),
              );
              navigateToEntry(nextEntries, entry.entryId);
              return;
            }

            const kind =
              processingType === "LIQUID_PROCESSING" ? "LIQUID_PREMIX" : "SOLID_PREMIX";
            const selection = resolveQcSchemaSelectionForSlot(
              processingType === "LIQUID_PROCESSING" ? "LIQUID_PROCESSING" : "SOLID_PROCESSING",
            );
            const result = await fetchQcSchemaDocument(selection.division, selection.subType);
            if (!result || requestId !== partialNavLoadRequestIdRef.current) return;
            const entry = buildEntryFromSelection(
              kind,
              selection,
              item.premixNo,
              undefined,
              undefined,
              { flowKey, processingType, rawMaterialType: selectedRawMaterialType },
            );
            const nextEntries = [...(formDataRef.current.divisionEntries ?? []), entry];
            updateFormData((prev) =>
              appendDivisionEntryToForm(
                prev,
                entry,
                { schemaValues: createQcInitialValues(result.schema) },
                [{ schema: result.schema, division: result.division, subType: result.subType }],
              ),
            );
            navigateToEntry(nextEntries, entry.entryId);
          }
          return;
        }

        if (item.kind === "FINAL_MIX") {
          const mixNo = item.finalMixNo ?? item.premixNo;
          if (mixNo == null || flowKey !== "MIXING") return;
          setSelectedMixingStage("FINAL_MIX");
          setSelectedPremix(mixNo);

          const result = await fetchQcSchemaDocument("MIXING", "FINAL_MIX");
          if (!result || requestId !== partialNavLoadRequestIdRef.current) return;

          const entry = buildEntryFromSelection(
            "MIXING_FINAL_MIX",
            { division: "MIXING", subType: "FINAL_MIX" },
            mixNo,
            undefined,
            undefined,
            { flowKey, mixingStage: "FINAL_MIX" },
          );
          const isFirstFinalMix =
            getMixingFinalMixEntries(formDataRef.current.divisionEntries).length === 0;
          const nextEntries = [...(formDataRef.current.divisionEntries ?? []), entry];
          updateFormData((prev) => {
            const next = appendDivisionEntryToForm(
              prev,
              entry,
              { schemaValues: createMixingFinalMixViscosityValues(result.schema) },
              [{ schema: result.schema, division: result.division, subType: result.subType }],
            );
            if (!isFirstFinalMix) return next;
            return {
              ...next,
              mixingFinalMixDetailsValues: createMixingFinalMixDetailsValues(result.schema),
            };
          });
          if (isFirstFinalMix) {
            navigateToMixingDetails(nextEntries);
          } else {
            navigateToEntry(nextEntries, entry.entryId);
          }
        }
      } finally {
        if (requestId === partialNavLoadRequestIdRef.current) {
          setPartialItemLoading(false);
        }
      }
    },
    [
      buildEntryFromSelection,
      fetchQcSchemaDocument,
      navigateToEntry,
      navigateToMixingDetails,
      selectedDivision,
      selectedProcessingType,
      selectedRawMaterialType,
      updateFormData,
    ],
  );

  const handlePartialNavIndexChange = useCallback(
    (index: number) => {
      setActivePartialNavIndex(index);
      const item = partialNavItems[index];
      if (item) {
        void loadFormForPartialItem(item);
      }
    },
    [loadFormForPartialItem, partialNavItems],
  );

  useEffect(() => {
    if (!hasPartialChildNav(partialNavItems)) return;
    const seedKey = partialNavItems.map((item) => item.id).join("|");
    if (!seedKey || seedKey === partialNavSeedKeyRef.current) return;
    partialNavSeedKeyRef.current = seedKey;
    setActivePartialNavIndex(0);
    void loadFormForPartialItem(partialNavItems[0]);
  }, [loadFormForPartialItem, partialNavItems]);

  const handleDivisionEntryValuesChange = useCallback((entryId: string, values: SchemaFormValues) => {
    setDivisionEntryValues((prev) => ({
      ...prev,
      [entryId]: {
        ...(prev[entryId] ?? { schemaValues: {} }),
        schemaValues: values,
      },
    }));
    markFormDirty();
  }, [markFormDirty]);

  const handleMixingFinalMixDetailsChange = useCallback((values: SchemaFormValues) => {
    setMixingFinalMixDetailsValues(values);
    markFormDirty();
  }, [markFormDirty]);

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
        mixingFinalMixDetailsValues: hasFinalMixEntries ? prev.mixingFinalMixDetailsValues : undefined,
        schemaFormLoaded: nextEntries.length > 0,
        qcSchema: nextEntries.length > 0 ? prev.qcSchema : null,
        division: nextEntries.length > 0 ? prev.division : null,
        subType: nextEntries.length > 0 ? prev.subType : null,
      };
    });
  }, []);

  const handleFormValuesChange = useCallback((values: SchemaFormValues) => {
    setFormBase((prev) => ({ ...prev, schemaFormValues: values }));
    markFormDirty();
  }, [markFormDirty]);

  const openFormWithResolvedData = useCallback(
    async (batch: QCBatch, editMode: boolean, options?: { forDetails?: boolean }): Promise<boolean> => {
      const shouldFetchDetails =
        editMode ||
        batch.qcStatus === QUALITY_CONTROL_STATUS.IN_PROGRESS ||
        batch.qcStatus === QUALITY_CONTROL_STATUS.REJECTED;

      let resolvedData = createDefaultQualityControlFormState();
      let resolvedFormId = batch.formId ?? null;
      let rejectionReason = batch.rejectionReason ?? null;
      let initialDivision = "";
      const flowSelection = resolveBatchFlowSelection(batch.division, batch.subType);
      let initialRawMaterialType = flowSelection.rawMaterialType;
      let initialProcessingType = flowSelection.processingType;
      let fetchedDetailsPayload: Record<string, unknown> | null = null;

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

        const rawDivisionDetails = detailsResponse.data?.divisionDetails;
        const hasDivisionDetails = Array.isArray(rawDivisionDetails) && rawDivisionDetails.length > 0;

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

          const enqueueSchema = (
            division: QcApiDivision,
            subType: QcApiSubType,
            inhibitorType?: QcInhibitorType,
          ) => {
            // MIXING schemas require PREMIX/FINAL_MIX; other divisions may legitimately use null subType.
            if (division === "MIXING" && subType == null) return "";
            const key = getQcSchemaCacheKey(division, subType, inhibitorType);
            if (!schemaFetchQueue.has(key)) {
              schemaFetchQueue.set(key, { division, subType, inhibitorType });
            }
            return key;
          };

          const getEntryKind = (division: QcApiDivision, subType: QcApiSubType): { flowKey: string; kind: QcDivisionEntry["kind"] } => {
            if (division === "RAW_MATERIAL_REVALIDATION") return { flowKey: "RAW_MATERIAL", kind: "REVALIDATION" };
            if (division === "RAW_MATERIAL_PROCESSING") {
              const kind = subType === "SOLID_PROCESSING" ? "SOLID_PREMIX" : subType === "LIQUID_PROCESSING" ? "LIQUID_PREMIX" : "BOTH_PREMIX";
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
            if (division === "POST_CURE") return { flowKey: "POST_CURE", kind: "POST_CURE_MOTOR" };
            if (division === "NDT") return { flowKey: "NDT", kind: "NDT_MOTOR" };
            if (division === "PROPELLANT_PROPERTIES") {
              return { flowKey: "QC", kind: "PROPELLANT_PROCESS" };
            }
            if (division === "WEIGHTMENT") return { flowKey: "WEIGHTMENT", kind: "WEIGHTMENT_MOTOR" };
            if (division === "STATIC_TEST_FACILITY") {
              return { flowKey: "STATIC_TEST_FACILITY", kind: "STF" };
            }
            return { flowKey: division, kind: "SIMPLE" };
          };

          const rawMaterialTypeForLabel = (division: QcApiDivision, _subType: QcApiSubType): string => {
            if (division === "RAW_MATERIAL_REVALIDATION") return "RAW_MATERIAL_REVALIDATION";
            if (division === "RAW_MATERIAL_PROCESSING") return "RAW_MATERIAL_PROCESSING";
            return "";
          };

          const processingTypeForLabel = (_division: QcApiDivision, subType: QcApiSubType): string => {
            if (subType === "SOLID_PROCESSING" || subType === "LIQUID_PROCESSING") return subType;
            return "";
          };

          for (const detail of rawDivisionDetails) {
            const division = detail.division as QcApiDivision;
            const detailSubType = detail.subType as QcApiSubType;
            const sections: SchemaSectionSubmission[] = detail.data?.sections ?? [];

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
              const grouped = groupMixingDetailSections(sections, detailSubType);
              grouped.schemaSubTypes.forEach((subType) => enqueueSchema(division, subType));

              grouped.premixEntries.forEach(({ premixNo, sections: preSections }) => {
                const { entryId } = makeEntry("MIXING_PREMIX", "PREMIX", preSections, premixNo);
                entryValues[entryId] = { schemaValues: {} };
              });

              grouped.finalMixEntries.forEach(({ premixNo, sections: visSections }) => {
                const { entryId } = makeEntry("MIXING_FINAL_MIX", "FINAL_MIX", visSections, premixNo);
                entryValues[entryId] = { schemaValues: {} };
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
                const sectionSubType = (section.subType ?? detailSubType) as QcApiSubType;
                const sectionInhibitorType = resolveQcSectionInhibitorType(
                  division,
                  sectionSubType,
                  (section as { inhibitorType?: string }).inhibitorType,
                );
                enqueueSchema(division, sectionSubType, sectionInhibitorType);
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
              } else if (!entryValues[entry.entryId]?.schemaValues ||
                Object.keys(entryValues[entry.entryId].schemaValues).length === 0) {
                entryValues[entry.entryId] = {
                  schemaValues: createInitialRevalidationSchemaValues(),
                };
              }
              continue;
            }

            const cacheKey = getQcSchemaCacheKey(entry.apiDivision, entry.subType, entry.inhibitorType);
            const schema = schemasByKey[cacheKey];
            if (!schema) continue;

            const sectionsToHydrate =
              entry.savedSections ??
              (resolvedData.savedSections ?? []).filter((s) => {
                if (entry.kind === "REVALIDATION" && s.sectionId !== "RAW_MATERIAL_DETAILS") return false;
                if (entry.kind === "MIXING_PREMIX" && s.sectionId !== QC_MIXING_PREMIX_SECTION_ID) return false;
                if (entry.kind === "MIXING_FINAL_MIX" && s.sectionId !== QC_MIXING_VISCOSITY_SECTION_ID) return false;
                if (entry.kind === "HARDWARE_PROCESS" && entry.subType) {
                  const expectedSectionId = getHardwareSectionIdForSubType(String(entry.subType));
                  if (expectedSectionId && s.sectionId !== expectedSectionId) return false;
                }
                if (entry.premixNo != null) {
                  if (s.premixNo !== entry.premixNo) return false;
                  if (entry.subType && (s as any).subType && (s as any).subType !== entry.subType) return false;
                  return true;
                }
                if (entry.motorId != null) {
                  if ((s as { motorId?: string }).motorId !== entry.motorId) return false;
                  if (entry.subType && (s as { subType?: string }).subType && (s as { subType?: string }).subType !== entry.subType) {
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
              const hydrationSchema =
                entry.kind === "MIXING_FINAL_MIX"
                  ? sliceMixingFinalMixSchema(schema, "viscosity") ?? schema
                  : schema;
              entryValues[entry.entryId] = {
                schemaValues: hydrateQcValuesFromSections(hydrationSchema, sectionsToHydrate),
              };
            }
          }

          const finalMixSchema = schemasByKey[getQcSchemaCacheKey("MIXING", "FINAL_MIX")];
          const mixingFinalMixDetailsValues =
            finalMixSchema && mixingFinalMixDetailSections.length
              ? hydrateMixingFinalMixDetailsValues(finalMixSchema, mixingFinalMixDetailSections)
              : undefined;

          resolvedData = {
            ...resolvedData,
            divisionEntries: entries,
            divisionEntryValues: entryValues,
            schemasByKey,
            ...(mixingFinalMixDetailsValues && { mixingFinalMixDetailsValues }),
          };
        } else {
          const resolvedFlow = resolveBatchFlowSelection(resolvedData.division, resolvedData.subType);
          initialRawMaterialType = resolvedFlow.rawMaterialType;
          initialProcessingType = resolvedFlow.processingType;

          if (resolvedData.schemaFormLoaded && resolvedData.division) {
            const schemasToLoad: Array<{ division: QcApiDivision; subType: QcApiSubType }> = [];

            if (isRawMaterialRevalidationType(initialRawMaterialType)) {
              // Dedicated table UI — no schema document required.
            } else if (initialProcessingType === "SOLID_PROCESSING") {
              schemasToLoad.push({ division: "RAW_MATERIAL_PROCESSING", subType: "SOLID_PROCESSING" });
            } else if (initialProcessingType === "LIQUID_PROCESSING") {
              schemasToLoad.push({ division: "RAW_MATERIAL_PROCESSING", subType: "LIQUID_PROCESSING" });
            } else if (isBothProcessingType(initialProcessingType)) {
              schemasToLoad.push(
                { division: "RAW_MATERIAL_PROCESSING", subType: "SOLID_PROCESSING" },
                { division: "RAW_MATERIAL_PROCESSING", subType: "LIQUID_PROCESSING" },
              );
            }

            for (const schemaSelection of schemasToLoad) {
              const cacheKey = getQcSchemaCacheKey(schemaSelection.division, schemaSelection.subType);
              if (!resolvedData.schemasByKey?.[cacheKey]) {
                const result = await fetchQcSchemaDocument(schemaSelection.division, schemaSelection.subType);
                if (result) {
                  updateFormData((prev) =>
                    hydrateQualityControlFormState(prev, result.schema, result.division, result.subType),
                  );
                }
              }
            }
          }
        }

        resolvedFormId = detailsResponse.data.formId || resolvedFormId;
        rejectionReason =
          detailsResponse.data.workflowInsights?.rejectionReason ?? rejectionReason;
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
          nextMap[key] = String(entry?.status ?? "TO_BE_INITIATED")
            .trim()
            .toUpperCase()
            .replace(/\s+/g, "_") as QcPartialItemStatus;
        });
        setDivisionStatusByFlowKey(nextMap);
      }

      if (detailsPayload && Array.isArray(detailsPayload.divisionDetails)) {
        const firstDetail = detailsPayload.divisionDetails[0];
        const flowKey = String(initialDivision || firstDetail?.division || "").trim();
        if (flowKey) {
          const navFromDetails = mapDivisionDetailsToPartialNav(
            {
              data: firstDetail?.data ?? {},
              motors: detailsPayload.motorStatuses,
              premixes: detailsPayload.premixStatuses,
            },
            {
              flowKey,
              rawMaterialType: initialRawMaterialType,
            },
          );
          if (navFromDetails.length) {
            setPartialNavItems(
              applyStatusMapsToPartialNav(navFromDetails, {
                motorStatuses: detailsPayload.motorStatuses,
                premixStatuses: detailsPayload.premixStatuses,
                division: String(firstDetail?.division ?? ""),
              }),
            );
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
    setReadOnly(false);
    await openFormWithResolvedData(batch, false);
  };

  const handleEditForm = async (batch: QCBatch) => {
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

  const handleDiscardAndBack = () => {
    setBackConfirmOpen(false);
    bumpBatchRefresh();
    resetFormContext();
  };

  const submitUnit = async (intent: "draft" | "submit") => {
    if (!activeBatch) return false;

    if (!subDepartmentId) {
      showAlert(messages.SUB_DEPARTMENT_MISSING, "error");
      return false;
    }

    const activePartialItem = hasPartialChildNav(partialNavItems)
      ? partialNavItems[activePartialNavIndex] ?? null
      : null;

    if (activePartialItem && isPartialItemReadOnly(activePartialItem.status)) {
      showAlert(messages.EMPTY_FORM_ERROR, "warning");
      return false;
    }

    const submitFormState = activePartialItem
      ? scopeFormStateToPartialItem(formDataRef.current, activePartialItem)
      : formDataRef.current;

    if (!hasDivisionEntries(submitFormState) && !submitFormState.schemaFormLoaded) {
      showAlert(messages.EMPTY_FORM_ERROR, "warning");
      return false;
    }

    if (!hasAnyQualityControlValue(submitFormState)) {
      showAlert(messages.EMPTY_FORM_ERROR, "warning");
      return false;
    }

    const unitSubmissionType = intent === "draft" ? "DRAFT" : "SUBMIT";
    // Unit saves always keep root formSubmissionType as DRAFT (Case Prep / RMP pattern).
    const formSubmissionType = "DRAFT" as const;
    const payload = mapQualityControlPayload(submitFormState, {
      unitSubmissionType,
      ...(activePartialItem
        ? {}
        : intent === "submit"
          ? { divisionSubmissionType: "SUBMIT" as const }
          : { divisionSubmissionType: "DRAFT" as const }),
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

      if (activePartialItem) {
        const nextStatus = intent === "draft" ? "IN_PROGRESS" : "WAITING_FOR_APPROVAL";
        setPartialNavItems((prev) => {
          const updated = updatePartialNavStatus(prev, activePartialItem.id, nextStatus);
          return applyStatusMapsToPartialNav(updated, {
            motorStatuses: (response.data as any)?.motorStatuses,
            premixStatuses: (response.data as any)?.premixStatuses,
            division: String(formData.division ?? selectedDivision ?? ""),
          });
        });
      }

      if (Array.isArray((response.data as any)?.divisionStatuses)) {
        const nextMap: Record<string, QcPartialItemStatus> = {};
        (response.data as any).divisionStatuses.forEach((entry: any) => {
          const key = String(entry?.division ?? "").trim();
          if (!key) return;
          nextMap[key] = String(entry?.status ?? "TO_BE_INITIATED")
            .trim()
            .toUpperCase()
            .replace(/\s+/g, "_") as QcPartialItemStatus;
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
    if (!areAllPartialItemsApproved(partialNavItems) && hasPartialChildNav(partialNavItems)) {
      showAlert(messages.DIVISION_APPROVAL_NOT_READY, "warning");
      return false;
    }

    const division =
      (formData.division as QcApiDivision | null) ??
      (selectedDivision as QcApiDivision | null);
    if (!division) {
      showAlert(messages.EMPTY_FORM_ERROR, "warning");
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

    const payload = mapQualityControlDivisionSubmitPayload({
      division,
      subType: formData.subType,
    });

    setActionLoading(true);
    try {
      const response = await qcDivisionController.updateForm({
        formId: activeBatch.formId,
        batchId: activeBatch.batchId,
        subDepartmentId,
        formSubmissionType: "DRAFT",
        ...payload,
      });

      if (!response?.success) {
        showAlert(getErrorMessage(response, messages.DIVISION_SUBMIT_FAILED), "error");
        return false;
      }

      setDivisionStatusByFlowKey((prev) => ({
        ...prev,
        [String(selectedDivision || division)]: "WAITING_FOR_APPROVAL",
      }));

      if (Array.isArray((response.data as any)?.divisionStatuses)) {
        const nextMap: Record<string, QcPartialItemStatus> = {};
        (response.data as any).divisionStatuses.forEach((entry: any) => {
          const key = String(entry?.division ?? "").trim();
          if (!key) return;
          nextMap[key] = String(entry?.status ?? "WAITING_FOR_APPROVAL")
            .trim()
            .toUpperCase()
            .replace(/\s+/g, "_") as QcPartialItemStatus;
        });
        setDivisionStatusByFlowKey((prev) => ({ ...prev, ...nextMap }));
      }

      showAlert(messages.DIVISION_SUBMIT_SUCCESS, "success", { autoCloseMs: 2200 });
      await listParams.refreshUserBatches();
      return true;
    } finally {
      setActionLoading(false);
    }
  }, [
    activeBatch,
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
    ? partialNavItems[activePartialNavIndex] ?? null
    : null;
  const isActivePartialReadOnly = Boolean(
    activePartialItem && isPartialItemReadOnly(activePartialItem.status),
  );

  const divisionGroupStatusByFlowKey = useMemo(() => {
    const map: Record<string, QcPartialItemStatus> = { ...divisionStatusByFlowKey };
    if (partialNavActive && selectedDivision && partialNavItems.length) {
      map[selectedDivision] = aggregatePartialNavStatus(partialNavItems);
    }
    return map;
  }, [divisionStatusByFlowKey, partialNavActive, partialNavItems, selectedDivision]);

  const divisionLabel =
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

  const finalApprovalRows = useMemo(() => {
    const divisions: Array<{
      divisionLabel: string;
      divisionStatus?: QcPartialItemStatus;
      units: QcPartialNavItem[];
    }> = [];

    if (selectedDivision) {
      divisions.push({
        divisionLabel,
        divisionStatus: divisionGroupStatusByFlowKey[selectedDivision],
        units: partialNavItems,
      });
    }

    Object.entries(divisionStatusByFlowKey).forEach(([key, status]) => {
      if (key === selectedDivision) return;
      const label =
        divisionOptions.find((option) => option.value === key)?.label || key;
      divisions.push({
        divisionLabel: label,
        divisionStatus: status,
        units: [],
      });
    });

    return buildFinalApprovalRows(divisions);
  }, [
    divisionGroupStatusByFlowKey,
    divisionLabel,
    divisionOptions,
    divisionStatusByFlowKey,
    partialNavItems,
    selectedDivision,
  ]);

  const canProceedFinalApproval = useMemo(() => {
    if (!finalApprovalRows.length) return false;
    if (Object.keys(divisionStatusByFlowKey).length > 0) {
      return Object.values(divisionStatusByFlowKey).every((status) => status === "APPROVED");
    }
    return areAllFinalApprovalRowsApproved(finalApprovalRows);
  }, [divisionStatusByFlowKey, finalApprovalRows]);

  const scopedFormData = useMemo(
    () =>
      activePartialItem
        ? scopeFormStateToPartialItem(formData, activePartialItem)
        : formData,
    [activePartialItem, formData],
  );


  return {
    ...listParams,
    loading: listParams.loading,
    view,
    activeBatch,
    isEditMode,
    readOnly,
    formData,
    scopedFormData,
    isFormDirty: isFormDirtyForView,
    selectedDivision,
    divisionOptions,
    divisionsLoading,
    rawMaterialTypeOptions,
    selectedRawMaterialType,
    selectedProcessingType,
    selectedPremixSlot,
    selectedPremix,
    selectedMixingStage,
    selectedStfMotorType,
    selectedMotorId,
    selectedHardwareProcesses,
    selectedCuringType,
    selectedTrimmingMotorCount,
    trimmingMotorReceivedDate,
    selectedPostCureOperation,
    selectedInhibitorType,
    selectedPropellantProcess,
    weightmentWeighscaleNo,
    weightmentCalibrationDueDate,
    addedPremixNumbers,
    addedDivisionEntryKeys,
    activeDivisionGroupIndex,
    activeDivisionSubIndex,
    loadingFormDetails,
    schemaLoading: schemaLoading || partialItemLoading || divisionAutoPopulateLoading,
    schemaError,
    divisionAutoPopulateData,
    divisionAutoPopulateLoading,
    partialNavItems,
    activePartialNavIndex,
    partialNavActive,
    activePartialItem,
    isActivePartialReadOnly,
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
    handleRawMaterialTypeChange,
    handleProcessingTypeChange,
    handlePremixSlotChange,
    handlePremixChange,
    handleMixingStageChange,
    handleStfMotorTypeChange,
    handleMotorIdChange,
    handleHardwareProcessesChange,
    handleCuringTypeChange,
    handleTrimmingMotorCountChange,
    handleTrimmingMotorReceivedDateChange,
    handlePostCureOperationChange,
    handleInhibitorTypeChange,
    handlePropellantProcessChange,
    handleWeightmentWeighscaleNoChange,
    handleWeightmentCalibrationDueDateChange,
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
    finalApprovalRows,
  };
};

export default useQCDivisionHook;
