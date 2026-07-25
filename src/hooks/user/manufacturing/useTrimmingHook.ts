import { useCallback, useEffect, useMemo, useState } from "react";
import { STRINGS } from "../../../app/config/strings";
import { useAlertStore } from "../../../app/store/alertStore";
import { useAuthStore } from "../../../app/store/authStore";
import { useUserBatchRefreshStore } from "../../../app/store/userBatchRefreshStore";
import { batchManagementController } from "../../../controllers/admin/BatchManagement/batchManagementController";
import { operationsController } from "../../../controllers/user/operationsController";
import trimmingController from "../../../controllers/user/manufacturing/trimmingController";
import {
  createDefaultTrimmingFormState,
  createEmptyTrimmingMotorSession,
  hasAnyTrimmingValue,
  mapTrimmingDetailsToFormState,
  mapTrimmingFormStateToPayload,
  type TrimmingFormState,
  type TrimmingMotorSession,
} from "../../../data/models/user/TrimmingFormModel";
import { MANUFACTURING_STATUS } from "./manufacturingWorkflowData";
import {
  mapApprovedMotorsToOptions,
  mergeTrimmingMotorOptions,
  resolveTrimmingMotorCountLimit,
  resolveTrimmingMotorOptions,
  type TrimmingAddedMotor,
  type TrimmingMotorStageOption,
} from "./trimmingFlowConfig";
import { useCuringMotorStages } from "./useCuringMotorStages";
import { useSubdepartmentBatches } from "../useSubdepartmentBatches";
import type { SchemaFormValues } from "../../../schema-engine";

type WorkflowView = "list" | "form" | "details";

type TrimmingBatch = {
  batchId: string;
  projectId?: string;
  projectName?: string;
  trStatus?: string;
  formId?: string | null;
  motorStage?: unknown;
  motorType?: unknown;
  motorId?: string;
  motorIds?: string[];
  [key: string]: any;
};

const TR_STATUS = MANUFACTURING_STATUS;
const parseStatus = (status: string | undefined) => String(status ?? "").toLowerCase();

const resolveTrimmingFormId = (batch?: TrimmingBatch | null) =>
  String(batch?.formId ?? "").trim() || null;

const resolveBatchProjectId = (batch?: TrimmingBatch | null) =>
  String(batch?.projectId ?? batch?.projectName ?? "").trim();

const resolveInitialMotorStage = (batch?: TrimmingBatch | null) => {
  const stage = batch?.motorStage ?? batch?.motorType;
  if (stage == null || stage === "") return "";
  return String(stage).trim();
};

const buildAddedMotorsFromForm = (formData: TrimmingFormState): TrimmingAddedMotor[] =>
  (formData.motors ?? [])
    .filter((motor) => motor.motorId.trim().length > 0)
    .map((motor) => ({
      motorId: motor.motorId,
      motorStage: String(motor.motorStage),
      motorReceivedAt: motor.motorReceivedAt,
    }));

const resolveBatchMotorEntries = (
  batch: TrimmingBatch | null,
  batchDetails: any,
): TrimmingAddedMotor[] => {
  const batchDetailsRecord = (batchDetails ?? {}) as Record<string, any>;
  const collectIds = (source: any): string[] => {
    const ids: string[] = [];
    const push = (value: unknown) => {
      const normalized = String(value ?? "").trim();
      if (normalized) ids.push(normalized);
    };

    if (Array.isArray(source?.motorIds)) {
      source.motorIds.forEach((value: unknown) => push(value));
    }

    if (Array.isArray(source?.motors)) {
      source.motors.forEach((motor: any) => {
        push(motor?.motorId ?? motor?.motorNo ?? motor?.motorNumber ?? motor?.id);
      });
    }

    if (source?.motorId != null) {
      push(source.motorId);
    }

    return ids.filter((id, index, arr) => arr.indexOf(id) === index);
  };

  const motorIds = collectIds(batchDetails ?? batch ?? {});
  if (motorIds.length === 0) {
    const directMotorId = String(batch?.motorId ?? "").trim();
    return directMotorId ? [{ motorId: directMotorId, motorStage: "", motorReceivedAt: "" }] : [];
  }

  const fallbackStage = String(
    batch?.motorStage ??
      batch?.motorType ??
      batchDetailsRecord?.motorStage ??
      batchDetailsRecord?.motorType ??
      "",
  ).trim();

  const fallbackReceivedAt = String(
    batchDetailsRecord?.motorReceivedAt ??
      batchDetailsRecord?.motorReceiptDate ??
      batchDetailsRecord?.receivedAt ??
      batch?.motorReceivedAt ??
      batch?.receivedAt ??
      "",
  ).trim();

  return motorIds.map((motorId) => ({
    motorId,
    motorStage: fallbackStage,
    motorReceivedAt: fallbackReceivedAt,
  }));
};

export const useTrimmingHook = () => {
  const listParams = useSubdepartmentBatches("trimming");
  const user = useAuthStore((s) => s.user);
  const showAlert = useAlertStore((state) => state.showAlert);
  const bumpBatchRefresh = useUserBatchRefreshStore((state) => state.bumpVersion);

  const subDepartmentId = useMemo(
    () => user?.allSubDepartments.find((sd) => sd.slugs?.subDept === "trimming")?.subDepartmentId,
    [user],
  );

  const [view, setView] = useState<WorkflowView>("list");
  const [activeBatch, setActiveBatch] = useState<TrimmingBatch | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [loadingFormDetails, setLoadingFormDetails] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [backConfirmOpen, setBackConfirmOpen] = useState(false);
  const [hasSavedDraft, setHasSavedDraft] = useState(false);
  const [formData, setFormData] = useState<TrimmingFormState>(createDefaultTrimmingFormState());
  const [initialSnapshot, setInitialSnapshot] = useState("{}");
  const [detailsRow, setDetailsRow] = useState<any>(null);
  const [detailsData, setDetailsData] = useState<any>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [selectedMotorStage, setSelectedMotorStage] = useState("");
  const [motorCount, setMotorCount] = useState<number | "">("");
  const [motorReceivedAt, setMotorReceivedAt] = useState("");
  const [addedMotors, setAddedMotors] = useState<TrimmingAddedMotor[]>([]);
  const [batchMotorEntries, setBatchMotorEntries] = useState<TrimmingAddedMotor[]>([]);
  const [approvedMotorOptions, setApprovedMotorOptions] = useState<
    ReturnType<typeof mapApprovedMotorsToOptions>
  >([]);
  const [approvedMotorsLoading, setApprovedMotorsLoading] = useState(false);

  const projectId = useMemo(() => resolveBatchProjectId(activeBatch), [activeBatch]);
  const { stages: motorStages, loading: motorStagesLoading } = useCuringMotorStages(projectId);

  const motorStageOptions = useMemo<TrimmingMotorStageOption[]>(
    () =>
      motorStages.map((stage) => ({
        value: String(stage.motorStage),
        label: `Stage ${stage.motorStage}`,
        noOfmotors: stage.noOfmotors,
      })),
    [motorStages],
  );

  const selectedStageOption = useMemo(
    () => motorStageOptions.find((stage) => stage.value === selectedMotorStage) ?? null,
    [motorStageOptions, selectedMotorStage],
  );

  const batchMotorOptions = useMemo(() => resolveTrimmingMotorOptions(activeBatch), [activeBatch]);

  const availableMotorOptions = useMemo(
    () => mergeTrimmingMotorOptions(approvedMotorOptions, batchMotorOptions),
    [approvedMotorOptions, batchMotorOptions],
  );

  const maxMotorCount = useMemo(
    () =>
      resolveTrimmingMotorCountLimit({
        selectedStage: selectedStageOption,
        availableMotorOptions,
        batchNumberOfMotors: Number(activeBatch?.numberOfMotors ?? 0),
      }),
    [activeBatch?.numberOfMotors, availableMotorOptions, selectedStageOption],
  );

  const formSnapshot = useMemo(
    () =>
      JSON.stringify({
        formData,
        addedMotors,
        selectedMotorStage,
      }),
    [formData, addedMotors, selectedMotorStage],
  );

  const isFormDirty = useMemo(
    () => view === "form" && formSnapshot !== initialSnapshot,
    [view, formSnapshot, initialSnapshot],
  );

  const clearFlowBarDrafts = useCallback(() => {
    setSelectedMotorStage("");
    setMotorCount("");
    setMotorReceivedAt("");
  }, []);

  const resetFlowDraft = useCallback(() => {
    clearFlowBarDrafts();
    setAddedMotors([]);
    setBatchMotorEntries([]);
    setApprovedMotorOptions([]);
  }, [clearFlowBarDrafts]);

  const resetFormContext = useCallback(() => {
    const defaults = createDefaultTrimmingFormState();
    setView("list");
    setActiveBatch(null);
    setIsEditMode(false);
    setLoadingFormDetails(false);
    setActionLoading(false);
    setBackConfirmOpen(false);
    setHasSavedDraft(false);
    setFormData(defaults);
    resetFlowDraft();
    setInitialSnapshot(
      JSON.stringify({
        formData: defaults,
        addedMotors: [],
        selectedMotorStage: "",
      }),
    );
  }, [resetFlowDraft]);

  const getErrorMessage = (response: any, fallbackMessage: string) => {
    if (response?.error?.details) return response.error.details;
    if (response?.message) return response.message;
    return fallbackMessage;
  };

  useEffect(() => {
    const stage = String(selectedMotorStage ?? "").trim();
    const pid = resolveBatchProjectId(activeBatch);
    if (!stage || !pid) {
      setApprovedMotorOptions([]);
      return;
    }

    let active = true;
    setApprovedMotorsLoading(true);
    void operationsController
      .fetchApprovedMotorsList({ projectId: pid, motorStage: stage })
      .then((response) => {
        if (!active) return;
        if (response?.success && response.data) {
          setApprovedMotorOptions(mapApprovedMotorsToOptions(response.data.motors ?? []));
        } else {
          setApprovedMotorOptions([]);
        }
      })
      .finally(() => {
        if (active) setApprovedMotorsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [activeBatch, selectedMotorStage]);

  const openFormWithResolvedData = useCallback(
    async (batch: TrimmingBatch, editMode: boolean) => {
      const status = parseStatus(batch.trStatus);
      const shouldFetchDetails =
        editMode ||
        status === parseStatus(TR_STATUS.IN_PROGRESS) ||
        status === parseStatus(TR_STATUS.REJECTED);

      let nextBatch = batch;
      let nextFormData = createDefaultTrimmingFormState();
      const initialStage = resolveInitialMotorStage(batch);
      let autoMotorEntries: TrimmingAddedMotor[] = [];

      setLoadingFormDetails(true);
      try {
        if (batch.batchId) {
          try {
            const batchDetails = await batchManagementController.getBatchById(batch.batchId);
            autoMotorEntries = resolveBatchMotorEntries(batch, batchDetails);
          } catch (error) {
            console.error("Unable to resolve batch motor details", error);
          }
        }

        if (shouldFetchDetails) {
          if (!subDepartmentId) {
            showAlert(STRINGS.MANUFACTURING.TRIMMING.SUB_DEPARTMENT_MISSING, "error");
            return;
          }
          if (!batch.formId) {
            showAlert(STRINGS.MANUFACTURING.TRIMMING.FORM_ID_MISSING, "error");
            return;
          }

          const detailsResponse = await trimmingController.fetchFormDetails({
            formId: batch.formId,
          });

          if (!detailsResponse?.success || !detailsResponse?.data) {
            const fallback =
              detailsResponse?.statusCode === 404
                ? STRINGS.MANUFACTURING.TRIMMING.DETAILS_NOT_FOUND
                : STRINGS.MANUFACTURING.TRIMMING.DETAILS_FETCH_ERROR;
            showAlert(getErrorMessage(detailsResponse, fallback), "error");
            return;
          }

          nextBatch = { ...batch, formId: detailsResponse.data.formId || batch.formId };
          nextFormData = mapTrimmingDetailsToFormState(detailsResponse.data);
        }
      } finally {
        setLoadingFormDetails(false);
      }

      const existingMotorIds = new Set((nextFormData.motors ?? []).map((motor) => motor.motorId));
      const motorEntriesToUse = autoMotorEntries.filter(
        (entry) => Boolean(entry.motorId) && !existingMotorIds.has(entry.motorId),
      );

      if (motorEntriesToUse.length > 0 && (nextFormData.motors ?? []).length === 0) {
        nextFormData = {
          ...nextFormData,
          schemaFormLoaded: true,
          motors: motorEntriesToUse.map((entry) =>
            createEmptyTrimmingMotorSession(
              entry.motorId,
              entry.motorStage || initialStage || "",
              entry.motorReceivedAt || "",
              null,
            ),
          ),
        };
      } else if ((nextFormData.motors ?? []).length > 0) {
        nextFormData = {
          ...nextFormData,
          schemaFormLoaded: true,
        };
      }

      const nextAddedMotors = buildAddedMotorsFromForm(nextFormData);

      setActiveBatch(nextBatch);
      setIsEditMode(editMode);
      setFormData(nextFormData);
      setAddedMotors(nextAddedMotors);
      setBatchMotorEntries(autoMotorEntries);
      clearFlowBarDrafts();
      setInitialSnapshot(
        JSON.stringify({
          formData: nextFormData,
          addedMotors: nextAddedMotors,
          selectedMotorStage: "",
        }),
      );
      setView("form");
    },
    [clearFlowBarDrafts, showAlert, subDepartmentId],
  );

  const handleViewTrimmingDetails = useCallback(async (row: any) => {
    if (!row?.formId) return;

    setDetailsLoading(true);
    try {
      const response = await trimmingController.fetchFormDetails({
        formId: row.formId,
      });

      if (response?.success) {
        setDetailsRow(row);
        setDetailsData(response.data);
        setView("details");
      }
    } finally {
      setDetailsLoading(false);
    }
  }, []);

  const handleBackFromDetails = useCallback(() => {
    setDetailsRow(null);
    setDetailsData(null);
    setView("list");
    bumpBatchRefresh();
  }, [bumpBatchRefresh]);

  const handleFillForm = useCallback(
    async (batch: TrimmingBatch) => await openFormWithResolvedData(batch, false),
    [openFormWithResolvedData],
  );

  const handleEditForm = useCallback(
    async (batch: TrimmingBatch) => await openFormWithResolvedData(batch, true),
    [openFormWithResolvedData],
  );

  const handleBack = useCallback(() => {
    if (isFormDirty) {
      setBackConfirmOpen(true);
      return;
    }
    bumpBatchRefresh();
    resetFormContext();
  }, [isFormDirty, resetFormContext, bumpBatchRefresh]);

  const handleDiscardAndBack = useCallback(() => {
    bumpBatchRefresh();
    resetFormContext();
  }, [resetFormContext, bumpBatchRefresh]);

  const handleMotorStageChange = useCallback((value: string) => {
    setSelectedMotorStage(value);
    setMotorCount("");
    setMotorReceivedAt("");
  }, []);

  const handleMotorCountChange = useCallback((count: number | "") => {
    setMotorCount(count);
  }, []);

  const handleMotorSessionChange = useCallback((motorId: string, next: TrimmingMotorSession) => {
    setFormData((prev) => ({
      ...prev,
      motors: (prev.motors ?? []).map((motor) => (motor.motorId === motorId ? next : motor)),
    }));
  }, []);

  const handleFormValuesChange = useCallback((motorId: string, values: SchemaFormValues) => {
    setFormData((prev) => ({
      ...prev,
      motors: (prev.motors ?? []).map((motor) =>
        motor.motorId === motorId ? { ...motor, formValues: values } : motor,
      ),
      schemaFormValues: values,
    }));
  }, []);

  const submitForm = useCallback(
    async (intent: "draft" | "submit") => {
      if (!activeBatch) return false;

      if ((formData.motors ?? []).length === 0) {
        showAlert(
          STRINGS.MANUFACTURING.TRIMMING.EMPTY_FORM_ERROR ||
            "Please add at least one motor before submitting.",
          "warning",
        );
        return false;
      }

      if (!subDepartmentId) {
        showAlert(STRINGS.MANUFACTURING.TRIMMING.SUB_DEPARTMENT_MISSING, "error");
        return false;
      }

      if (!hasAnyTrimmingValue(formData)) {
        showAlert(STRINGS.MANUFACTURING.TRIMMING.EMPTY_FORM_ERROR, "warning");
        return false;
      }

      const isCreateFlow = !resolveTrimmingFormId(activeBatch);
      const payloadBody = mapTrimmingFormStateToPayload(formData);

      setActionLoading(true);
      try {
        let response: any;

        if (isCreateFlow) {
          if (!activeBatch.batchId) {
            showAlert(STRINGS.MANUFACTURING.TRIMMING.BATCH_ID_MISSING, "error");
            return false;
          }
          response = await trimmingController.createForm({
            batchId: activeBatch.batchId,
            subDepartmentId,
            formSubmissionType: intent === "draft" ? "DRAFT" : "SUBMIT",
            ...payloadBody,
          });
        } else {
          const formId = resolveTrimmingFormId(activeBatch);
          if (!formId) {
            showAlert(STRINGS.MANUFACTURING.TRIMMING.FORM_ID_MISSING, "error");
            return false;
          }
          response = await trimmingController.updateForm({
            formId,
            batchId: activeBatch.batchId,
            subDepartmentId,
            formSubmissionType: intent === "draft" ? "DRAFT" : "SUBMIT",
            ...payloadBody,
          });
        }

        if (!response?.success) {
          const fallback = isCreateFlow
            ? STRINGS.MANUFACTURING.TRIMMING.CREATE_FAILED
            : STRINGS.MANUFACTURING.TRIMMING.UPDATE_FAILED;
          showAlert(getErrorMessage(response, fallback), "error");
          return false;
        }

        const nextFormId = response.data?.formId ?? activeBatch.formId ?? null;
        setActiveBatch((prev) => (prev ? { ...prev, formId: nextFormId } : prev));
        setInitialSnapshot(formSnapshot);

        if (intent === "draft") {
          showAlert(
            isCreateFlow
              ? STRINGS.MANUFACTURING.TRIMMING.CREATE_DRAFT_SUCCESS
              : STRINGS.MANUFACTURING.TRIMMING.UPDATE_DRAFT_SUCCESS,
            "success",
            { autoCloseMs: 2200 },
          );
          setHasSavedDraft(true);
        } else {
          showAlert(
            isCreateFlow
              ? STRINGS.MANUFACTURING.TRIMMING.CREATE_SUBMIT_SUCCESS
              : STRINGS.MANUFACTURING.TRIMMING.UPDATE_SUBMIT_SUCCESS,
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
    },
    [activeBatch, subDepartmentId, formData, formSnapshot, showAlert, listParams, resetFormContext],
  );

  const handleSaveDraft = useCallback(async () => submitForm("draft"), [submitForm]);
  const handleSubmit = useCallback(async () => submitForm("submit"), [submitForm]);

  return {
    ...listParams,
    loading: listParams.loading || loadingFormDetails,
    view,
    activeBatch,
    isEditMode,
    formData,
    isFormDirty,
    actionLoading,
    backConfirmOpen,
    setBackConfirmOpen,
    subDepartmentId,
    selectedMotorStage,
    motorStageOptions,
    motorStagesLoading,
    motorCount,
    motorReceivedAt,
    addedMotors,
    availableMotorOptions,
    approvedMotorsLoading,
    maxMotorCount,
    batchMotorEntries,
    handleFillForm,
    handleEditForm,
    handleBack,
    handleDiscardAndBack,
    handleMotorStageChange,
    handleMotorCountChange,
    handleMotorReceivedAtChange: setMotorReceivedAt,
    handleMotorSessionChange,
    handleFormValuesChange,
    handleSaveDraft,
    handleSubmit,
    detailsRow,
    detailsData,
    detailsLoading,
    handleViewTrimmingDetails,
    handleBackFromDetails,
  };
};

export default useTrimmingHook;
