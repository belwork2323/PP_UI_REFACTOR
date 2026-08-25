import { useCallback, useMemo, useRef, useState } from "react";
import { STRINGS } from "../../../app/config/strings";
import { useAlertStore } from "../../../app/store/alertStore";
import { useAuthStore } from "../../../app/store/authStore";
import { useUserBatchRefreshStore } from "../../../app/store/userBatchRefreshStore";
import { useFileService } from "../../../hooks/useFileService";
import { discardWorkflowSnapshotForm } from "../../../utils/workflowDiscard";
import { batchManagementController } from "../../../controllers/admin/BatchManagement/batchManagementController";
import dispatchController from "../../../controllers/user/dispatch/dispatchController";
import { DispatchDetailsModel } from "../../../data/models/user/DispatchApiModel";
import {
  collectTempFileIdsFromDispatchForm,
  hasIncompleteDispatchUploads,
} from "../../../data/models/user/DispatchMotorDataModel";
import {
  appendDispatchMotorToState,
  createDefaultDispatchFormState,
  createEmptyDispatchMotorSession,
  hasMotorDispatchValue,
  isDispatchMotorEditable,
  isDispatchMotorSetupReady,
  mapDispatchFormStateToBackendPayload,
  mapDispatchFormStateToUpdatePayload,
  mapDispatchMotorStatusesFromApi,
  type DispatchFormState,
  type DispatchMotorSession,
  type DispatchMotorStatusMeta,
  type DispatchMotorSubmissionStatus,
  type DispatchMotorSubmissionType,
} from "../../../data/models/user/DispatchFormModel";
import type { DispatchMotorData } from "../../../data/models/user/DispatchMotorDataModel";
import {
  type DispatchAddedMotor,
  type DispatchBatch,
  normalizeDispatchMotorStage,
  parseDispatchMotorIds,
} from "./dispatchFlowConfig";
import { OPERATION_STATUS } from "../../operationStatus";
import { useSubdepartmentBatches } from "../useSubdepartmentBatches";
import {
  isMotorEnabledByPreviousStage,
  isMotorEnabledForWorkflow,
  resolvePreviousStageApprovedUnits,
  type PreviousStageApprovedUnits,
} from "../previousStageApproval";

type WorkflowView = "list" | "form" | "details";

const messages = STRINGS.DISPATCH;

const normalizeBatch = (batch: any): DispatchBatch => {
  const motorIds = Array.isArray(batch?.motorIds)
    ? batch.motorIds.map((id: unknown) => String(id).trim()).filter(Boolean)
    : parseDispatchMotorIds(batch?.motorId);

  return {
    ...batch,
    projectId: batch?.projectId ?? batch?.projectName ?? "",
    projectName: batch?.projectName ?? batch?.projectId ?? "",
    dispatchStatus: batch?.dispatchStatus ?? batch?.status ?? OPERATION_STATUS.TO_BE_INITIATED,
    formId: batch?.formId ?? null,
    motorIds,
    motorId: motorIds.length > 0 ? motorIds.join(", ") : String(batch?.motorId ?? "").trim(),
    motorStage: normalizeDispatchMotorStage(batch?.motorStage ?? batch?.motorType),
    rejectionReason: batch?.rejectionReason ?? null,
  };
};

const resolveDispatchFormId = (batch?: DispatchBatch | null) =>
  String(batch?.formId ?? "").trim() || null;

const resolveBatchMotorEntries = (
  batch: DispatchBatch | null,
  batchDetails: any,
): DispatchAddedMotor[] => {
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
      parseDispatchMotorIds(source.motorId).forEach((id) => push(id));
    }
    return ids.filter((id, index, arr) => arr.indexOf(id) === index);
  };

  const motorIds = collectIds(batchDetails ?? batch ?? {});
  if (motorIds.length === 0) {
    const direct = parseDispatchMotorIds(batch?.motorId);
    return direct.map((motorId) => ({ motorId }));
  }
  return motorIds.map((motorId) => ({ motorId }));
};

/**
 * Always show every batch motor as a tab. Overlay saved form data when present
 * so a partial draft still lists remaining motors.
 */
const mergeMotorsFromBatchAndForm = (
  batchEntries: DispatchAddedMotor[],
  formData: DispatchFormState,
): { formData: DispatchFormState; addedMotors: DispatchAddedMotor[] } => {
  if (!batchEntries.length) {
    return {
      formData,
      addedMotors: (formData.motors ?? []).map((motor) => ({ motorId: motor.motorId })),
    };
  }

  const fromFormById = new Map((formData.motors ?? []).map((motor) => [motor.motorId, motor]));
  const batchIds = new Set(batchEntries.map((entry) => entry.motorId));

  const motors: DispatchMotorSession[] = batchEntries.map((entry) => {
    const existing = fromFormById.get(entry.motorId);
    if (existing) return existing;
    return createEmptyDispatchMotorSession(entry.motorId);
  });

  (formData.motors ?? []).forEach((motor) => {
    if (!batchIds.has(motor.motorId)) motors.push(motor);
  });

  return {
    formData: {
      ...formData,
      motors,
    },
    addedMotors: motors.map((motor) => ({ motorId: motor.motorId })),
  };
};

export const useDispatchHook = () => {
  const listParams = useSubdepartmentBatches("dispatch");
  const user = useAuthStore((state) => state.user);
  const showAlert = useAlertStore((state) => state.showAlert);
  const bumpBatchRefresh = useUserBatchRefreshStore((state) => state.bumpVersion);
  const { deleteTemp } = useFileService();

  const subDepartmentId = useMemo(
    () =>
      user?.allSubDepartments.find((subDept) => subDept.slugs?.subDept === "dispatch")
        ?.subDepartmentId,
    [user],
  );

  const [view, setView] = useState<WorkflowView>("list");
  const [activeBatch, setActiveBatch] = useState<DispatchBatch | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [loadingFormDetails, setLoadingFormDetails] = useState(false);
  const [detailsRow, setDetailsRow] = useState<any>(null);
  const [detailsData, setDetailsData] = useState<any>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [backConfirmOpen, setBackConfirmOpen] = useState(false);
  const [hasSavedDraft, setHasSavedDraft] = useState(false);
  const [formData, setFormData] = useState<DispatchFormState>(() =>
    createDefaultDispatchFormState(),
  );
  const [initialSnapshot, setInitialSnapshot] = useState("{}");
  const [draftMotorId, setDraftMotorId] = useState("");
  const [addedMotors, setAddedMotors] = useState<DispatchAddedMotor[]>([]);
  const [batchMotorEntries, setBatchMotorEntries] = useState<DispatchAddedMotor[]>([]);
  const [motorStatusById, setMotorStatusById] = useState<Record<string, DispatchMotorStatusMeta>>(
    {},
  );
  const [previousStageGate, setPreviousStageGate] =
    useState<PreviousStageApprovedUnits | null>(null);

  const resetFlowDraft = useCallback(() => {
    setDraftMotorId("");
  }, []);

  const batches = useMemo(
    () => (listParams.batches ?? []).map(normalizeBatch),
    [listParams.batches],
  );

  const formSnapshot = useMemo(
    () => JSON.stringify({ formData, addedMotors, motorStatusById }),
    [formData, addedMotors, motorStatusById],
  );

  const isFormDirty = useMemo(
    () => view === "form" && formSnapshot !== initialSnapshot,
    [view, formSnapshot, initialSnapshot],
  );

  const snapshotStateRef = useRef({ formData, addedMotors, motorStatusById });
  snapshotStateRef.current = { formData, addedMotors, motorStatusById };
  const initialSnapshotRef = useRef(initialSnapshot);
  initialSnapshotRef.current = initialSnapshot;

  const resetFormContext = useCallback(() => {
    const defaults = createDefaultDispatchFormState();
    setView("list");
    setActiveBatch(null);
    setIsEditMode(false);
    setFormData(defaults);
    setInitialSnapshot(
      JSON.stringify({ formData: defaults, addedMotors: [], motorStatusById: {} }),
    );
    setLoadingFormDetails(false);
    setActionLoading(false);
    setBackConfirmOpen(false);
    setHasSavedDraft(false);
    setDetailsRow(null);
    setDetailsData(null);
    setAddedMotors([]);
    setBatchMotorEntries([]);
    setMotorStatusById({});
    setPreviousStageGate(null);
    resetFlowDraft();
  }, [resetFlowDraft]);

  const getErrorMessage = (response: any, fallbackMessage: string) => {
    if (response?.error?.details) return response.error.details;
    if (response?.message) return response.message;
    return fallbackMessage;
  };

  const appendMotorToForm = useCallback(
    (motorId: string, dispatchDetails?: Record<string, unknown>) => {
      const trimmedId = String(motorId ?? "").trim();
      if (!trimmedId) return false;

      setFormData((prev) => appendDispatchMotorToState(prev, trimmedId, dispatchDetails));
      setAddedMotors((prev) =>
        prev.some((motor) => motor.motorId === trimmedId)
          ? prev
          : [...prev, { motorId: trimmedId }],
      );
      resetFlowDraft();
      return true;
    },
    [resetFlowDraft],
  );

  const updateSetupField = useCallback(
    <K extends keyof DispatchFormState>(field: K, value: DispatchFormState[K]) => {
      setFormData((prev) => {
        const next = { ...prev, [field]: value };
        if (field === "ndtClearance" && value !== "YES") next.ndtMomNo = "";
        if (field === "finalAcceptanceClearance" && value !== "YES") {
          next.finalAcceptanceMomNo = "";
        }
        return next;
      });
      if (field === "motorStage") setDraftMotorId("");
    },
    [],
  );

  const handleLoadDispatchForm = useCallback(
    (targetMotorId?: string) => {
      const idToLoad = String(targetMotorId || draftMotorId || "").trim();
      if (!idToLoad) return false;
      return appendMotorToForm(idToLoad);
    },
    [appendMotorToForm, draftMotorId],
  );

  const handleDraftMotorIdChange = useCallback((value: string) => {
    setDraftMotorId(value);
  }, []);

  const handleMotorDataChange = useCallback((motorId: string, dispatchData: DispatchMotorData) => {
    setFormData((prev) => ({
      ...prev,
      motors: (prev.motors ?? []).map((motor) =>
        motor.motorId === motorId ? { ...motor, dispatchData } : motor,
      ),
    }));
  }, []);

  const openFormWithResolvedData = useCallback(
    async (batch: DispatchBatch, editMode: boolean) => {
      const shouldFetchDetails =
        editMode ||
        batch.dispatchStatus === OPERATION_STATUS.IN_PROGRESS ||
        batch.dispatchStatus === OPERATION_STATUS.REJECTED ||
        String(batch.dispatchStatus ?? "")
          .toLowerCase()
          .includes("partial") ||
        !!batch.formId;

      let nextBatch = batch;
      let resolvedData = createDefaultDispatchFormState();
      let autoMotorEntries: DispatchAddedMotor[] = [];
      let nextStatuses: Record<string, DispatchMotorStatusMeta> = {};
      let rejectionReason = batch.rejectionReason ?? null;

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
            autoMotorEntries = resolveBatchMotorEntries(batch, null);
          }
        } else {
          autoMotorEntries = resolveBatchMotorEntries(batch, null);
        }

        setPreviousStageGate(
          resolvePreviousStageApprovedUnits({
            stageProgress: nextBatch.stageProgress ?? batch.stageProgress,
            currentStage: nextBatch.currentStage ?? batch.currentStage,
            currentSlug: "dispatch",
            currentSubDepartmentId: subDepartmentId,
            subDepartments: user?.allSubDepartments,
          }),
        );

        if (shouldFetchDetails) {
          if (!subDepartmentId) {
            showAlert(messages.SUB_DEPARTMENT_MISSING, "error");
            return;
          }
          const formId = resolveDispatchFormId(batch);
          if (!formId) {
            showAlert(messages.FORM_ID_MISSING, "error");
            return;
          }

          const detailsResponse = await dispatchController.fetchFormDetails({ formId });
          if (!detailsResponse?.success || !detailsResponse.data) {
            const fallback =
              detailsResponse?.statusCode === 404
                ? messages.DETAILS_NOT_FOUND
                : messages.DETAILS_FETCH_ERROR;
            showAlert(getErrorMessage(detailsResponse, fallback), "error");
            return;
          }

          resolvedData = DispatchDetailsModel.toFormState(detailsResponse.data);
          nextBatch = {
            ...nextBatch,
            formId: detailsResponse.data.formId || formId,
          };
          rejectionReason =
            detailsResponse.data.workflowInsights?.rejectionReason ?? rejectionReason;
          nextStatuses =
            detailsResponse.data.motorStatuses &&
            Object.keys(detailsResponse.data.motorStatuses).length > 0
              ? detailsResponse.data.motorStatuses
              : mapDispatchMotorStatusesFromApi(detailsResponse.data);
        } else {
          resolvedData = {
            ...resolvedData,
            motorStage: normalizeDispatchMotorStage(batch.motorStage ?? batch.motorType),
          };
        }
      } finally {
        setLoadingFormDetails(false);
      }

      const merged = mergeMotorsFromBatchAndForm(autoMotorEntries, resolvedData);
      resolvedData = merged.formData;
      const nextAddedMotors = merged.addedMotors;

      if (Object.keys(nextStatuses).length === 0) {
        nextStatuses = Object.fromEntries(
          nextAddedMotors.map((entry) => [
            entry.motorId,
            { motorSubmissionStatus: "TO_BE_INITIATED" as DispatchMotorSubmissionStatus },
          ]),
        );
      } else {
        nextAddedMotors.forEach((entry) => {
          if (!nextStatuses[entry.motorId]) {
            nextStatuses[entry.motorId] = { motorSubmissionStatus: "TO_BE_INITIATED" };
          }
        });
      }

      setActiveBatch({
        ...nextBatch,
        formId: resolveDispatchFormId(nextBatch),
        rejectionReason,
      });
      setFormData(resolvedData);
      setAddedMotors(nextAddedMotors);
      setBatchMotorEntries(autoMotorEntries);
      setMotorStatusById(nextStatuses);
      setIsEditMode(editMode);
      setView("form");
      resetFlowDraft();
      setInitialSnapshot(
        JSON.stringify({
          formData: resolvedData,
          addedMotors: nextAddedMotors,
          motorStatusById: nextStatuses,
        }),
      );
    },
    [resetFlowDraft, showAlert, subDepartmentId, user?.allSubDepartments],
  );

  const handleViewDispatchDetails = useCallback(
    async (row: DispatchBatch) => {
      if (!row.formId) {
        showAlert(messages.FORM_ID_MISSING, "error");
        return;
      }

      setDetailsLoading(true);
      const response = await dispatchController.fetchFormDetails({ formId: row.formId });
      setDetailsLoading(false);

      if (!response?.success || !response?.data) {
        showAlert(getErrorMessage(response, messages.DETAILS_FETCH_ERROR), "error");
        return;
      }

      setDetailsRow(row);
      setDetailsData(response.data);
      setView("details");
    },
    [showAlert],
  );

  const handleBackFromDetails = useCallback(() => {
    setDetailsRow(null);
    setDetailsData(null);
    setView("list");
    bumpBatchRefresh();
  }, [bumpBatchRefresh]);

  const handleFillForm = useCallback(
    async (batch: DispatchBatch) => openFormWithResolvedData(batch, false),
    [openFormWithResolvedData],
  );

  const handleEditForm = useCallback(
    async (batch: DispatchBatch) => openFormWithResolvedData(batch, true),
    [openFormWithResolvedData],
  );

  const handleBack = useCallback(() => {
    if (view === "form" && isFormDirty) {
      setBackConfirmOpen(true);
      return;
    }
    bumpBatchRefresh();
    resetFormContext();
  }, [view, isFormDirty, bumpBatchRefresh, resetFormContext]);

  const handleDiscardAndBack = useCallback(async () => {
    setBackConfirmOpen(false);
    await discardWorkflowSnapshotForm({
      subDepartmentId,
      initialSnapshot: initialSnapshotRef.current,
      currentState: snapshotStateRef.current,
      deleteTemp,
      extractTempFileIds: collectTempFileIdsFromDispatchForm,
      resetForm: () => {
        bumpBatchRefresh();
        resetFormContext();
      },
    });
  }, [bumpBatchRefresh, deleteTemp, resetFormContext, subDepartmentId]);

  const getMotorStatus = useCallback(
    (motorId: string): DispatchMotorSubmissionStatus =>
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
      return isDispatchMotorEditable(getMotorStatus(motorId));
    },
    [addedMotors, getMotorStatus, previousStageGate],
  );

  const submitMotor = useCallback(
    async (motorId: string, intent: "draft" | "submit") => {
      if (!activeBatch) return false;
      if (!subDepartmentId) {
        showAlert(messages.SUB_DEPARTMENT_MISSING, "error");
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
          getMotorStatus(motorId) === "APPROVED"
            ? messages.MOTOR_LOCKED_APPROVED
            : messages.MOTOR_LOCKED_WAITING,
          "warning",
        );
        return false;
      }

      const motor = (formData.motors ?? []).find((entry) => entry.motorId === motorId);
      if (!motor || !isDispatchMotorSetupReady(motor) || !motor.formLoaded) {
        showAlert(messages.SCHEMA_NOT_LOADED, "warning");
        return false;
      }
      if (hasIncompleteDispatchUploads(formData)) {
        showAlert(messages.FILE_UPLOAD_PENDING, "warning");
        return false;
      }
      if (intent === "submit" && !hasMotorDispatchValue(formData, motorId)) {
        showAlert(messages.EMPTY_FORM_ERROR, "warning");
        return false;
      }
      if (intent === "draft" && !hasMotorDispatchValue(formData, motorId)) {
        showAlert(messages.EMPTY_FORM_ERROR, "warning");
        return false;
      }

      const motorSubmissionType: DispatchMotorSubmissionType =
        intent === "draft" ? "DRAFT" : "SUBMIT";
      const isCreateFlow = !resolveDispatchFormId(activeBatch);
      const options = { targetMotorIds: [motorId], motorSubmissionType };

      let mappedPayload;
      if (isCreateFlow) {
        if (!activeBatch.batchId) {
          showAlert(messages.BATCH_ID_MISSING, "error");
          return false;
        }
        mappedPayload = mapDispatchFormStateToBackendPayload(
          formData,
          activeBatch.batchId,
          subDepartmentId,
          "DRAFT",
          options,
        );
      } else {
        const formId = resolveDispatchFormId(activeBatch);
        if (!formId) {
          showAlert(messages.FORM_ID_MISSING, "error");
          return false;
        }
        mappedPayload = mapDispatchFormStateToUpdatePayload(
          formData,
          formId,
          activeBatch.batchId,
          subDepartmentId,
          "DRAFT",
          options,
        );
      }

      if (!mappedPayload.motors?.length) {
        showAlert(messages.EMPTY_FORM_ERROR, "warning");
        return false;
      }

      setActionLoading(true);
      try {
        const response = isCreateFlow
          ? await dispatchController.createForm(mappedPayload)
          : await dispatchController.updateForm(mappedPayload);

        if (!response?.success) {
          showAlert(
            getErrorMessage(
              response,
              isCreateFlow ? messages.CREATE_FAILED : messages.UPDATE_FAILED,
            ),
            "error",
          );
          return false;
        }

        const nextFormId = response.data?.formId ?? activeBatch.formId ?? null;
        setActiveBatch((prev) => (prev ? { ...prev, formId: nextFormId } : prev));
        setHasSavedDraft(true);

        const nextStatus: DispatchMotorSubmissionStatus =
          intent === "draft" ? "IN_PROGRESS" : "WAITING_FOR_APPROVAL";

        setMotorStatusById((prev) => {
          const updated: Record<string, DispatchMotorStatusMeta> = {
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
                  (String(entry.motorSubmissionStatus ?? "").toUpperCase() as DispatchMotorSubmissionStatus) ||
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
          intent === "draft"
            ? messages.MOTOR_SAVE_DRAFT_SUCCESS(motorId)
            : messages.MOTOR_SUBMIT_SUCCESS(motorId),
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
    batches,
    view,
    activeBatch,
    isEditMode,
    formData,
    isFormDirty,
    draftMotorId,
    addedMotors,
    batchMotorEntries,
    motorStatusById,
    getMotorStatus,
    isMotorEditable: checkMotorEditable,
    previousStageGate,
    actionLoading,
    backConfirmOpen,
    subDepartmentId,
    handleFillForm,
    handleEditForm,
    handleBack,
    handleDiscardAndBack,
    setBackConfirmOpen,
    updateSetupField,
    handleDraftMotorIdChange,
    handleLoadDispatchForm,
    handleMotorDataChange,
    handleSaveMotorDraft,
    handleSubmitMotor,
    detailsRow,
    detailsData,
    detailsLoading,
    handleViewDispatchDetails,
    handleBackFromDetails,
  };
};

export default useDispatchHook;
