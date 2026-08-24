import { useCallback, useMemo, useState } from "react";
import { STRINGS } from "../../../app/config/strings";
import { useAlertStore } from "../../../app/store/alertStore";
import { useAuthStore } from "../../../app/store/authStore";
import { useUserBatchRefreshStore } from "../../../app/store/userBatchRefreshStore";
import { batchManagementController } from "../../../controllers/admin/BatchManagement/batchManagementController";
import type { IdentificationSheet } from "../../../data/models/admin/BatchManagement/BatchManagementModel";
import casePreparationController from "../../../controllers/user/manufacturing/casePreparationController";
import {
  buildCasePreparationFormBody,
  createDefaultCasePreparationFormState,
  createEmptyMotorSession,
  hasMotorCasePreparationValue,
  isMotorEditable,
  mapCasePreparationDetailsFromSavedForm,
  mapCasePreparationDetailsToFormState,
  mapCasePreparationMotorStatusesFromApi,
  type CasePrepMotorSession,
  type CasePreparationFormState,
  type MotorStatusMeta,
  type MotorSubmissionStatus,
} from "../../../data/models/user/CasePreparationFormModel";
import {
  collectTempFileIdsFromCasePrepForm,
  createEmptyCasePrepMotorData,
  hasIncompleteCasePrepUploads,
  type CasePrepMotorData,
} from "../../../data/models/user/CasePrepMotorDataModel";
import {
  isMainMotorBatch,
  isSubscaleBatch,
  resolveCasePrepBatchMotorCount,
  resolveCasePrepMotorsFromBatch,
  type CasePrepAddedMotor,
} from "./casePreparationFlowConfig";
import { isManufacturingContinueFillingStatus } from "../../operationStatus";
import { useSubdepartmentBatches } from "../useSubdepartmentBatches";
import { isMotorEnabledForWorkflow } from "../previousStageApproval";
import { useFileService } from "../../../hooks/useFileService";
import { discardWorkflowForm } from "../../../utils/workflowDiscard";

type WorkflowView = "list" | "form" | "details";

type CasePrepBatch = {
  batchId: string;
  cpStatus?: string;
  formId?: string | null;
  batchType?: string;
  motorId?: string;
  motorIds?: Array<string | number>;
  numberOfMotors?: number | string;
  identificationSheet?: IdentificationSheet | { prcApprovalDate?: string } | null;
  prrcClearanceDate?: string;
  [key: string]: any;
};

const mapCasePrepBatchTypeForApi = (batchType: string | undefined | null) => {
  const normalized = String(batchType ?? "").toUpperCase();
  if (normalized === "MAIN" || normalized === "MAIN_BATCH") return "MAIN";
  if (normalized === "SUBSCALE" || normalized === "SUBSCALE_BATCH") return "SUBSCALE";
  return normalized;
};

const resolveFormId = (batch: CasePrepBatch | null | undefined) => {
  const formId = String(batch?.formId ?? "").trim();
  return formId || null;
};

const buildAddedMotorsFromForm = (formData: CasePreparationFormState): CasePrepAddedMotor[] =>
  (formData.motors ?? []).map((motor) => ({
    motorId: motor.motorId,
    prrcClearanceDate: motor.prrcClearanceDate,
  }));

/**
 * Always show every batch motor as a tab. Overlay saved form data when present
 * so a partial draft (1 of N motors submitted) still lists the remaining motors.
 */
const mergeMotorsFromBatchAndForm = (
  batch: CasePrepBatch,
  formData: CasePreparationFormState,
): { formData: CasePreparationFormState; addedMotors: CasePrepAddedMotor[] } => {
  const fromBatch = resolveCasePrepMotorsFromBatch(batch);
  if (!fromBatch.length) {
    return {
      formData,
      addedMotors: buildAddedMotorsFromForm(formData),
    };
  }

  const fromFormById = new Map((formData.motors ?? []).map((motor) => [motor.motorId, motor]));
  const batchIds = new Set(fromBatch.map((entry) => entry.motorId));

  const motors: CasePrepMotorSession[] = fromBatch.map((entry) => {
    const existing = fromFormById.get(entry.motorId);
    if (existing) {
      return {
        ...existing,
        prrcClearanceDate: existing.prrcClearanceDate || entry.prrcClearanceDate,
        data: existing.data ?? createEmptyCasePrepMotorData(),
      };
    }
    return createEmptyMotorSession(entry.motorId, entry.prrcClearanceDate);
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
      prrcClearanceDate: motor.prrcClearanceDate,
    })),
  };
};

const enrichBatchFromDetails = (
  batch: CasePrepBatch,
  batchDetails: Awaited<ReturnType<typeof batchManagementController.getBatchById>>,
): CasePrepBatch | null => {
  if (!batchDetails) return null;

  return {
    ...batch,
    batchType: batch.batchType ?? batchDetails.batchType ?? batch.batchType,
    motorIds: batchDetails.motorIds?.length ? batchDetails.motorIds : batch.motorIds,
    numberOfMotors: batchDetails.numberOfMotors ?? batch.numberOfMotors,
    motorId:
      batchDetails.motorIds?.length > 0
        ? batchDetails.motorIds.join(", ")
        : batch.motorId,
    identificationSheet: batchDetails.identificationSheet,
    stageProgress:
      (batchDetails as { stageProgress?: unknown }).stageProgress ?? batch.stageProgress,
    currentStage:
      (batchDetails as { currentStage?: unknown }).currentStage ?? batch.currentStage,
  };
};

/** Create motor shells with empty typed data — no schema. */
const initializeCasePrepFormFromBatch = (
  batch: CasePrepBatch,
  baseFormData: CasePreparationFormState = createDefaultCasePreparationFormState(),
): { formData: CasePreparationFormState; addedMotors: CasePrepAddedMotor[] } => {
  const motorsFromBatch = resolveCasePrepMotorsFromBatch(batch);

  if (isSubscaleBatch(batch.batchType)) {
    return {
      formData: {
        ...baseFormData,
        motors: [],
        subscaleData: baseFormData.subscaleData ?? createEmptyCasePrepMotorData(),
      },
      addedMotors: [],
    };
  }

  const sessions: CasePrepMotorSession[] = motorsFromBatch.map((entry) =>
    createEmptyMotorSession(entry.motorId, entry.prrcClearanceDate),
  );

  return {
    formData: {
      ...baseFormData,
      motors: sessions,
      subscaleData: null,
    },
    addedMotors: motorsFromBatch,
  };
};

export const useCasePreparationHook = () => {
  const listParams = useSubdepartmentBatches("case-preparation");
  const user = useAuthStore((s) => s.user);
  const showAlert = useAlertStore((state) => state.showAlert);
  const bumpBatchRefresh = useUserBatchRefreshStore((state) => state.bumpVersion);
  const { deleteTemp } = useFileService();

  const subDepartmentId = useMemo(
    () =>
      user?.allSubDepartments.find((sd) => sd.slugs?.subDept === "case-preparation")
        ?.subDepartmentId,
    [user],
  );

  const [view, setView] = useState<WorkflowView>("list");
  const [activeBatch, setActiveBatch] = useState<CasePrepBatch | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [loadingFormDetails, setLoadingFormDetails] = useState(false);
  const [detailsRow, setDetailsRow] = useState<any>(null);
  const [detailsData, setDetailsData] = useState<any>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [backConfirmOpen, setBackConfirmOpen] = useState(false);
  const [hasSavedDraft, setHasSavedDraft] = useState(false);
  const [isFormDirty, setIsFormDirty] = useState(false);
  const [formData, setFormData] = useState<CasePreparationFormState>(
    createDefaultCasePreparationFormState(),
  );

  const [addedMotors, setAddedMotors] = useState<CasePrepAddedMotor[]>([]);
  const [motorStatusById, setMotorStatusById] = useState<Record<string, MotorStatusMeta>>({});

  const resetFlowDraft = useCallback(() => {
    setAddedMotors([]);
    setMotorStatusById({});
  }, []);

  const resetFormContext = useCallback(() => {
    const defaults = createDefaultCasePreparationFormState();
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
    setIsFormDirty(false);
    setFormData(defaults);
    resetFlowDraft();
  }, [resetFlowDraft]);

  const getErrorMessage = (response: any, fallbackMessage: string) => {
    if (response?.error?.details) return response.error.details;
    if (response?.message) return response.message;
    return fallbackMessage;
  };

  const openFormWithResolvedData = useCallback(
    async (batch: CasePrepBatch, editMode: boolean) => {
      if (!batch.batchId) {
        showAlert(STRINGS.MANUFACTURING.CASE_PREP.BATCH_ID_MISSING, "error");
        return;
      }

      setLoadingFormDetails(true);
      try {
        const status = batch.cpStatus ?? batch.status;
        const shouldFetchDetails =
          editMode || isManufacturingContinueFillingStatus(String(status ?? ""));

        const batchDetails = await batchManagementController.getBatchById(batch.batchId);
        const nextBatch = enrichBatchFromDetails(batch, batchDetails);
        if (!nextBatch) return;

        let nextFormData = createDefaultCasePreparationFormState();
        let nextAddedMotors: CasePrepAddedMotor[] = [];
        let nextMotorStatuses: Record<string, MotorStatusMeta> = {};

        if (shouldFetchDetails) {
          const formId = resolveFormId(batch);
          if (!subDepartmentId) {
            showAlert(STRINGS.MANUFACTURING.CASE_PREP.SUB_DEPARTMENT_MISSING, "error");
            return;
          }
          if (!formId) {
            showAlert(STRINGS.MANUFACTURING.CASE_PREP.FORM_ID_MISSING, "error");
            return;
          }

          const detailsResponse = await casePreparationController.fetchFormDetails({
            formId,
            subDepartmentId,
          });

          if (!detailsResponse?.success || !detailsResponse?.data) {
            const fallback =
              detailsResponse?.statusCode === 404
                ? STRINGS.MANUFACTURING.CASE_PREP.DETAILS_NOT_FOUND
                : STRINGS.MANUFACTURING.CASE_PREP.DETAILS_FETCH_ERROR;
            showAlert(getErrorMessage(detailsResponse, fallback), "error");
            return;
          }

          nextBatch.formId = detailsResponse.data.formId || formId;
          nextBatch.batchType =
            batch.batchType ?? detailsResponse.data.batchType ?? nextBatch.batchType;
          nextFormData = mapCasePreparationDetailsToFormState(detailsResponse.data);

          const merged = mergeMotorsFromBatchAndForm(nextBatch, nextFormData);
          nextFormData = merged.formData;
          nextAddedMotors = merged.addedMotors;

          if (isMainMotorBatch(nextBatch.batchType) && nextAddedMotors.length === 0) {
            const initialized = initializeCasePrepFormFromBatch(nextBatch, nextFormData);
            nextFormData = initialized.formData;
            nextAddedMotors = initialized.addedMotors;
          }

          nextMotorStatuses = mapCasePreparationMotorStatusesFromApi(
            detailsResponse.data,
            nextAddedMotors.map((m) => m.motorId),
          );
        } else {
          if (isMainMotorBatch(nextBatch.batchType)) {
            const motorsFromBatch = resolveCasePrepMotorsFromBatch(nextBatch);
            if (!motorsFromBatch.length) {
              showAlert(STRINGS.MANUFACTURING.CASE_PREP.BATCH_MOTOR_DETAILS_MISSING, "error");
              return;
            }
          }

          const initialized = initializeCasePrepFormFromBatch(nextBatch);
          nextFormData = initialized.formData;
          nextAddedMotors = initialized.addedMotors;
          nextMotorStatuses = Object.fromEntries(
            nextAddedMotors.map((motor) => [
              motor.motorId,
              { motorSubmissionStatus: "TO_BE_INITIATED" as MotorSubmissionStatus },
            ]),
          );
        }

        setActiveBatch(nextBatch);
        setIsEditMode(editMode);
        setFormData(nextFormData);
        setAddedMotors(nextAddedMotors);
        setMotorStatusById(nextMotorStatuses);
        setIsFormDirty(false);
        setView("form");
      } finally {
        setLoadingFormDetails(false);
      }
    },
    [showAlert, subDepartmentId],
  );

  const handleViewCasePrepDetails = useCallback(
    async (row: CasePrepBatch) => {
      if (!row.formId) {
        showAlert(STRINGS.MANUFACTURING.CASE_PREP.FORM_ID_MISSING, "error");
        return;
      }
      if (!subDepartmentId) {
        showAlert(STRINGS.MANUFACTURING.CASE_PREP.SUB_DEPARTMENT_MISSING, "error");
        return;
      }

      setDetailsLoading(true);
      const response = await casePreparationController.fetchFormDetails({
        formId: row.formId,
        subDepartmentId,
      });
      setDetailsLoading(false);

      if (!response?.success || !response?.data) {
        showAlert(
          response?.message || STRINGS.MANUFACTURING.CASE_PREP.DETAILS_FETCH_ERROR,
          "error",
        );
        return;
      }

      setDetailsRow(row);
      setDetailsData(response.data);
      setView("details");
    },
    [showAlert, subDepartmentId],
  );

  const handleBackFromDetails = useCallback(() => {
    setDetailsRow(null);
    setDetailsData(null);
    setView("list");
    bumpBatchRefresh();
  }, [bumpBatchRefresh]);

  const handleFillForm = useCallback(
    async (batch: CasePrepBatch) => await openFormWithResolvedData(batch, false),
    [openFormWithResolvedData],
  );

  const handleEditForm = useCallback(
    async (batch: CasePrepBatch) => await openFormWithResolvedData(batch, true),
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
    await discardWorkflowForm({
      subDepartmentId,
      baselineState: createDefaultCasePreparationFormState(),
      currentState: formData,
      extractTempFileIds: collectTempFileIdsFromCasePrepForm,
      deleteTemp,
      resetForm: () => {
        bumpBatchRefresh();
        resetFormContext();
      },
    });
  }, [bumpBatchRefresh, deleteTemp, formData, resetFormContext, subDepartmentId]);

  const handleMotorSessionChange = useCallback((motorId: string, nextMotor: CasePrepMotorSession) => {
    setFormData((prev) => {
      const motors = prev.motors ?? [];
      let changed = false;
      const nextMotors = motors.map((motor) => {
        if (motor.motorId !== motorId) return motor;
        if (motor === nextMotor) return motor;
        changed = true;
        return nextMotor;
      });
      return changed ? { ...prev, motors: nextMotors } : prev;
    });
    setAddedMotors((prev) => {
      let changed = false;
      const next = prev.map((motor) => {
        if (motor.motorId !== motorId) return motor;
        if (motor.prrcClearanceDate === nextMotor.prrcClearanceDate) return motor;
        changed = true;
        return { ...motor, prrcClearanceDate: nextMotor.prrcClearanceDate };
      });
      return changed ? next : prev;
    });
    setIsFormDirty(true);
  }, []);

  const handleSubscaleValuesChange = useCallback((data: CasePrepMotorData) => {
    setFormData((prev) => ({ ...prev, subscaleData: data }));
    setIsFormDirty(true);
  }, []);

  const getMotorStatus = useCallback(
    (motorId: string): MotorSubmissionStatus =>
      motorStatusById[motorId]?.motorSubmissionStatus ?? "TO_BE_INITIATED",
    [motorStatusById],
  );

  const checkMotorEditable = useCallback(
    (motorId: string) => {
      if (
        !isMotorEnabledForWorkflow(
          motorId,
          addedMotors.map((motor) => motor.motorId),
          {
            enableAll: true,
            kind: "motor",
            previousSubDepartmentId: null,
            previousSubDepartmentName: null,
            approvedPremixNos: new Set(),
            approvedMotorIds: new Set(),
          },
          getMotorStatus,
        )
      ) {
        return false;
      }
      return isMotorEditable(getMotorStatus(motorId));
    },
    [addedMotors, getMotorStatus],
  );

  const submitMotor = useCallback(
    async (motorId: string, intent: "draft" | "submit") => {
      if (!activeBatch) return false;
      const S = STRINGS.MANUFACTURING.CASE_PREP;

      if (!subDepartmentId) {
        showAlert(S.SUB_DEPARTMENT_MISSING, "error");
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

      if (hasIncompleteCasePrepUploads({ motors: [motor] })) {
        showAlert(S.FILE_UPLOAD_PENDING, "warning");
        return false;
      }

      if (intent === "submit") {
        if (!String(motor.prrcClearanceDate ?? "").trim()) {
          showAlert(S.MOTOR_PRRC_REQUIRED, "warning");
          return false;
        }
        if (!hasMotorCasePreparationValue(formData, motorId)) {
          showAlert(S.MOTOR_EMPTY_ERROR, "warning");
          return false;
        }
      }

      const isDraft = intent === "draft";
      const motorSubmissionType = isDraft ? "DRAFT" : "SUBMIT";
      const formSubmissionType = "DRAFT" as const;
      const isCreateFlow = !resolveFormId(activeBatch);
      const payloadBody = buildCasePreparationFormBody(formData, {
        targetMotorIds: [motorId],
        motorSubmissionType,
      });

      if (!payloadBody.motors.length) {
        showAlert(S.MOTOR_EMPTY_ERROR, "warning");
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
          response = await casePreparationController.createForm({
            batchId: activeBatch.batchId,
            batchType: mapCasePrepBatchTypeForApi(activeBatch.batchType),
            subDepartmentId,
            formSubmissionType,
            casePreparationDetails: payloadBody,
          });
        } else {
          const formId = resolveFormId(activeBatch);
          if (!formId) {
            showAlert(S.FORM_ID_MISSING, "error");
            return false;
          }
          response = await casePreparationController.updateForm({
            batchId: activeBatch.batchId,
            formId,
            batchType: mapCasePrepBatchTypeForApi(activeBatch.batchType),
            subDepartmentId,
            formSubmissionType,
            casePreparationDetails: payloadBody,
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
        setIsFormDirty(false);
        setHasSavedDraft(true);

        const nextStatus: MotorSubmissionStatus =
          intent === "draft" ? "IN_PROGRESS" : "WAITING_FOR_APPROVAL";

        setMotorStatusById((prev) => {
          const updated: Record<string, MotorStatusMeta> = {
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
                motorSubmissionType: entry.motorSubmissionType ?? updated[id]?.motorSubmissionType,
                motorSubmissionStatus:
                  (String(entry.motorSubmissionStatus ?? "").toUpperCase() as MotorSubmissionStatus) ||
                  updated[id]?.motorSubmissionStatus ||
                  "TO_BE_INITIATED",
              };
            });
          }
          return updated;
        });

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
      checkMotorEditable,
      formData,
      getMotorStatus,
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

  const handleSubmitForFinalApproval = useCallback(async () => {
    const S = STRINGS.MANUFACTURING.CASE_PREP;
    if (!activeBatch?.formId) {
      showAlert(S.FORM_ID_MISSING, "error");
      return false;
    }
    if (!subDepartmentId) {
      showAlert(S.SUB_DEPARTMENT_MISSING, "error");
      return false;
    }

    const motorIds = addedMotors.map((m) => m.motorId);
    const allApproved =
      motorIds.length > 0 &&
      motorIds.every(
        (id) => String(motorStatusById[id]?.motorSubmissionStatus ?? "").toUpperCase() === "APPROVED",
      );
    if (!allApproved) {
      showAlert(S.FINAL_APPROVAL_NOT_READY, "warning");
      return false;
    }

    setActionLoading(true);
    try {
      const detailsResponse = await casePreparationController.fetchFormDetails({
        formId: activeBatch.formId,
        subDepartmentId,
      });
      if (!detailsResponse?.success || !detailsResponse?.data) {
        showAlert(getErrorMessage(detailsResponse, S.DETAILS_FETCH_ERROR), "error");
        return false;
      }

      const payloadBody = mapCasePreparationDetailsFromSavedForm(detailsResponse.data, {
        motorStatusById,
      });

      const response = await casePreparationController.updateForm({
        batchId: activeBatch.batchId,
        formId: activeBatch.formId,
        batchType: mapCasePrepBatchTypeForApi(activeBatch.batchType),
        subDepartmentId,
        formSubmissionType: "SUBMIT",
        casePreparationDetails: payloadBody,
      });

      if (!response?.success) {
        showAlert(getErrorMessage(response, S.FINAL_APPROVAL_FAILED), "error");
        return false;
      }

      showAlert(S.FINAL_APPROVAL_SUCCESS, "success", { autoCloseMs: 2200 });
      await listParams.refreshUserBatches();
      bumpBatchRefresh();
      resetFormContext();
      return true;
    } finally {
      setActionLoading(false);
    }
  }, [
    activeBatch,
    addedMotors,
    bumpBatchRefresh,
    listParams,
    motorStatusById,
    resetFormContext,
    showAlert,
    subDepartmentId,
  ]);

  // Subscale still uses whole-form draft/submit.
  const submitForm = useCallback(
    async (intent: "draft" | "submit") => {
      if (!activeBatch) return false;
      const S = STRINGS.MANUFACTURING.CASE_PREP;
      if (!subDepartmentId) {
        showAlert(S.SUB_DEPARTMENT_MISSING, "error");
        return false;
      }

      if (hasIncompleteCasePrepUploads(formData)) {
        showAlert(S.FILE_UPLOAD_PENDING, "warning");
        return false;
      }

      const isCreateFlow = !resolveFormId(activeBatch);
      const payloadBody = buildCasePreparationFormBody(formData);

      setActionLoading(true);
      try {
        let response: any;
        if (isCreateFlow) {
          response = await casePreparationController.createForm({
            batchId: activeBatch.batchId,
            batchType: mapCasePrepBatchTypeForApi(activeBatch.batchType),
            subDepartmentId,
            formSubmissionType: intent === "draft" ? "DRAFT" : "SUBMIT",
            casePreparationDetails: payloadBody,
          });
        } else {
          response = await casePreparationController.updateForm({
            batchId: activeBatch.batchId,
            formId: activeBatch.formId,
            batchType: mapCasePrepBatchTypeForApi(activeBatch.batchType),
            subDepartmentId,
            formSubmissionType: intent === "draft" ? "DRAFT" : "SUBMIT",
            casePreparationDetails: payloadBody,
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
        setIsFormDirty(false);

        if (intent === "draft") {
          showAlert(
            isCreateFlow ? S.CREATE_DRAFT_SUCCESS : S.UPDATE_DRAFT_SUCCESS,
            "success",
            { autoCloseMs: 2200 },
          );
          setHasSavedDraft(true);
        } else {
          showAlert(
            isCreateFlow ? S.CREATE_SUBMIT_SUCCESS : S.UPDATE_SUBMIT_SUCCESS,
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
    [activeBatch, formData, listParams, resetFormContext, showAlert, subDepartmentId],
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
    addedMotors,
    motorStatusById,
    getMotorStatus,
    isMotorEditable: checkMotorEditable,
    /** Compatibility stubs — schema fetch removed for typed Case Prep form. */
    schemaLoading: false,
    schemaError: null as string | null,
    subDepartmentId,
    batchMotorCount: resolveCasePrepBatchMotorCount(
      activeBatch,
      addedMotors.length > 0 ? addedMotors.length : 1,
    ),
    isFormDirty,
    loadingFormDetails,
    actionLoading,
    backConfirmOpen,
    setBackConfirmOpen,
    detailsRow,
    detailsData,
    detailsSchema: null as null,
    detailsLoading,
    handleViewCasePrepDetails,
    handleBackFromDetails,
    handleFillForm,
    handleEditForm,
    handleBack,
    handleDiscardAndBack,
    handleMotorSessionChange,
    handleSubscaleValuesChange,
    handleSaveMotorDraft,
    handleSubmitMotor,
    handleSubmitForFinalApproval,
    handleSaveDraft,
    handleSubmit,
    hasSavedDraft,
  };
};

export default useCasePreparationHook;
