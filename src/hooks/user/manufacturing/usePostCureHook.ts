import { useCallback, useMemo, useRef, useState } from "react";
import { STRINGS } from "../../../app/config/strings";
import { useAlertStore } from "../../../app/store/alertStore";
import { useAuthStore } from "../../../app/store/authStore";
import { useUserBatchRefreshStore } from "../../../app/store/userBatchRefreshStore";
import postCureController from "../../../controllers/user/manufacturing/postCureController";
import {
  areAllPostCureMotorsApproved,
  createDefaultPostCureFormState,
  createEmptyPostCureMotorSession,
  isPostCureMotorEditable,
  mapPostCureDetailsToFormState,
  mapPostCureFormStateToPayload,
  mapPostCureMotorStatusesFromApi,
  type PostCureFormState,
  type PostCureMotorSession,
  type PostCureMotorStatusMeta,
  type PostCureMotorSubmissionStatus,
  type PostCureMotorSubmissionType,
} from "../../../data/models/user/PostCureFormModel";
import {
  collectTempFileIdsFromPostCureForm,
  hasIncompletePostCureUploads,
} from "../../../data/models/user/PostCureMotorDataModel";
import { batchManagementController } from "../../../controllers/admin/BatchManagement/batchManagementController";
import {
  isPostCureInhibitionOperation,
  mapPostCureInhibitorTypeToApi,
  mapPostCureOperationToApi,
} from "./postCureConfig";
import {
  canLoadPostCureMotorForm,
  enrichPostCureBatchFromDetails,
  mergePostCureMotorsFromBatchAndForm,
  resolvePostCureMotorsFromBatch,
  type PostCureAddedMotor,
} from "./postCureFlowConfig";
import { MANUFACTURING_STATUS } from "./manufacturingWorkflowData";
import { isManufacturingContinueFillingStatus } from "../../../hooks/operationStatus";
import { useSubdepartmentBatches } from "../useSubdepartmentBatches";
import {
  isMotorEnabledByPreviousStage,
  isMotorEnabledForWorkflow,
  pickFirstPreviousStageEnabledMotorId,
  resolvePreviousStageApprovedUnits,
  type PreviousStageApprovedUnits,
} from "../previousStageApproval";
import { useFileService } from "../../../hooks/useFileService";
import { discardWorkflowSnapshotForm } from "../../../utils/workflowDiscard";

type WorkflowView = "list" | "form" | "details";

type PostCureBatch = {
  batchId: string;
  pcStatus?: string;
  formId?: string | null;
  motorId?: string;
  motorIds?: Array<string | number>;
  [key: string]: any;
};

const PC_STATUS = MANUFACTURING_STATUS;
const parseStatus = (status: string | undefined) => String(status ?? "").toLowerCase();

const mapMotorsToAdded = (motors: PostCureMotorSession[]): PostCureAddedMotor[] =>
  motors.map((motor) => ({
    motorId: motor.motorId,
    motorReceiptDate: motor.motorReceiptDate,
  }));

const resolveInhibitorType = (operation: string, inhibitorType: string) =>
  isPostCureInhibitionOperation(operation) ? inhibitorType : "";

export const usePostCureHook = () => {
  const listParams = useSubdepartmentBatches("post-cure-operations");
  const user = useAuthStore((s) => s.user);
  const showAlert = useAlertStore((state) => state.showAlert);
  const bumpBatchRefresh = useUserBatchRefreshStore((state) => state.bumpVersion);
  const { deleteTemp } = useFileService();

  const subDepartmentId = useMemo(
    () =>
      user?.allSubDepartments.find((sd) => sd.slugs?.subDept === "post-cure-operations")
        ?.subDepartmentId,
    [user],
  );

  const [view, setView] = useState<WorkflowView>("list");
  const [activeBatch, setActiveBatch] = useState<PostCureBatch | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [loadingFormDetails, setLoadingFormDetails] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [backConfirmOpen, setBackConfirmOpen] = useState(false);
  const [hasSavedDraft, setHasSavedDraft] = useState(false);
  const [formData, setFormData] = useState<PostCureFormState>(createDefaultPostCureFormState());
  const [initialSnapshot, setInitialSnapshot] = useState("{}");
  const [addedMotors, setAddedMotors] = useState<PostCureAddedMotor[]>([]);
  const [activeMotorId, setActiveMotorId] = useState("");
  const [draftMotorReceiptDate, setDraftMotorReceiptDate] = useState("");
  const [draftOperation, setDraftOperation] = useState("");
  const [draftInhibitorType, setDraftInhibitorType] = useState("");
  const [detailsRow, setDetailsRow] = useState<any>(null);
  const [detailsData, setDetailsData] = useState<any>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [motorStatusById, setMotorStatusById] = useState<Record<string, PostCureMotorStatusMeta>>(
    {},
  );
  const [previousStageGate, setPreviousStageGate] = useState<PreviousStageApprovedUnits | null>(
    null,
  );

  const clearSetupDrafts = useCallback(() => {
    setDraftMotorReceiptDate("");
    setDraftOperation("");
    setDraftInhibitorType("");
  }, []);

  const formSnapshot = useMemo(() => JSON.stringify(formData), [formData]);
  const isFormDirty = useMemo(
    () => view === "form" && formSnapshot !== initialSnapshot,
    [view, formSnapshot, initialSnapshot],
  );

  const snapshotStateRef = useRef(formData);
  snapshotStateRef.current = formData;
  const initialSnapshotRef = useRef(initialSnapshot);
  initialSnapshotRef.current = initialSnapshot;

  const resetFormContext = useCallback(() => {
    const defaults = createDefaultPostCureFormState();
    setView("list");
    setActiveBatch(null);
    setDetailsRow(null);
    setDetailsData(null);
    setDetailsLoading(false);
    setIsEditMode(false);
    setLoadingFormDetails(false);
    setActionLoading(false);
    setBackConfirmOpen(false);
    setHasSavedDraft(false);
    setFormData(defaults);
    setInitialSnapshot(JSON.stringify(defaults));
    setAddedMotors([]);
    setActiveMotorId("");
    setMotorStatusById({});
    clearSetupDrafts();
  }, [clearSetupDrafts]);

  const getErrorMessage = (response: any, fallbackMessage: string) => {
    if (response?.error?.details) return response.error.details;
    if (response?.message) return response.message;
    return fallbackMessage;
  };

  const openFormWithResolvedData = useCallback(
    async (
      batch: PostCureBatch,
      editMode: boolean,
      options?: { silent?: boolean; preserveActiveMotorId?: string },
    ) => {
      if (!batch.batchId) {
        showAlert(STRINGS.MANUFACTURING.POST_CURE.BATCH_ID_MISSING, "error");
        return;
      }

      const silent = Boolean(options?.silent);
      const preserveActiveMotorId = options?.preserveActiveMotorId;
      const shouldFetchDetails =
        silent ||
        editMode ||
        isManufacturingContinueFillingStatus(batch.pcStatus) ||
        parseStatus(batch.pcStatus) === parseStatus(PC_STATUS.REJECTED) ||
        Boolean(String(batch.formId ?? "").trim());

      let nextBatch = batch;
      let nextFormData = createDefaultPostCureFormState();
      let detailsResponse: any = null;

      if (!silent) setLoadingFormDetails(true);
      try {
        try {
          const batchDetails = await batchManagementController.getBatchById(batch.batchId);
          nextBatch = enrichPostCureBatchFromDetails(batch, batchDetails);
        } catch (error) {
          console.error("Unable to resolve post-cure batch motor details", error);
        }

        const gate = resolvePreviousStageApprovedUnits({
          stageProgress: nextBatch.stageProgress ?? batch.stageProgress,
          currentStage: nextBatch.currentStage ?? batch.currentStage,
          currentSlug: "post-cure-operations",
          currentSubDepartmentId: subDepartmentId,
          subDepartments: user?.allSubDepartments,
        });
        setPreviousStageGate(gate);

        if (shouldFetchDetails) {
          if (!subDepartmentId) {
            showAlert(STRINGS.MANUFACTURING.POST_CURE.SUB_DEPARTMENT_MISSING, "error");
            return;
          }

          const formId = String(batch.formId ?? nextBatch.formId ?? "").trim();
          if (!formId) {
            showAlert(STRINGS.MANUFACTURING.POST_CURE.FORM_ID_MISSING, "error");
            return;
          }

          detailsResponse = await postCureController.fetchFormDetails({
            formId,
          });

          if (!detailsResponse?.success || !detailsResponse?.data) {
            const fallback =
              detailsResponse?.statusCode === 404
                ? STRINGS.MANUFACTURING.POST_CURE.DETAILS_NOT_FOUND
                : STRINGS.MANUFACTURING.POST_CURE.DETAILS_FETCH_ERROR;
            showAlert(getErrorMessage(detailsResponse, fallback), "error");
            return;
          }

          nextBatch = {
            ...nextBatch,
            formId: detailsResponse.data.formId || formId,
            pcStatus: detailsResponse.data.status ?? nextBatch.pcStatus,
          };
          nextFormData = mapPostCureDetailsToFormState(detailsResponse.data);
        }

        const nextAddedMotors = mergePostCureMotorsFromBatchAndForm(
          nextBatch,
          mapMotorsToAdded(nextFormData.motors),
        );

        if (!nextAddedMotors.length) {
          const fromBatchOnly = resolvePostCureMotorsFromBatch(nextBatch);
          if (!fromBatchOnly.length) {
            showAlert(STRINGS.MANUFACTURING.POST_CURE.BATCH_MOTOR_DETAILS_MISSING, "error");
            return;
          }
        }

        const motorsForTabs =
          nextAddedMotors.length > 0 ? nextAddedMotors : resolvePostCureMotorsFromBatch(nextBatch);

        const nextActiveMotorId =
          preserveActiveMotorId &&
          motorsForTabs.some((motor) => motor.motorId === preserveActiveMotorId)
            ? preserveActiveMotorId
            : pickFirstPreviousStageEnabledMotorId(
                motorsForTabs.map((motor) => motor.motorId),
                gate,
              );

        setActiveBatch(nextBatch);
        setIsEditMode(editMode);
        setFormData(nextFormData);
        setInitialSnapshot(JSON.stringify(nextFormData));
        setAddedMotors(motorsForTabs);
        setActiveMotorId(nextActiveMotorId);
        setMotorStatusById(
          detailsResponse?.data
            ? mapPostCureMotorStatusesFromApi(detailsResponse.data)
            : Object.fromEntries(
                motorsForTabs.map((motor) => [
                  motor.motorId,
                  { motorSubmissionStatus: "TO_BE_INITIATED" as PostCureMotorSubmissionStatus },
                ]),
              ),
        );
        if (!silent) {
          clearSetupDrafts();
        }
        setView("form");
      } finally {
        if (!silent) setLoadingFormDetails(false);
      }
    },
    [showAlert, subDepartmentId, clearSetupDrafts, user?.allSubDepartments],
  );
  const handleViewPostCureDetails = useCallback(async (row: any) => {
    if (!row?.formId) return;

    setDetailsLoading(true);

    try {
      const response = await postCureController.fetchFormDetails({
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
    async (batch: PostCureBatch) => await openFormWithResolvedData(batch, false),
    [openFormWithResolvedData],
  );

  const handleEditForm = useCallback(
    async (batch: PostCureBatch) => await openFormWithResolvedData(batch, true),
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
      extractTempFileIds: collectTempFileIdsFromPostCureForm,
      deleteTemp,
      resetForm: () => {
        bumpBatchRefresh();
        resetFormContext();
      },
    });
  }, [bumpBatchRefresh, deleteTemp, resetFormContext, subDepartmentId]);

  const handleDraftOperationChange = useCallback((operation: string) => {
    setDraftOperation(operation);
    if (!isPostCureInhibitionOperation(operation)) {
      setDraftInhibitorType("");
    }
  }, []);

  const handleDraftInhibitorTypeChange = useCallback((inhibitorType: string) => {
    setDraftInhibitorType(inhibitorType);
  }, []);

  const handleMotorSessionChange = useCallback((motorId: string, next: PostCureMotorSession) => {
    setFormData((prev) => ({
      ...prev,
      motors: (prev.motors ?? []).map((motor) => (motor.motorId === motorId ? next : motor)),
    }));
  }, []);

  const handleRemoveMotor = useCallback(
    (motorIdToRemove: string) => {
      const status = motorStatusById[motorIdToRemove]?.motorSubmissionStatus ?? "TO_BE_INITIATED";
      if (status !== "TO_BE_INITIATED") {
        showAlert(STRINGS.MANUFACTURING.POST_CURE.MOTOR_LOCKED_WAITING, "warning");
        return;
      }

      setFormData((prev) => {
        const remainingMotors = (prev.motors ?? []).filter(
          (motor) => motor.motorId !== motorIdToRemove,
        );
        return {
          ...prev,
          motors: remainingMotors,
          formLoaded: remainingMotors.some((motor) => motor.formLoaded),
        };
      });

      setAddedMotors((prev) =>
        prev.map((motor) =>
          motor.motorId === motorIdToRemove ? { ...motor, motorReceiptDate: "" } : motor,
        ),
      );
      clearSetupDrafts();
    },
    [clearSetupDrafts, motorStatusById, showAlert],
  );

  const handleActiveMotorChange = useCallback(
    (motorId: string) => {
      setActiveMotorId(motorId);
      const entry = addedMotors.find((motor) => motor.motorId === motorId);
      const session = (formData.motors ?? []).find((motor) => motor.motorId === motorId);
      if (session?.formLoaded) {
        clearSetupDrafts();
        return;
      }
      setDraftMotorReceiptDate(entry?.motorReceiptDate || "");
      setDraftOperation(session?.operation || "");
      setDraftInhibitorType(session?.inhibitorType || "");
    },
    [addedMotors, clearSetupDrafts, formData.motors],
  );

  const handleLoadForm = useCallback(() => {
    const motorId = String(activeMotorId ?? "").trim();
    const inhibitorType = resolveInhibitorType(draftOperation, draftInhibitorType);
    const alreadyLoaded = Boolean(
      (formData.motors ?? []).find((motor) => motor.motorId === motorId)?.formLoaded,
    );

    if (
      !canLoadPostCureMotorForm({
        motorId,
        motorReceiptDate: draftMotorReceiptDate,
        operation: draftOperation,
        inhibitorType,
        alreadyLoaded,
      })
    ) {
      return;
    }

    const motorSession = createEmptyPostCureMotorSession(
      motorId,
      draftMotorReceiptDate.trim(),
      draftOperation,
      inhibitorType,
    );
    if (!motorSession) {
      showAlert(STRINGS.MANUFACTURING.POST_CURE.OPERATION_MISSING, "warning");
      return;
    }

    setFormData((prev) => {
      const others = (prev.motors ?? []).filter((motor) => motor.motorId !== motorId);
      return {
        formLoaded: true,
        motors: [...others, motorSession],
      };
    });
    setAddedMotors((prev) =>
      prev.map((motor) =>
        motor.motorId === motorId
          ? { motorId, motorReceiptDate: motorSession.motorReceiptDate }
          : motor,
      ),
    );
    clearSetupDrafts();
  }, [
    activeMotorId,
    draftMotorReceiptDate,
    draftOperation,
    draftInhibitorType,
    formData.motors,
    clearSetupDrafts,
    showAlert,
  ]);
  const resolveRootOperationFields = useCallback((motors: PostCureMotorSession[]) => {
    const firstMotor = motors[0];
    if (!firstMotor) {
      return {
        operationType: null as "LOOSE_FLAP_FILLING" | "INHIBITION" | null,
        inhibitorType: undefined as "IR1" | "HEMCOAT_3K" | "NOT_APPLICABLE" | undefined,
      };
    }
    const operationType = mapPostCureOperationToApi(firstMotor.operation);
    const inhibitorType = isPostCureInhibitionOperation(firstMotor.operation)
      ? (mapPostCureInhibitorTypeToApi(firstMotor.inhibitorType) ?? undefined)
      : undefined;
    return { operationType, inhibitorType };
  }, []);

  const submitMotor = useCallback(
    async (motorId: string, intent: "draft" | "submit") => {
      if (!activeBatch) return false;

      if (!subDepartmentId) {
        showAlert(STRINGS.MANUFACTURING.POST_CURE.SUB_DEPARTMENT_MISSING, "error");
        return false;
      }

      if (!isMotorEnabledByPreviousStage(motorId, previousStageGate)) {
        showAlert(STRINGS.MANUFACTURING.PREVIOUS_STAGE_UNIT_DISABLED, "warning");
        return false;
      }

      const targetMotor = (formData.motors ?? []).find((motor) => motor.motorId === motorId);
      if (!targetMotor?.formLoaded) {
        showAlert(STRINGS.MANUFACTURING.POST_CURE.FORM_NOT_LOADED, "warning");
        return false;
      }

      if (hasIncompletePostCureUploads({ motors: [targetMotor] })) {
        showAlert(STRINGS.MANUFACTURING.POST_CURE.FILE_UPLOAD_PENDING, "warning");
        return false;
      }

      if (!isPostCureMotorEditable(motorStatusById[motorId]?.motorSubmissionStatus)) {
        showAlert(STRINGS.MANUFACTURING.POST_CURE.MOTOR_LOCKED_WAITING, "warning");
        return false;
      }

      const motorSubmissionType: PostCureMotorSubmissionType =
        intent === "draft" ? "DRAFT" : "SUBMIT";
      const body = mapPostCureFormStateToPayload(formData, {
        targetMotorIds: [motorId],
        motorSubmissionType,
      });
      const { operationType, inhibitorType } = resolveRootOperationFields([targetMotor]);
      if (!operationType) {
        showAlert(STRINGS.MANUFACTURING.POST_CURE.OPERATION_MISSING, "warning");
        return false;
      }

      const status = parseStatus(activeBatch.pcStatus);
      const isCreateFlow = status === parseStatus(PC_STATUS.TO_BE_INITIATED) && !activeBatch.formId;

      setActionLoading(true);
      try {
        let response: any;

        if (isCreateFlow) {
          if (!activeBatch.batchId) {
            showAlert(STRINGS.MANUFACTURING.POST_CURE.BATCH_ID_MISSING, "error");
            return false;
          }
          response = await postCureController.createForm({
            batchId: activeBatch.batchId,
            subDepartmentId,
            formSubmissionType: "DRAFT",
            operationType,
            ...(inhibitorType ? { inhibitorType } : {}),
            motors: body.motors,
          });
        } else {
          if (!activeBatch.formId) {
            showAlert(STRINGS.MANUFACTURING.POST_CURE.FORM_ID_MISSING, "error");
            return false;
          }
          response = await postCureController.updateForm({
            formId: activeBatch.formId,
            batchId: activeBatch.batchId,
            subDepartmentId,
            formSubmissionType: "DRAFT",
            operationType,
            ...(inhibitorType ? { inhibitorType } : {}),
            motors: body.motors,
          });
        }

        if (!response?.success) {
          showAlert(getErrorMessage(response, `Failed to ${intent} motor ${motorId}.`), "error");
          return false;
        }
        const nextFormId = String(response.data?.formId ?? activeBatch.formId ?? "").trim();
        const refreshedBatch: PostCureBatch = {
          ...activeBatch,
          formId: nextFormId || activeBatch.formId,
          pcStatus:
            intent === "draft"
              ? PC_STATUS.IN_PROGRESS
              : (response.data?.status ?? activeBatch.pcStatus),
        };

        setActiveBatch(refreshedBatch);
        setInitialSnapshot(formSnapshot);
        setHasSavedDraft(true);
        showAlert(
          intent === "draft"
            ? `Motor ${motorId} draft saved successfully.`
            : `Motor ${motorId} submitted for approval.`,
          "success",
          { autoCloseMs: 2200 },
        );

        if (nextFormId) {
          const statusForBanner = String(
            response.data?.status ?? activeBatch.pcStatus ?? "IN_PROGRESS",
          )
            .trim()
            .toUpperCase()
            .replace(/\s+/g, "_");
          const stillRejectedEdit = statusForBanner === "REJECTED";

          await openFormWithResolvedData(refreshedBatch, stillRejectedEdit, {
            silent: true,
            preserveActiveMotorId: motorId,
          });
        } else {
          setInitialSnapshot(formSnapshot);
        }

        return true;
      } finally {
        setActionLoading(false);
      }
    },
    [
      activeBatch,
      formData,
      formSnapshot,
      motorStatusById,
      openFormWithResolvedData,
      previousStageGate,
      resolveRootOperationFields,
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

  const getMotorStatus = useCallback(
    (motorId: string): PostCureMotorSubmissionStatus =>
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
      return isPostCureMotorEditable(getMotorStatus(motorId));
    },
    [addedMotors, getMotorStatus, previousStageGate],
  );

  const handleSubmitForFinalApproval = useCallback(async () => {
    if (!activeBatch?.formId) return false;
    if (!subDepartmentId) return false;
    if (!areAllPostCureMotorsApproved(motorStatusById)) return false;

    setActionLoading(true);
    try {
      const detailsRes = await postCureController.fetchFormDetails({
        formId: activeBatch.formId,
      });

      if (!detailsRes?.success || !detailsRes?.data) {
        showAlert("Failed to fetch latest form data for final approval.", "error");
        return false;
      }

      const latestPayload = detailsRes.data?.postCureDetails ?? detailsRes.data;
      const rawMotors = Array.isArray(latestPayload?.motors) ? latestPayload.motors : [];
      const rootOperationType =
        mapPostCureOperationToApi(String(latestPayload?.operation ?? "")) ||
        (String(latestPayload?.operationType ?? "").trim() as
          "LOOSE_FLAP_FILLING" | "INHIBITION") ||
        mapPostCureOperationToApi(String(rawMotors[0]?.operation ?? "")) ||
        (String(rawMotors[0]?.operationType ?? "").trim() as "LOOSE_FLAP_FILLING" | "INHIBITION");

      if (!rootOperationType) {
        showAlert(STRINGS.MANUFACTURING.POST_CURE.OPERATION_MISSING, "warning");
        return false;
      }

      const rootInhibitorType =
        mapPostCureInhibitorTypeToApi(String(latestPayload?.inhibitorType ?? "")) ||
        mapPostCureInhibitorTypeToApi(String(rawMotors[0]?.inhibitorType ?? "")) ||
        undefined;

      const formState = mapPostCureDetailsToFormState(detailsRes.data);
      const payloadBody = mapPostCureFormStateToPayload(formState, {
        motorSubmissionType: "SUBMIT",
      });

      const response = await postCureController.updateForm({
        formId: activeBatch.formId,
        batchId: activeBatch.batchId,
        subDepartmentId,
        formSubmissionType: "SUBMIT",
        operationType: rootOperationType as "LOOSE_FLAP_FILLING" | "INHIBITION",
        ...(rootInhibitorType ? { inhibitorType: rootInhibitorType } : {}),
        motors: payloadBody.motors,
      });

      if (!response?.success) {
        showAlert(getErrorMessage(response, "Final approval submission failed."), "error");
        return false;
      }

      showAlert("Form submitted for final approval successfully.", "success", {
        autoCloseMs: 2200,
      });
      await listParams.refreshUserBatches();
      resetFormContext();
      return true;
    } finally {
      setActionLoading(false);
    }
  }, [activeBatch, listParams, motorStatusById, resetFormContext, showAlert, subDepartmentId]);

  const usedMotorIds = useMemo(() => addedMotors.map((motor) => motor.motorId), [addedMotors]);
  const draftInhibitor = resolveInhibitorType(draftOperation, draftInhibitorType);
  const activeMotorAlreadyLoaded = useMemo(
    () =>
      Boolean((formData.motors ?? []).find((motor) => motor.motorId === activeMotorId)?.formLoaded),
    [activeMotorId, formData.motors],
  );

  const canLoadForm = useMemo(
    () =>
      canLoadPostCureMotorForm({
        motorId: activeMotorId,
        motorReceiptDate: draftMotorReceiptDate,
        operation: draftOperation,
        inhibitorType: draftInhibitor,
        alreadyLoaded: activeMotorAlreadyLoaded,
      }),
    [
      activeMotorId,
      draftMotorReceiptDate,
      draftOperation,
      draftInhibitor,
      activeMotorAlreadyLoaded,
    ],
  );

  return {
    ...listParams,
    loading: listParams.loading || loadingFormDetails,
    loadingFormDetails,
    view,
    activeBatch,
    isEditMode,
    formData,
    addedMotors,
    activeMotorId,
    draftMotorReceiptDate,
    draftOperation,
    draftInhibitorType,
    isFormDirty,
    actionLoading,
    canLoadForm,
    usedMotorIds,
    subDepartmentId,
    backConfirmOpen,
    setBackConfirmOpen,
    setDraftMotorReceiptDate,
    handleFillForm,
    handleEditForm,
    handleBack,
    handleDiscardAndBack,
    handleDraftOperationChange,
    handleDraftInhibitorTypeChange,
    handleMotorSessionChange,
    handleRemoveMotor,
    handleActiveMotorChange,
    handleLoadForm,
    handleSaveMotorDraft,
    handleSubmitMotor,
    handleSubmitForFinalApproval,
    motorStatusById,
    previousStageGate,
    getMotorStatus,
    isMotorEditable: checkMotorEditable,
    detailsRow,
    detailsData,
    detailsLoading,
    handleViewPostCureDetails,
    handleBackFromDetails,
  };
};

export default usePostCureHook;
