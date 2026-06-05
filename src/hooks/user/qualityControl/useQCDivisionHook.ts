import { useCallback, useMemo, useState } from "react";
import { STRINGS } from "../../../app/config/strings";
import { useAlertStore } from "../../../app/store/alertStore";
import { useAuthStore } from "../../../app/store/authStore";
import { useUserBatchRefreshStore } from "../../../app/store/userBatchRefreshStore";
import qcDivisionController from "../../../controllers/user/quality_control/qcDivisionController";
import {
  mapQCDivisionPayload,
  QCDivisionDetailsModel,
} from "../../../data/models/user/QCDivisionApiModel";
import {
  createDefaultQCDivisionFormState,
  hasAnyQCDivisionValue,
  type QCDivisionFormState,
} from "../../../data/models/user/QCDivisionFormModel";
import { useSubdepartmentBatches } from "../useSubdepartmentBatches";
import { QUALITY_CONTROL_STATUS } from "./qualityControlWorkflowData";

type WorkflowView = "list" | "form";

export type QCDivisionBatch = {
  id: number | string;
  batchId: string;
  motorId: string;
  motorType: string;
  priority: string;
  assignedTo: { fullName: string } | null;
  createdOn: string;
  qcDivStatus: string;
  formId?: string | null;
  draftData?: QCDivisionFormState | null;
  rejectionReason?: string | null;
};

const normalizeBatch = (batch: any): QCDivisionBatch => ({
  ...batch,
  qcDivStatus: batch?.qcDivStatus ?? batch?.status ?? QUALITY_CONTROL_STATUS.INITIATED,
  formId: batch?.formId ?? null,
  draftData: batch?.draftData ?? null,
  rejectionReason: batch?.rejectionReason ?? null,
});

export const useQCDivisionHook = () => {
  const [view, setView] = useState<WorkflowView>("list");
  const [activeBatch, setActiveBatch] = useState<QCDivisionBatch | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState<QCDivisionFormState>(createDefaultQCDivisionFormState());
  const [initialSnapshot, setInitialSnapshot] = useState(JSON.stringify(createDefaultQCDivisionFormState()));
  const [loadingFormDetails, setLoadingFormDetails] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [backConfirmOpen, setBackConfirmOpen] = useState(false);
  const [hasSavedDraft, setHasSavedDraft] = useState(false);

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

  const batches = useMemo(() => (listParams.batches ?? []).map(normalizeBatch), [listParams.batches]);

  const isFormDirty = useMemo(
    () => JSON.stringify(formData) !== initialSnapshot,
    [formData, initialSnapshot],
  );

  const resetFormContext = () => {
    setView("list");
    setActiveBatch(null);
    setIsEditMode(false);
    setFormData(createDefaultQCDivisionFormState());
    setInitialSnapshot(JSON.stringify(createDefaultQCDivisionFormState()));
    setLoadingFormDetails(false);
    setActionLoading(false);
    setBackConfirmOpen(false);
    setHasSavedDraft(false);
  };

  const getErrorMessage = (response: any, fallbackMessage: string) => {
    if (response?.error?.details) return response.error.details;
    if (response?.message) return response.message;
    return fallbackMessage;
  };

  const openFormWithResolvedData = async (batch: QCDivisionBatch, editMode: boolean) => {
    const shouldFetchDetails =
      editMode ||
      batch.qcDivStatus === QUALITY_CONTROL_STATUS.IN_PROGRESS ||
      batch.qcDivStatus === QUALITY_CONTROL_STATUS.REJECTED;

    let resolvedData = batch.draftData ?? createDefaultQCDivisionFormState();
    let resolvedFormId = batch.formId ?? null;
    let rejectionReason = batch.rejectionReason ?? null;

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
        const fallback = detailsResponse?.statusCode === 404 ? messages.DETAILS_NOT_FOUND : messages.DETAILS_FETCH_ERROR;
        showAlert(getErrorMessage(detailsResponse, fallback), "error");
        return;
      }

      resolvedData = QCDivisionDetailsModel.toFormState(detailsResponse.data);
      resolvedFormId = detailsResponse.data.formId || resolvedFormId;
      rejectionReason = detailsResponse.data.workflowInsights?.rejectionReason ?? rejectionReason;
    }

    const openedBatch: QCDivisionBatch = {
      ...batch,
      formId: resolvedFormId,
      draftData: resolvedData,
      rejectionReason,
    };

    setActiveBatch(openedBatch);
    setFormData(resolvedData);
    setInitialSnapshot(JSON.stringify(resolvedData));
    setIsEditMode(editMode);
    setView("form");
  };

  const handleFillForm = async (batch: QCDivisionBatch) => {
    await openFormWithResolvedData(batch, false);
  };

  const handleEditForm = async (batch: QCDivisionBatch) => {
    await openFormWithResolvedData(batch, true);
  };

  const handleFormChange = useCallback((nextForm: QCDivisionFormState) => {
    setFormData(nextForm ?? createDefaultQCDivisionFormState());
  }, []);

  const handleBack = () => {
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

  const submitForm = async (payload: QCDivisionFormState, intent: "draft" | "submit") => {
    if (!activeBatch) return false;

    if (!subDepartmentId) {
      showAlert(messages.SUB_DEPARTMENT_MISSING, "error");
      return false;
    }

    if (!hasAnyQCDivisionValue(payload)) {
      showAlert(messages.EMPTY_FORM_ERROR, "warning");
      return false;
    }

    const inProcessChecks = mapQCDivisionPayload(payload);
    const isCreateFlow = activeBatch.qcDivStatus === QUALITY_CONTROL_STATUS.INITIATED && !activeBatch.formId;

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
          inProcessChecks,
        });
      } else {
        if (!activeBatch.formId) {
          showAlert(messages.FORM_ID_MISSING, "error");
          return false;
        }

        response = await qcDivisionController.updateForm({
          formId: activeBatch.formId,
          subDepartmentId,
          formSubmissionType: intent === "draft" ? "DRAFT" : "UPDATE",
          inProcessChecks,
        });
      }

      if (!response?.success) {
        const fallback = isCreateFlow ? messages.CREATE_FAILED : messages.UPDATE_FAILED;
        showAlert(getErrorMessage(response, fallback), "error");
        return false;
      }

      const nextFormId = response.data?.formId ?? activeBatch.formId ?? null;
      setActiveBatch((prev) => (prev ? { ...prev, formId: nextFormId, draftData: payload } : prev));
      setFormData(payload);
      setInitialSnapshot(JSON.stringify(payload));

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

  const handleSaveDraft = async (payload: QCDivisionFormState) => {
    return await submitForm(payload, "draft");
  };

  const handleSubmit = async (payload: QCDivisionFormState) => {
    return await submitForm(payload, "submit");
  };

  return {
    ...listParams,
    view,
    activeBatch,
    isEditMode,
    formData,
    isFormDirty,
    loadingFormDetails,
    actionLoading,
    backConfirmOpen,
    batches,
    handleFillForm,
    handleEditForm,
    handleBack,
    handleFormChange,
    handleDiscardAndBack,
    setBackConfirmOpen,
    handleSaveDraft,
    handleSubmit,
  };
};

export default useQCDivisionHook;
