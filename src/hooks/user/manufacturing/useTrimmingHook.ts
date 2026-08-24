import { useCallback, useMemo, useRef, useState } from "react";
import { STRINGS } from "../../../app/config/strings";
import { useAlertStore } from "../../../app/store/alertStore";
import { useAuthStore } from "../../../app/store/authStore";
import { useUserBatchRefreshStore } from "../../../app/store/userBatchRefreshStore";
import { batchManagementController } from "../../../controllers/admin/BatchManagement/batchManagementController";
import trimmingController from "../../../controllers/user/manufacturing/trimmingController";
import {
  collectTempFileIdsFromTrimmingForm,
  createDefaultTrimmingFormState,
  createEmptyTrimmingMotorSession,
  hasIncompleteTrimmingUploads,
  hasMotorTrimmingValue,
  isTrimmingMotorEditable,
  mapTrimmingDetailsToFormState,
  mapTrimmingFormStateToPayload,
  mapTrimmingMotorStatusesFromApi,
  type TrimmingFormState,
  type TrimmingMotorSession,
  type TrimmingMotorStatusMeta,
  type TrimmingMotorSubmissionStatus,
  type TrimmingMotorSubmissionType,
} from "../../../data/models/user/TrimmingFormModel";
import {
  isManufacturingContinueFillingStatus,
} from "../../operationStatus";
import {
  mergeTrimmingMotorOptions,
  resolveTrimmingMotorCountLimit,
  resolveTrimmingMotorOptions,
  type TrimmingAddedMotor,
  type TrimmingMotorStageOption,
} from "./trimmingFlowConfig";
import { useCuringMotorStages } from "./useCuringMotorStages";
import { useSubdepartmentBatches } from "../useSubdepartmentBatches";
import {
  isMotorEnabledByPreviousStage,
  isMotorEnabledForWorkflow,
  resolvePreviousStageApprovedUnits,
  type PreviousStageApprovedUnits,
} from "../previousStageApproval";
import { useFileService } from "../../../hooks/useFileService";
import { discardWorkflowSnapshotForm } from "../../../utils/workflowDiscard";

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

const S = STRINGS.MANUFACTURING.TRIMMING;

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

/**
 * Always show every batch motor as a tab. Overlay saved form data when present
 * so a partial draft still lists remaining motors.
 */
const mergeMotorsFromBatchAndForm = (
  batchEntries: TrimmingAddedMotor[],
  formData: TrimmingFormState,
  fallbackStage: string,
): { formData: TrimmingFormState; addedMotors: TrimmingAddedMotor[] } => {
  if (!batchEntries.length) {
    return {
      formData,
      addedMotors: buildAddedMotorsFromForm(formData),
    };
  }

  const fromFormById = new Map((formData.motors ?? []).map((motor) => [motor.motorId, motor]));
  const batchIds = new Set(batchEntries.map((entry) => entry.motorId));

  const motors: TrimmingMotorSession[] = batchEntries.map((entry) => {
    const existing = fromFormById.get(entry.motorId);
    if (existing) {
      return {
        ...existing,
        motorStage: existing.motorStage || Number(entry.motorStage) || Number(fallbackStage) || 0,
        motorReceivedAt: existing.motorReceivedAt || entry.motorReceivedAt,
      };
    }
    return createEmptyTrimmingMotorSession(
      entry.motorId,
      entry.motorStage || fallbackStage || "",
      entry.motorReceivedAt || "",
    );
  });

  (formData.motors ?? []).forEach((motor) => {
    if (!batchIds.has(motor.motorId)) {
      motors.push(motor);
    }
  });

  return {
    formData: { ...formData, motors },
    addedMotors: motors.map((motor) => ({
      motorId: motor.motorId,
      motorStage: String(motor.motorStage),
      motorReceivedAt: motor.motorReceivedAt,
    })),
  };
};

export const useTrimmingHook = () => {
  const listParams = useSubdepartmentBatches("trimming");
  const user = useAuthStore((s) => s.user);
  const showAlert = useAlertStore((state) => state.showAlert);
  const bumpBatchRefresh = useUserBatchRefreshStore((state) => state.bumpVersion);
  const { deleteTemp } = useFileService();

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
  const [motorStatusById, setMotorStatusById] = useState<Record<string, TrimmingMotorStatusMeta>>(
    {},
  );
  const [previousStageGate, setPreviousStageGate] =
    useState<PreviousStageApprovedUnits | null>(null);
  const [approvedMotorOptions] = useState<ReturnType<typeof resolveTrimmingMotorOptions>>([]);

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
    () =>
      mergeTrimmingMotorOptions(approvedMotorOptions, batchMotorOptions).filter((option) =>
        isMotorEnabledByPreviousStage(option.value, previousStageGate),
      ),
    [approvedMotorOptions, batchMotorOptions, previousStageGate],
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
        motorStatusById,
      }),
    [formData, addedMotors, selectedMotorStage, motorStatusById],
  );

  const isFormDirty = useMemo(
    () => view === "form" && formSnapshot !== initialSnapshot,
    [view, formSnapshot, initialSnapshot],
  );

  const snapshotStateRef = useRef({ formData, addedMotors, selectedMotorStage, motorStatusById });
  snapshotStateRef.current = { formData, addedMotors, selectedMotorStage, motorStatusById };
  const initialSnapshotRef = useRef(initialSnapshot);
  initialSnapshotRef.current = initialSnapshot;

  const clearFlowBarDrafts = useCallback(() => {
    setSelectedMotorStage("");
    setMotorCount("");
    setMotorReceivedAt("");
  }, []);

  const resetFlowDraft = useCallback(() => {
    clearFlowBarDrafts();
    setAddedMotors([]);
    setBatchMotorEntries([]);
    setMotorStatusById({});
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
    setPreviousStageGate(null);
    resetFlowDraft();
    setInitialSnapshot(
      JSON.stringify({
        formData: defaults,
        addedMotors: [],
        selectedMotorStage: "",
        motorStatusById: {},
      }),
    );
  }, [resetFlowDraft]);

  const getErrorMessage = (response: any, fallbackMessage: string) => {
    if (response?.error?.details) return response.error.details;
    if (response?.message) return response.message;
    return fallbackMessage;
  };

  const openFormWithResolvedData = useCallback(
    async (batch: TrimmingBatch, editMode: boolean) => {
      const shouldFetchDetails =
        editMode ||
        isManufacturingContinueFillingStatus(batch.trStatus) ||
        String(batch.trStatus ?? "")
          .toLowerCase()
          .includes("reject");

      let nextBatch = batch;
      let nextFormData = createDefaultTrimmingFormState();
      const initialStage = resolveInitialMotorStage(batch);
      let autoMotorEntries: TrimmingAddedMotor[] = [];
      let nextStatuses: Record<string, TrimmingMotorStatusMeta> = {};

      setLoadingFormDetails(true);
      try {
        if (batch.batchId) {
          try {
            const batchDetails = await batchManagementController.getBatchById(batch.batchId);
            autoMotorEntries = resolveBatchMotorEntries(batch, batchDetails);
            nextBatch = {
              ...batch,
              motorIds: batchDetails?.motorIds?.length
                ? batchDetails.motorIds.map(String)
                : batch.motorIds,
              motorId:
                batchDetails?.motorIds?.length > 0
                  ? batchDetails.motorIds.join(", ")
                  : batch.motorId,
              stageProgress: batchDetails?.stageProgress ?? batch.stageProgress,
              currentStage: batchDetails?.currentStage ?? batch.currentStage,
            };
          } catch (error) {
            console.error("Unable to resolve batch motor details", error);
          }
        }

        setPreviousStageGate(
          resolvePreviousStageApprovedUnits({
            stageProgress: nextBatch.stageProgress ?? batch.stageProgress,
            currentStage: nextBatch.currentStage ?? batch.currentStage,
            currentSlug: "trimming",
            currentSubDepartmentId: subDepartmentId,
            subDepartments: user?.allSubDepartments,
          }),
        );

        if (shouldFetchDetails) {
          if (!subDepartmentId) {
            showAlert(S.SUB_DEPARTMENT_MISSING, "error");
            return;
          }
          if (!batch.formId) {
            showAlert(S.FORM_ID_MISSING, "error");
            return;
          }

          const detailsResponse = await trimmingController.fetchFormDetails({
            formId: batch.formId,
          });

          if (!detailsResponse?.success || !detailsResponse?.data) {
            const fallback =
              detailsResponse?.statusCode === 404 ? S.DETAILS_NOT_FOUND : S.DETAILS_FETCH_ERROR;
            showAlert(getErrorMessage(detailsResponse, fallback), "error");
            return;
          }

          nextBatch = { ...nextBatch, formId: detailsResponse.data.formId || batch.formId };
          nextFormData = mapTrimmingDetailsToFormState(detailsResponse.data);
          nextStatuses = mapTrimmingMotorStatusesFromApi(detailsResponse.data);
        }
      } finally {
        setLoadingFormDetails(false);
      }

      const merged = mergeMotorsFromBatchAndForm(autoMotorEntries, nextFormData, initialStage);
      nextFormData = merged.formData;
      const nextAddedMotors = merged.addedMotors;

      if (Object.keys(nextStatuses).length === 0) {
        nextStatuses = Object.fromEntries(
          nextAddedMotors.map((entry) => [
            entry.motorId,
            { motorSubmissionStatus: "TO_BE_INITIATED" as TrimmingMotorSubmissionStatus },
          ]),
        );
      } else {
        nextAddedMotors.forEach((entry) => {
          if (!nextStatuses[entry.motorId]) {
            nextStatuses[entry.motorId] = { motorSubmissionStatus: "TO_BE_INITIATED" };
          }
        });
      }

      setActiveBatch(nextBatch);
      setIsEditMode(editMode);
      setFormData(nextFormData);
      setAddedMotors(nextAddedMotors);
      setBatchMotorEntries(autoMotorEntries);
      setMotorStatusById(nextStatuses);
      clearFlowBarDrafts();
      setInitialSnapshot(
        JSON.stringify({
          formData: nextFormData,
          addedMotors: nextAddedMotors,
          selectedMotorStage: "",
          motorStatusById: nextStatuses,
        }),
      );
      setView("form");
    },
    [clearFlowBarDrafts, showAlert, subDepartmentId, user?.allSubDepartments],
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

  const handleDiscardAndBack = useCallback(async () => {
    setBackConfirmOpen(false);
    await discardWorkflowSnapshotForm({
      subDepartmentId,
      initialSnapshot: initialSnapshotRef.current,
      currentState: snapshotStateRef.current,
      deleteTemp,
      extractTempFileIds: collectTempFileIdsFromTrimmingForm,
      resetForm: () => {
        bumpBatchRefresh();
        resetFormContext();
      },
    });
  }, [bumpBatchRefresh, deleteTemp, resetFormContext, subDepartmentId]);

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

  const getMotorStatus = useCallback(
    (motorId: string): TrimmingMotorSubmissionStatus =>
      motorStatusById[motorId]?.motorSubmissionStatus ?? "TO_BE_INITIATED",
    [motorStatusById],
  );

  const checkMotorEditable = useCallback(
    (motorId: string) => {
      if (
        !isMotorEnabledForWorkflow(
          motorId,
          addedMotors.map((motor) => motor.motorId),
          previousStageGate,
          getMotorStatus,
        )
      ) {
        return false;
      }
      return isTrimmingMotorEditable(getMotorStatus(motorId));
    },
    [addedMotors, getMotorStatus, previousStageGate],
  );

  const submitMotor = useCallback(
    async (motorId: string, intent: "draft" | "submit") => {
      if (!activeBatch) return false;

      if (!subDepartmentId) {
        showAlert(S.SUB_DEPARTMENT_MISSING, "error");
        return false;
      }

      if (
        !isMotorEnabledForWorkflow(
          motorId,
          addedMotors.map((motor) => motor.motorId),
          previousStageGate,
          getMotorStatus,
        )
      ) {
        showAlert(STRINGS.MANUFACTURING.PREVIOUS_STAGE_UNIT_DISABLED, "warning");
        return false;
      }

      if (!checkMotorEditable(motorId)) {
        showAlert(
          getMotorStatus(motorId) === "APPROVED" ? S.MOTOR_LOCKED_APPROVED : S.MOTOR_LOCKED_WAITING,
          "warning",
        );
        return false;
      }

      const motor = (formData.motors ?? []).find((entry) => entry.motorId === motorId);
      if (!motor) return false;

      if (hasIncompleteTrimmingUploads({ motors: [motor] })) {
        showAlert(S.FILE_UPLOAD_PENDING, "warning");
        return false;
      }

      if (intent === "submit") {
        if (!String(motor.motorReceivedAt ?? "").trim()) {
          showAlert(S.MOTOR_RECEIVED_REQUIRED, "warning");
          return false;
        }
        if (!hasMotorTrimmingValue(formData, motorId)) {
          showAlert(S.EMPTY_FORM_ERROR, "warning");
          return false;
        }
      }

      const motorSubmissionType: TrimmingMotorSubmissionType =
        intent === "draft" ? "DRAFT" : "SUBMIT";
      const isCreateFlow = !resolveTrimmingFormId(activeBatch);
      const payloadBody = mapTrimmingFormStateToPayload(formData, {
        targetMotorIds: [motorId],
        motorSubmissionType,
      });

      if (!payloadBody.motors?.length) {
        showAlert(S.EMPTY_FORM_ERROR, "warning");
        return false;
      }

      setActionLoading(true);
      try {
        let response: any;

        if (isCreateFlow) {
          if (!activeBatch.batchId) {
            showAlert(S.BATCH_ID_MISSING, "error");
            return false;
          }
          response = await trimmingController.createForm({
            batchId: activeBatch.batchId,
            subDepartmentId,
            formSubmissionType: "DRAFT",
            ...payloadBody,
          });
        } else {
          const formId = resolveTrimmingFormId(activeBatch);
          if (!formId) {
            showAlert(S.FORM_ID_MISSING, "error");
            return false;
          }
          response = await trimmingController.updateForm({
            formId,
            batchId: activeBatch.batchId,
            subDepartmentId,
            formSubmissionType: "DRAFT",
            ...payloadBody,
          });
        }

        if (!response?.success) {
          showAlert(
            getErrorMessage(response, isCreateFlow ? S.CREATE_FAILED : S.UPDATE_FAILED),
            "error",
          );
          return false;
        }

        const nextFormId = response.data?.formId ?? activeBatch.formId ?? null;
        setActiveBatch((prev) => (prev ? { ...prev, formId: nextFormId } : prev));
        setHasSavedDraft(true);

        const nextStatus: TrimmingMotorSubmissionStatus =
          intent === "draft" ? "IN_PROGRESS" : "WAITING_FOR_APPROVAL";

        setMotorStatusById((prev) => {
          const updated: Record<string, TrimmingMotorStatusMeta> = {
            ...prev,
            [motorId]: {
              ...prev[motorId],
              motorSubmissionType,
              motorSubmissionStatus: nextStatus,
            },
          };

          if (Array.isArray(response.data?.motorStatuses)) {
            response.data.motorStatuses.forEach((entry: any) => {
              const id = String(entry?.motorId ?? "").trim();
              if (!id) return;
              updated[id] = {
                ...updated[id],
                motorSubmissionType:
                  entry.motorSubmissionType ?? updated[id]?.motorSubmissionType,
                motorSubmissionStatus:
                  (String(entry.motorSubmissionStatus ?? "").toUpperCase() as TrimmingMotorSubmissionStatus) ||
                  updated[id]?.motorSubmissionStatus ||
                  "TO_BE_INITIATED",
              };
            });
          }
          return updated;
        });

        setInitialSnapshot(
          JSON.stringify({
            formData,
            addedMotors,
            selectedMotorStage,
            motorStatusById: {
              ...motorStatusById,
              [motorId]: {
                ...motorStatusById[motorId],
                motorSubmissionType,
                motorSubmissionStatus: nextStatus,
              },
            },
          }),
        );

        showAlert(
          intent === "draft" ? S.MOTOR_SAVE_DRAFT_SUCCESS(motorId) : S.MOTOR_SUBMIT_SUCCESS(motorId),
          "success",
          { autoCloseMs: 2200 },
        );
        return true;
      } finally {
        setActionLoading(false);
      }
    },
    [
      activeBatch,
      addedMotors,
      checkMotorEditable,
      formData,
      getMotorStatus,
      motorStatusById,
      previousStageGate,
      selectedMotorStage,
      showAlert,
      subDepartmentId,
    ],
  );

  const handleSaveMotorDraft = useCallback(
    async (motorId: string) => submitMotor(motorId, "draft"),
    [submitMotor],
  );

  const handleSubmitMotor = useCallback(
    async (motorId: string) => submitMotor(motorId, "submit"),
    [submitMotor],
  );

  return {
    ...listParams,
    loading: listParams.loading || loadingFormDetails,
    loadingFormDetails,
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
    approvedMotorsLoading: false,
    maxMotorCount,
    batchMotorEntries,
    motorStatusById,
    getMotorStatus,
    isMotorEditable: checkMotorEditable,
    previousStageGate,
    handleFillForm,
    handleEditForm,
    handleBack,
    handleDiscardAndBack,
    handleMotorStageChange,
    handleMotorCountChange,
    handleMotorReceivedAtChange: setMotorReceivedAt,
    handleMotorSessionChange,
    handleSaveMotorDraft,
    handleSubmitMotor,
    detailsRow,
    detailsData,
    detailsLoading,
    handleViewTrimmingDetails,
    handleBackFromDetails,
  };
};

export default useTrimmingHook;
