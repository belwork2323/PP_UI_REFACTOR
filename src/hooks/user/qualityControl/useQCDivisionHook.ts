import { useCallback, useMemo, useState } from "react";
import { STRINGS } from "../../../app/config/strings";
import { useAlertStore } from "../../../app/store/alertStore";
import { useAuthStore } from "../../../app/store/authStore";
import { useUserBatchRefreshStore } from "../../../app/store/userBatchRefreshStore";
import qcDivisionController from "../../../controllers/user/quality_control/qcDivisionController";
import { QCDivisionDetailsModel } from "../../../data/models/user/QCDivisionApiModel";
import {
  createDefaultQualityControlFormState,
  hasAnyQualityControlValue,
  hydrateQualityControlFormState,
  mapQualityControlPayload,
  type QualityControlFormState,
} from "../../../data/models/user/QualityControlFormModel";
import { createQcInitialValues, fetchQcSchema, hydrateQcValuesFromSections } from "../../../schema-engine/adapters/qc.adapter";
import type { QcApiDivision, QcApiSubType, QcInhibitorType } from "../../../schema-engine/adapters/qc.adapter";
import type { SchemaDocumentV2, SchemaFormValues, SchemaSectionSubmission } from "../../../schema-engine";
import {
  getQcSchemaCacheKey,
  resolveBatchFlowSelection,
  resolveQcSchemaSelectionForSlot,
  type QCBatch,
} from "./qcFlowConfig";
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
  createDivisionEntryId,
  getAddedDivisionEntryKeys,
  getAddedPremixNumbersForPicker,
  resolveDivisionEntryKind,
} from "./qcDivisionEntries";
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
import { getPendingHardwareProcesses } from "./qcHardwareConfig";
import {
  isQcPropellantProcessSubType,
  mapQcPropellantProcessToApi,
} from "./qcPropellantConfig";
import {
  mapQcTrimmingSubTypeToApi,
  resolveQcTrimmingSubType,
} from "./qcTrimmingConfig";
import {
  createMixingFinalMixDetailsValues,
  createMixingFinalMixViscosityValues,
  getMixingFinalMixEntries,
  isQcMixingStage,
} from "./qcMixingConfig";
import { useSubdepartmentBatches } from "../useSubdepartmentBatches";
import { QUALITY_CONTROL_STATUS } from "./qualityControlWorkflowData";

type WorkflowView = "list" | "form" | "details";

const normalizeBatch = (batch: any): QCBatch => ({
  ...batch,
  lotId: batch?.lotId ?? batch?.batchId ?? "",
  qcStatus: batch?.qcStatus ?? batch?.qcDivStatus ?? batch?.status ?? QUALITY_CONTROL_STATUS.INITIATED,
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
  const [formData, setFormData] = useState<QualityControlFormState>(
    createDefaultQualityControlFormState(),
  );
  const [initialSnapshot, setInitialSnapshot] = useState(
    JSON.stringify({
      formData: createDefaultQualityControlFormState(),
      selectedDivision: "",
      selectedRawMaterialType: "",
      selectedProcessingType: "",
      selectedPremixSlot: "SOLID_PROCESSING",
      selectedPremix: "",
      selectedMixingStage: "",
      selectedStfMotorType: "",
      selectedMotorId: "",
      selectedHardwareProcesses: [],
      selectedCuringType: "",
      selectedTrimmingMotorCount: "",
      trimmingMotorReceivedDate: "",
      selectedPostCureOperation: "",
      selectedInhibitorType: "",
      selectedPropellantProcess: "",
      weightmentWeighscaleNo: "",
      weightmentCalibrationDueDate: "",
    }),
  );
  const [selectedDivision, setSelectedDivision] = useState("");
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

  const batches = useMemo(
    () => (listParams.batches ?? []).map(normalizeBatch),
    [listParams.batches],
  );

  const addedDivisionEntryKeys = useMemo(
    () => getAddedDivisionEntryKeys(formData.divisionEntries),
    [formData.divisionEntries],
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
      getAddedPremixNumbersForPicker(formData.divisionEntries, {
        flowKey: selectedDivision,
        rawMaterialType: selectedRawMaterialType,
        processingType: selectedProcessingType,
        mixingStage: selectedMixingStage,
        selectedPremix,
        stfMotorType: selectedStfMotorType,
      }),
    [
      formData.divisionEntries,
      selectedDivision,
      selectedMixingStage,
      selectedPremix,
      selectedProcessingType,
      selectedRawMaterialType,
      selectedStfMotorType,
    ],
  );

  const formSnapshot = useMemo(
    () =>
      JSON.stringify({
        formData,
        selectedDivision,
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
        activeDivisionGroupIndex,
        activeDivisionSubIndex,
      }),
    [
      formData,
      activeDivisionGroupIndex,
      activeDivisionSubIndex,
      selectedDivision,
      selectedHardwareProcesses,
      selectedCuringType,
      selectedMixingStage,
      selectedMotorId,
      selectedPremix,
      selectedPremixSlot,
      selectedProcessingType,
      selectedRawMaterialType,
      selectedStfMotorType,
      selectedTrimmingMotorCount,
      trimmingMotorReceivedDate,
      selectedPostCureOperation,
      selectedInhibitorType,
      selectedPropellantProcess,
      weightmentWeighscaleNo,
      weightmentCalibrationDueDate,
    ],
  );

  const isFormDirty = useMemo(
    () => view === "form" && formSnapshot !== initialSnapshot,
    [view, formSnapshot, initialSnapshot],
  );

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
    setFormData(defaults);
    setInitialSnapshot(
      JSON.stringify({
        formData: defaults,
        selectedDivision: "",
        selectedRawMaterialType: "",
        selectedProcessingType: "",
        selectedPremixSlot: "SOLID_PROCESSING",
        selectedPremix: "",
        selectedMixingStage: "",
        selectedStfMotorType: "",
        selectedMotorId: "",
        selectedHardwareProcesses: [],
        selectedCuringType: "",
        selectedTrimmingMotorCount: "",
        trimmingMotorReceivedDate: "",
      }),
    );
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
  }, []);

  const getErrorMessage = (response: any, fallbackMessage: string) => {
    if (response?.error?.details) return response.error.details;
    if (response?.message) return response.message;
    return fallbackMessage;
  };

  const fetchQcSchemaDocument = useCallback(
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
      const cached = formData.schemasByKey?.[cacheKey];
      if (cached) return { schema: cached, division, subType, inhibitorType };

      setSchemaLoading(true);
      setSchemaError(null);
      try {
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
        return { schema: response.data, division, subType, inhibitorType };
      } finally {
        setSchemaLoading(false);
      }
    },
    [formData.schemasByKey, messages.SCHEMA_FETCH_ERROR, messages.SUB_DEPARTMENT_MISSING, showAlert, subDepartmentId],
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
  }, []);

  const handleDivisionChange = useCallback((value: string) => {
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
  }, []);

  const handleRawMaterialTypeChange = useCallback((value: string) => {
    setSelectedRawMaterialType(value);
    setSelectedProcessingType("");
    setSelectedPremixSlot("SOLID_PROCESSING");
    setSelectedPremix("");
    setSchemaError(null);
  }, []);

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
    ): QcDivisionEntry => {
      const entryId = createDivisionEntryId();
      return {
        entryId,
        flowKey: selectedDivision,
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
          flowKey: selectedDivision,
          kind,
          rawMaterialType: selectedRawMaterialType,
          processingType: selectedProcessingType,
          premixNo,
          motorId,
          subType: selection.subType,
          mixingStage: isQcMixingStage(selectedMixingStage) ? selectedMixingStage : undefined,
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
      setFormData((prev) => {
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
      setFormData((prev) =>
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
      setFormData((prev) =>
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
      setFormData((prev) =>
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
      setFormData((prev) =>
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
      setFormData((prev) =>
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

      const dedupKey = buildDivisionEntryDedupKey({
        flowKey: selectedDivision,
        kind: "CURING_MOTOR",
        motorId: selectedMotorId,
      });
      if (addedDivisionEntryKeys.includes(dedupKey)) {
        showAlert(messages.DIVISION_ALREADY_ADDED, "warning");
        return;
      }

      const curingSubType = mapQcCuringTypeToSubType(selectedCuringType);
      if (!curingSubType) return;

      const result = await fetchQcSchemaDocument("CURING", curingSubType);
      if (!result) return;

      const entry = buildEntryFromSelection(
        "CURING_MOTOR",
        { division: "CURING", subType: curingSubType },
        undefined,
        selectedMotorId,
      );
      const nextEntries = [...(formData.divisionEntries ?? []), entry];
      setFormData((prev) =>
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
      setFormData((prev) =>
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
      setFormData((prev) =>
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
      setFormData((prev) =>
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

    const selection = resolveDivisionSchemaRequest(selectedDivision, divisionFlowState);
    if (!selection) return;

    const result = await fetchQcSchemaDocument(selection.division, selection.subType);
    if (!result) return;

    const entry = buildEntryFromSelection(entryKind, selection, premixNo);

    if (entryKind === "MIXING_FINAL_MIX") {
      const isFirstFinalMix = getMixingFinalMixEntries(formData.divisionEntries).length === 0;
      const nextEntries = [...(formData.divisionEntries ?? []), entry];
      setFormData((prev) => {
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
    setFormData((prev) =>
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

  const handleDivisionEntryValuesChange = useCallback((entryId: string, values: SchemaFormValues) => {
    setFormData((prev) => ({
      ...prev,
      divisionEntryValues: {
        ...(prev.divisionEntryValues ?? {}),
        [entryId]: {
          ...(prev.divisionEntryValues?.[entryId] ?? { schemaValues: {} }),
          schemaValues: values,
        },
      },
    }));
  }, []);

  const handleMixingFinalMixDetailsChange = useCallback((values: SchemaFormValues) => {
    setFormData((prev) => ({
      ...prev,
      mixingFinalMixDetailsValues: values,
    }));
  }, []);

  const handleDivisionEntryLiquidValuesChange = useCallback(
    (entryId: string, values: SchemaFormValues) => {
      setFormData((prev) => ({
        ...prev,
        divisionEntryValues: {
          ...(prev.divisionEntryValues ?? {}),
          [entryId]: {
            ...(prev.divisionEntryValues?.[entryId] ?? { schemaValues: {} }),
            liquidSchemaValues: values,
          },
        },
      }));
    },
    [],
  );

  const handleRemoveDivisionEntry = useCallback((entryId: string) => {
    setFormData((prev) => {
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
    setFormData((prev) => ({ ...prev, schemaFormValues: values }));
  }, []);

  const openFormWithResolvedData = useCallback(
    async (batch: QCBatch, editMode: boolean) => {
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

      if (shouldFetchDetails) {
        if (!subDepartmentId) {
          showAlert(messages.SUB_DEPARTMENT_MISSING, "error");
          return;
        }
        if (!resolvedFormId) {
          showAlert(messages.FORM_ID_MISSING, "error");
          return;
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
          return;
        }

        const rawDivisionDetails = detailsResponse.data?.divisionDetails;
        const hasDivisionDetails = Array.isArray(rawDivisionDetails) && rawDivisionDetails.length > 0;

        if (hasDivisionDetails && subDepartmentId) {
          resolvedData = QCDivisionDetailsModel.toFormState(detailsResponse.data!);

          const entries: QcDivisionEntry[] = [];
          const entryValues: Record<string, QcDivisionEntryValues> = {};
          const schemasByKey: Record<string, SchemaDocumentV2> = {};
          const schemaFetchQueue = new Map<string, { division: QcApiDivision; subType: QcApiSubType }>();

          const enqueueSchema = (division: QcApiDivision, subType: QcApiSubType) => {
            const key = getQcSchemaCacheKey(division, subType);
            if (!schemaFetchQueue.has(key)) {
              schemaFetchQueue.set(key, { division, subType });
            }
            return key;
          };

          const getEntryKind = (division: QcApiDivision, subType: QcApiSubType): { flowKey: string; kind: QcDivisionEntry["kind"] } => {
            if (division === "RAW_MATERIAL_REVALIDATION") return { flowKey: "RAW_MATERIAL", kind: "REVALIDATION" };
            if (division === "RAW_MATERIAL_PROCESSING") {
              const kind = subType === "SOLID_PROCESSING" ? "SOLID_PREMIX" : subType === "LIQUID_PROCESSING" ? "LIQUID_PREMIX" : "BOTH_PREMIX";
              return { flowKey: "RAW_MATERIAL", kind };
            }
            if (division === "MIXING") return { flowKey: "MIXING", kind: "MIXING_PREMIX" };
            if (division === "HARDWARE") return { flowKey: "HARDWARE", kind: "HARDWARE_PROCESS" };
            if (division === "CASTING") return { flowKey: "CASTING", kind: "CASTING_MOTOR" };
            if (division === "CURING") return { flowKey: "CURING", kind: "CURING_MOTOR" };
            if (division === "TRIMMING") return { flowKey: "TRIMMING", kind: "TRIMMING_MOTOR" };
            if (division === "DE_CORING") return { flowKey: "DE_CORING", kind: "DE_CORING_MOTOR" };
            if (division === "POST_CURE") return { flowKey: "POST_CURE", kind: "POST_CURE_MOTOR" };
            if (division === "NDT") return { flowKey: "NDT", kind: "NDT_MOTOR" };
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
              } else if ((section as any).motorId) {
                enqueueSchema(division, detailSubType);
                const mId = (section as any).motorId as string;
                const list = sectionsByMotor.get(mId) ?? [];
                list.push(section);
                sectionsByMotor.set(mId, list);
              } else {
                enqueueSchema(division, detailSubType);
                simpleSections.push(section);
              }
            }

            const makeEntry = (
              entryKind: QcDivisionEntry["kind"],
              entrySubType: QcApiSubType,
              entrySections: SchemaSectionSubmission[],
              premixNo?: number,
              motorId?: string,
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
                ...(premixNo != null && { premixNo }),
                ...(motorId && { motorId }),
              };
              entries.push(entry);
              return { entryId, entry, entrySections };
            };

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
              for (const [motorId, motSections] of sectionsByMotor) {
                const { kind } = getEntryKind(division, detailSubType);
                const { entryId } = makeEntry(kind, detailSubType, motSections, undefined, motorId);
                entryValues[entryId] = { schemaValues: {} };
              }
            } else {
              const { kind } = getEntryKind(division, detailSubType);
              const { entryId } = makeEntry(kind, detailSubType, simpleSections);
              entryValues[entryId] = { schemaValues: {} };
            }
          }

          for (const [, request] of schemaFetchQueue) {
            const cacheKey = getQcSchemaCacheKey(request.division, request.subType);
            try {
              const result = await fetchQcSchemaDocument(request.division, request.subType);
              if (result) {
                schemasByKey[cacheKey] = result.schema;
              }
            } catch {
              // individual schema fetch failure should not abort the entire flow
            }
          }

          for (const entry of entries) {
            const cacheKey = getQcSchemaCacheKey(entry.apiDivision, entry.subType, entry.inhibitorType);
            const schema = schemasByKey[cacheKey];
            if (!schema) continue;

            const matchingSections = (resolvedData.savedSections ?? []).filter((s) => {
              if (entry.premixNo != null) {
                if (s.premixNo !== entry.premixNo) return false;
                if (entry.subType && (s as any).subType && (s as any).subType !== entry.subType) return false;
                return true;
              }
              if (entry.motorId != null) {
                if ((s as any).motorId !== entry.motorId) return false;
                if (entry.subType && (s as any).subType && (s as any).subType !== entry.subType) return false;
                return true;
              }
              return s.premixNo == null && !(s as any).motorId;
            });

            if (matchingSections.length > 0) {
              entryValues[entry.entryId] = {
                schemaValues: hydrateQcValuesFromSections(schema, matchingSections),
              };
            }
          }

          resolvedData = {
            ...resolvedData,
            divisionEntries: entries,
            divisionEntryValues: entryValues,
            schemasByKey,
          };
        } else {
          const resolvedFlow = resolveBatchFlowSelection(resolvedData.division, resolvedData.subType);
          initialRawMaterialType = resolvedFlow.rawMaterialType;
          initialProcessingType = resolvedFlow.processingType;

          if (resolvedData.schemaFormLoaded && resolvedData.division) {
            const schemasToLoad: Array<{ division: QcApiDivision; subType: QcApiSubType }> = [];

            if (isRawMaterialRevalidationType(initialRawMaterialType)) {
              schemasToLoad.push({ division: "RAW_MATERIAL_REVALIDATION", subType: null });
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
                  setFormData((prev) =>
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
      setFormData(resolvedData);
      setInitialSnapshot(
        JSON.stringify({
          formData: resolvedData,
          selectedDivision: initialDivision,
          selectedRawMaterialType: initialRawMaterialType,
          selectedProcessingType: initialProcessingType,
          selectedPremixSlot:
            initialProcessingType === "LIQUID_PROCESSING" ? "LIQUID_PROCESSING" : "SOLID_PROCESSING",
          selectedPremix: "",
        }),
      );
      setIsEditMode(editMode);
      setView("form");
    },
    [fetchQcSchemaDocument, messages, showAlert, subDepartmentId],
  );

  const handleFillForm = async (batch: QCBatch) => {
    setReadOnly(false);
    await openFormWithResolvedData(batch, false);
  };

  const handleEditForm = async (batch: QCBatch) => {
    await openFormWithResolvedData(batch, true);
  };

  const handleViewDetails = async (batch: QCBatch) => {
    setReadOnly(true);
    await openFormWithResolvedData(batch, true);
    setIsEditMode(false);
    setView("details");
  };

  const handleBack = () => {
    if (view === "details") {
      if (hasSavedDraft) bumpBatchRefresh();
      resetFormContext();
      return;
    }
    if (view === "form" && isFormDirty) {
      setBackConfirmOpen(true);
      return;
    }

    if (hasSavedDraft) bumpBatchRefresh();
    resetFormContext();
  };

  const handleDiscardAndBack = () => {
    setBackConfirmOpen(false);
    if (hasSavedDraft) bumpBatchRefresh();
    resetFormContext();
  };

  const submitForm = async (intent: "draft" | "submit") => {
    if (!activeBatch) return false;

    if (!subDepartmentId) {
      showAlert(messages.SUB_DEPARTMENT_MISSING, "error");
      return false;
    }

    if (!hasDivisionEntries(formData) && !formData.schemaFormLoaded) {
      showAlert(messages.EMPTY_FORM_ERROR, "warning");
      return false;
    }

    if (!hasAnyQualityControlValue(formData)) {
      showAlert(messages.EMPTY_FORM_ERROR, "warning");
      return false;
    }

    const payload = mapQualityControlPayload(formData);
    const isCreateFlow =
      activeBatch.qcStatus === QUALITY_CONTROL_STATUS.INITIATED && !activeBatch.formId;

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
          formSubmissionType: intent === "draft" ? "DRAFT" : "SUBMIT",
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
          formSubmissionType: intent === "draft" ? "DRAFT" : "SUBMIT",
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
      setInitialSnapshot(formSnapshot);

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
        await listParams.refreshUserBatches();
        resetFormContext();
      }

      return true;
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveDraft = async () => submitForm("draft");
  const handleSubmit = async () => submitForm("submit");

  return {
    ...listParams,
    loading: listParams.loading,
    view,
    activeBatch,
    isEditMode,
    readOnly,
    formData,
    isFormDirty,
    selectedDivision,
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
    schemaLoading,
    schemaError,
    actionLoading,
    backConfirmOpen,
    batches,
    subDepartmentId,
    handleFillForm,
    handleEditForm,
    handleViewDetails,
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
    handleDivisionEntryValuesChange,
    handleDivisionEntryLiquidValuesChange,
    handleMixingFinalMixDetailsChange,
    handleRemoveDivisionEntry,
    setActiveDivisionGroupIndex,
    setActiveDivisionSubIndex,
    handleFormValuesChange,
    handleSaveDraft,
    handleSubmit,
  };
};

export default useQCDivisionHook;
