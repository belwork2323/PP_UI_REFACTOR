import { useCallback, useMemo, useState } from "react";
import { STRINGS } from "../../../app/config/strings";
import { useAlertStore } from "../../../app/store/alertStore";
import { useAuthStore } from "../../../app/store/authStore";
import { useUserBatchRefreshStore } from "../../../app/store/userBatchRefreshStore";
import {mixingController} from "../../../controllers/user/manufacturing/mixingController";
import {
  createDefaultMixingFormState,
  hasAnyMixingValue,
  mapMixingDetailsToFormState,
  mapMixingFormStateToPayload,
  type MixingFormState,
} from "../../../data/models/user/MixingFormModel";
import { MANUFACTURING_STATUS } from "./manufacturingWorkflowData";
import { useSubdepartmentBatches } from "../useSubdepartmentBatches";

type WorkflowView = "list" | "form";

type MixingBatch = {
  batchId: string;
  mxStatus?: string;
  formId?: string | null;
  [key: string]: any;
};

const MX_STATUS = MANUFACTURING_STATUS;
const parseStatus = (status: string | undefined) => String(status ?? "").toLowerCase();

export const useMixingHook = () => {
  const listParams = useSubdepartmentBatches("mixing");
  const user = useAuthStore((s) => s.user);
  const showAlert = useAlertStore((state) => state.showAlert);
  const bumpBatchRefresh = useUserBatchRefreshStore((state) => state.bumpVersion);

  const subDepartmentId = useMemo(
    () => user?.allSubDepartments.find((sd) => sd.slugs?.subDept === "mixing")?.subDepartmentId,
    [user]
  );

  const [view, setView] = useState<WorkflowView>("list");
  const [activeBatch, setActiveBatch] = useState<MixingBatch | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [loadingFormDetails, setLoadingFormDetails] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [backConfirmOpen, setBackConfirmOpen] = useState(false);
  const [hasSavedDraft, setHasSavedDraft] = useState(false);
  const resolvePremixCount = (batch?: MixingBatch | null) =>
    Number(batch?.numberOfPremix ?? batch?.identificationSheet?.numberOfPremix ?? 1) || 1;

  const [formData, setFormData] = useState<MixingFormState>(() => createDefaultMixingFormState());
  const [initialSnapshot, setInitialSnapshot] = useState("{}");

  const formSnapshot = useMemo(() => JSON.stringify(formData), [formData]);
  const isFormDirty = useMemo(
    () => view === "form" && formSnapshot !== initialSnapshot,
    [view, formSnapshot, initialSnapshot]
  );

  const resetFormContext = useCallback(() => {
    const defaults = createDefaultMixingFormState();
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
    async (batch: MixingBatch, editMode: boolean) => {
      const status = parseStatus(batch.mxStatus);
      const shouldFetchDetails =
        editMode ||
        status === parseStatus(MX_STATUS.IN_PROGRESS) ||
        status === parseStatus(MX_STATUS.REJECTED);

      let nextBatch = batch;
      const premixCount = resolvePremixCount(batch);
      let nextFormData = createDefaultMixingFormState();

      if (shouldFetchDetails) {
        if (!subDepartmentId) {
          showAlert(STRINGS.MANUFACTURING.MIXING.SUB_DEPARTMENT_MISSING, "error");
          return;
        }
        if (!batch.formId) {
          showAlert(STRINGS.MANUFACTURING.MIXING.FORM_ID_MISSING, "error");
          return;
        }

        setLoadingFormDetails(true);
        const detailsResponse = await mixingController.fetchFormDetails({
          formId: batch.formId,
          subDepartmentId,
        });
        setLoadingFormDetails(false);

        if (!detailsResponse?.success || !detailsResponse?.data) {
          const fallback =
            detailsResponse?.statusCode === 404
              ? STRINGS.MANUFACTURING.MIXING.DETAILS_NOT_FOUND
              : STRINGS.MANUFACTURING.MIXING.DETAILS_FETCH_ERROR;
          showAlert(getErrorMessage(detailsResponse, fallback), "error");
          return;
        }

        nextBatch = { ...batch, formId: detailsResponse.data.formId || batch.formId };
        nextFormData = mapMixingDetailsToFormState(detailsResponse.data);
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
    async (batch: MixingBatch) => await openFormWithResolvedData(batch, false),
    [openFormWithResolvedData]
  );

  const handleEditForm = useCallback(
    async (batch: MixingBatch) => await openFormWithResolvedData(batch, true),
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

  const handleFormChange = useCallback((payload: MixingFormState) => {
    setFormData(payload ?? createDefaultMixingFormState());
  }, []);

  const submitForm = useCallback(
    async (intent: "draft" | "submit") => {
      if (!activeBatch) return false;

      if (!subDepartmentId) {
        showAlert(STRINGS.MANUFACTURING.MIXING.SUB_DEPARTMENT_MISSING, "error");
        return false;
      }

      if (!hasAnyMixingValue(formData)) {
        showAlert(STRINGS.MANUFACTURING.MIXING.EMPTY_FORM_ERROR, "warning");
        return false;
      }

      const status = parseStatus(activeBatch.mxStatus);
      const isCreateFlow = status === parseStatus(MX_STATUS.INITIATED) && !activeBatch.formId;
      const payloadBody = mapMixingFormStateToPayload(formData);

      setActionLoading(true);
      try {
        let response: any;

        if (isCreateFlow) {
          if (!activeBatch.batchId) {
            showAlert(STRINGS.MANUFACTURING.MIXING.BATCH_ID_MISSING, "error");
            return false;
          }
          response = await mixingController.createForm({
            batchId: activeBatch.batchId,
            subDepartmentId,
            formSubmissionType: intent === "draft" ? "DRAFT" : "SUBMIT",
            ...payloadBody,
          });
        } else {
          if (!activeBatch.formId) {
            showAlert(STRINGS.MANUFACTURING.MIXING.FORM_ID_MISSING, "error");
            return false;
          }
          response = await mixingController.updateForm({
            formId: activeBatch.formId,
            subDepartmentId,
            formSubmissionType: intent === "draft" ? "DRAFT" : "UPDATE",
            ...payloadBody,
          });
        }

        if (!response?.success) {
          const fallback = isCreateFlow
            ? STRINGS.MANUFACTURING.MIXING.CREATE_FAILED
            : STRINGS.MANUFACTURING.MIXING.UPDATE_FAILED;
          showAlert(getErrorMessage(response, fallback), "error");
          return false;
        }

        const nextFormId = response.data?.formId ?? activeBatch.formId ?? null;
        setActiveBatch((prev) => (prev ? { ...prev, formId: nextFormId } : prev));
        setInitialSnapshot(formSnapshot);

        if (intent === "draft") {
          showAlert(
            isCreateFlow
              ? STRINGS.MANUFACTURING.MIXING.CREATE_DRAFT_SUCCESS
              : STRINGS.MANUFACTURING.MIXING.UPDATE_DRAFT_SUCCESS,
            "success",
            { autoCloseMs: 2200 }
          );
          setHasSavedDraft(true);
        } else {
          showAlert(
            isCreateFlow
              ? STRINGS.MANUFACTURING.MIXING.CREATE_SUBMIT_SUCCESS
              : STRINGS.MANUFACTURING.MIXING.UPDATE_SUBMIT_SUCCESS,
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
    [activeBatch, subDepartmentId, formData, formSnapshot, showAlert, listParams, resetFormContext]
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
    numberOfPremix: resolvePremixCount(activeBatch),
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

export default useMixingHook;
