import { useCallback, useMemo, useState } from "react";
import { STRINGS } from "../../../app/config/strings";
import { useAlertStore } from "../../../app/store/alertStore";
import { useAuthStore } from "../../../app/store/authStore";
import { useUserBatchRefreshStore } from "../../../app/store/userBatchRefreshStore";
import casePreparationController from "../../../controllers/user/manufacturing/casePreparationController";
import {
  createDefaultCasePreparationFormState,
  hasAnyCasePreparationValue,
  mapCasePreparationDetailsToFormState,
  mapCasePreparationFormStateToPayload,
  type CasePreparationFormState,
} from "../../../data/models/user/CasePreparationFormModel";
import { MANUFACTURING_STATUS } from "./manufacturingWorkflowData";
import { useSubdepartmentBatches } from "../useSubdepartmentBatches";

type WorkflowView = "list" | "form";

type CasePrepBatch = {
  batchId: string;
  cpStatus?: string;
  formId?: string | null;
  [key: string]: any;
};

const CP_STATUS = MANUFACTURING_STATUS;

const parseStatus = (status: string | undefined) => String(status ?? "").toLowerCase();

export const useCasePreparationHook = () => {
  const listParams = useSubdepartmentBatches("case-preparation");
  const user = useAuthStore((s) => s.user);
  const showAlert = useAlertStore((state) => state.showAlert);
  const bumpBatchRefresh = useUserBatchRefreshStore((state) => state.bumpVersion);

  const subDepartmentId = useMemo(
    () =>
      user?.allSubDepartments.find((sd) => sd.slugs?.subDept === "case-preparation")
        ?.subDepartmentId,
    [user]
  );

  const [view, setView] = useState<WorkflowView>("list");
  const [activeBatch, setActiveBatch] = useState<CasePrepBatch | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [loadingFormDetails, setLoadingFormDetails] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [backConfirmOpen, setBackConfirmOpen] = useState(false);
  const [hasSavedDraft, setHasSavedDraft] = useState(false);
  const [formData, setFormData] = useState<CasePreparationFormState>(
    createDefaultCasePreparationFormState()
  );
  const [initialSnapshot, setInitialSnapshot] = useState("{}");

  const formSnapshot = useMemo(() => JSON.stringify(formData), [formData]);

  const isFormDirty = useMemo(
    () => view === "form" && formSnapshot !== initialSnapshot,
    [view, formSnapshot, initialSnapshot]
  );

  const resetFormContext = useCallback(() => {
    const defaults = createDefaultCasePreparationFormState();
    setView("list");
    setActiveBatch(null);
    setIsEditMode(false);
    setLoadingFormDetails(false);
    setActionLoading(false);
    setBackConfirmOpen(false);
    setHasSavedDraft(false);
    setFormData(defaults);
    setInitialSnapshot(JSON.stringify(defaults));
  }, []);

  const getErrorMessage = (response: any, fallbackMessage: string) => {
    if (response?.error?.details) return response.error.details;
    if (response?.message) return response.message;
    return fallbackMessage;
  };

  const openFormWithResolvedData = useCallback(
    async (batch: CasePrepBatch, editMode: boolean) => {
      const status = parseStatus(batch.cpStatus);
      const shouldFetchDetails =
        editMode ||
        status === parseStatus(CP_STATUS.IN_PROGRESS) ||
        status === parseStatus(CP_STATUS.REJECTED);

      let nextBatch = batch;
      let nextFormData = createDefaultCasePreparationFormState();

      if (shouldFetchDetails) {
        if (!subDepartmentId) {
          showAlert(STRINGS.MANUFACTURING.CASE_PREP.SUB_DEPARTMENT_MISSING, "error");
          return;
        }

        if (!batch.formId) {
          showAlert(STRINGS.MANUFACTURING.CASE_PREP.FORM_ID_MISSING, "error");
          return;
        }

        setLoadingFormDetails(true);
        const detailsResponse = await casePreparationController.fetchFormDetails({
          formId: batch.formId,
          subDepartmentId,
        });
        setLoadingFormDetails(false);

        if (!detailsResponse?.success || !detailsResponse?.data) {
          const fallback =
            detailsResponse?.statusCode === 404
              ? STRINGS.MANUFACTURING.CASE_PREP.DETAILS_NOT_FOUND
              : STRINGS.MANUFACTURING.CASE_PREP.DETAILS_FETCH_ERROR;
          showAlert(getErrorMessage(detailsResponse, fallback), "error");
          return;
        }

        nextBatch = {
          ...batch,
          formId: detailsResponse.data.formId || batch.formId,
        };
        nextFormData = mapCasePreparationDetailsToFormState(detailsResponse.data);
      }

      setActiveBatch(nextBatch);
      setIsEditMode(editMode);
      setFormData(nextFormData);
      setInitialSnapshot(JSON.stringify(nextFormData));
      setView("form");
    },
    [showAlert, subDepartmentId]
  );

  const handleFillForm = useCallback(
    async (batch: CasePrepBatch) => await openFormWithResolvedData(batch, false),
    [openFormWithResolvedData]
  );

  const handleEditForm = useCallback(
    async (batch: CasePrepBatch) => await openFormWithResolvedData(batch, true),
    [openFormWithResolvedData]
  );

  const handleBack = useCallback(() => {
    if (isFormDirty) {
      setBackConfirmOpen(true);
      return;
    }
    if (hasSavedDraft) bumpBatchRefresh();
    resetFormContext();
  }, [isFormDirty, resetFormContext, bumpBatchRefresh, hasSavedDraft]);

  const handleDiscardAndBack = useCallback(() => {
    if (hasSavedDraft) bumpBatchRefresh();
    resetFormContext();
  }, [resetFormContext, bumpBatchRefresh, hasSavedDraft]);

  const handleFormChange = useCallback((payload: CasePreparationFormState) => {
    setFormData(payload ?? createDefaultCasePreparationFormState());
  }, []);

  const submitForm = useCallback(
    async (intent: "draft" | "submit") => {
      if (!activeBatch) return false;

      if (!subDepartmentId) {
        showAlert(STRINGS.MANUFACTURING.CASE_PREP.SUB_DEPARTMENT_MISSING, "error");
        return false;
      }

      if (!hasAnyCasePreparationValue(formData)) {
        showAlert(STRINGS.MANUFACTURING.CASE_PREP.EMPTY_FORM_ERROR, "warning");
        return false;
      }

      const status = parseStatus(activeBatch.cpStatus);
      const isCreateFlow = status === parseStatus(CP_STATUS.INITIATED) && !activeBatch.formId;
      const payloadBody = mapCasePreparationFormStateToPayload(formData);

      setActionLoading(true);
      try {
        let response: any;

        if (isCreateFlow) {
          if (!activeBatch.batchId) {
            showAlert(STRINGS.MANUFACTURING.CASE_PREP.BATCH_ID_MISSING, "error");
            return false;
          }

          response = await casePreparationController.createForm({
            batchId: activeBatch.batchId,
            subDepartmentId,
            formSubmissionType: intent === "draft" ? "DRAFT" : "SUBMIT",
            ...payloadBody,
          });
        } else {
          if (!activeBatch.formId) {
            showAlert(STRINGS.MANUFACTURING.CASE_PREP.FORM_ID_MISSING, "error");
            return false;
          }

          response = await casePreparationController.updateForm({
            formId: activeBatch.formId,
            subDepartmentId,
            formSubmissionType: intent === "draft" ? "DRAFT" : "UPDATE",
            ...payloadBody,
          });
        }

        if (!response?.success) {
          const fallback = isCreateFlow
            ? STRINGS.MANUFACTURING.CASE_PREP.CREATE_FAILED
            : STRINGS.MANUFACTURING.CASE_PREP.UPDATE_FAILED;
          showAlert(getErrorMessage(response, fallback), "error");
          return false;
        }

        const nextFormId = response.data?.formId ?? activeBatch.formId ?? null;
        setActiveBatch((prev) => (prev ? { ...prev, formId: nextFormId } : prev));
        setInitialSnapshot(formSnapshot);

        if (intent === "draft") {
          showAlert(
            isCreateFlow
              ? STRINGS.MANUFACTURING.CASE_PREP.CREATE_DRAFT_SUCCESS
              : STRINGS.MANUFACTURING.CASE_PREP.UPDATE_DRAFT_SUCCESS,
            "success",
            { autoCloseMs: 2200 }
          );
          setHasSavedDraft(true);
        } else {
          showAlert(
            isCreateFlow
              ? STRINGS.MANUFACTURING.CASE_PREP.CREATE_SUBMIT_SUCCESS
              : STRINGS.MANUFACTURING.CASE_PREP.UPDATE_SUBMIT_SUCCESS,
            "success",
            { autoCloseMs: 2200 }
          );

          await listParams.refreshUserBatches();
          resetFormContext();
        }

        return true;
      } finally {
        setActionLoading(false);
      }
    },
    [
      activeBatch,
      subDepartmentId,
      formData,
      formSnapshot,
      showAlert,
      listParams,
      resetFormContext,
    ]
  );

  const handleSaveDraft = useCallback(async () => {
    return await submitForm("draft");
  }, [submitForm]);

  const handleSubmit = useCallback(async () => {
    return await submitForm("submit");
  }, [submitForm]);

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
    handleFillForm,
    handleEditForm,
    handleBack,
    handleDiscardAndBack,
    handleFormChange,
    handleSaveDraft,
    handleSubmit,
  };
};

export default useCasePreparationHook;
