import { useCallback, useMemo, useState } from "react";
import { STRINGS } from "../../../app/config/strings";
import { useAlertStore } from "../../../app/store/alertStore";
import { useAuthStore } from "../../../app/store/authStore";
import { useUserBatchRefreshStore } from "../../../app/store/userBatchRefreshStore";
import castingCuringController from "../../../controllers/user/manufacturing/castingCuringController";
import {
  createDefaultCastingCuringFormState,
  hasAnyCastingCuringValue,
  mapCastingCuringDetailsToFormState,
  mapCastingCuringFormStateToPayload,
  type CastingCuringFormState,
} from "../../../data/models/user/CastingCuringFormModel";
import { MANUFACTURING_STATUS } from "./manufacturingWorkflowData";
import { useSubdepartmentBatches } from "../useSubdepartmentBatches";

type WorkflowView = "list" | "form";

type CastingCuringBatch = {
  batchId: string;
  ccStatus?: string;
  formId?: string | null;
  [key: string]: any;
};

const CC_STATUS = MANUFACTURING_STATUS;
const parseStatus = (status: string | undefined) => String(status ?? "").toLowerCase();

export const useCastingAndCuringHook = () => {
  const listParams = useSubdepartmentBatches("casting-and-curing");
  const user = useAuthStore((s) => s.user);
  const showAlert = useAlertStore((state) => state.showAlert);
  const bumpBatchRefresh = useUserBatchRefreshStore((state) => state.bumpVersion);

  const subDepartmentId = useMemo(
    () =>
      user?.allSubDepartments.find((sd) => sd.slugs?.subDept === "casting-and-curing")
        ?.subDepartmentId,
    [user]
  );

  const [view, setView] = useState<WorkflowView>("list");
  const [activeBatch, setActiveBatch] = useState<CastingCuringBatch | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [loadingFormDetails, setLoadingFormDetails] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [backConfirmOpen, setBackConfirmOpen] = useState(false);
  const [hasSavedDraft, setHasSavedDraft] = useState(false);
  const [formData, setFormData] = useState<CastingCuringFormState>(
    createDefaultCastingCuringFormState()
  );
  const [initialSnapshot, setInitialSnapshot] = useState("{}");

  const formSnapshot = useMemo(() => JSON.stringify(formData), [formData]);
  const isFormDirty = useMemo(
    () => view === "form" && formSnapshot !== initialSnapshot,
    [view, formSnapshot, initialSnapshot]
  );

  const resetFormContext = useCallback(() => {
    const defaults = createDefaultCastingCuringFormState();
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
    async (batch: CastingCuringBatch, editMode: boolean) => {
      const status = parseStatus(batch.ccStatus);
      const shouldFetchDetails =
        editMode ||
        status === parseStatus(CC_STATUS.IN_PROGRESS) ||
        status === parseStatus(CC_STATUS.REJECTED);

      let nextBatch = batch;
      let nextFormData = createDefaultCastingCuringFormState();

      if (shouldFetchDetails) {
        if (!subDepartmentId) {
          showAlert(STRINGS.MANUFACTURING.CASTING_CURING.SUB_DEPARTMENT_MISSING, "error");
          return;
        }
        if (!batch.formId) {
          showAlert(STRINGS.MANUFACTURING.CASTING_CURING.FORM_ID_MISSING, "error");
          return;
        }

        setLoadingFormDetails(true);
        const detailsResponse = await castingCuringController.fetchFormDetails({
          formId: batch.formId,
          subDepartmentId,
        });
        setLoadingFormDetails(false);

        if (!detailsResponse?.success || !detailsResponse?.data) {
          const fallback =
            detailsResponse?.statusCode === 404
              ? STRINGS.MANUFACTURING.CASTING_CURING.DETAILS_NOT_FOUND
              : STRINGS.MANUFACTURING.CASTING_CURING.DETAILS_FETCH_ERROR;
          showAlert(getErrorMessage(detailsResponse, fallback), "error");
          return;
        }

        nextBatch = { ...batch, formId: detailsResponse.data.formId || batch.formId };
        nextFormData = mapCastingCuringDetailsToFormState(detailsResponse.data);
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
    async (batch: CastingCuringBatch) => await openFormWithResolvedData(batch, false),
    [openFormWithResolvedData]
  );

  const handleEditForm = useCallback(
    async (batch: CastingCuringBatch) => await openFormWithResolvedData(batch, true),
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

  const handleFormChange = useCallback((payload: CastingCuringFormState) => {
    setFormData(payload ?? createDefaultCastingCuringFormState());
  }, []);

  const submitForm = useCallback(
    async (intent: "draft" | "submit") => {
      if (!activeBatch) return false;

      if (!subDepartmentId) {
        showAlert(STRINGS.MANUFACTURING.CASTING_CURING.SUB_DEPARTMENT_MISSING, "error");
        return false;
      }

      if (!hasAnyCastingCuringValue(formData)) {
        showAlert(STRINGS.MANUFACTURING.CASTING_CURING.EMPTY_FORM_ERROR, "warning");
        return false;
      }

      const status = parseStatus(activeBatch.ccStatus);
      const isCreateFlow = status === parseStatus(CC_STATUS.INITIATED) && !activeBatch.formId;
      const payloadBody = mapCastingCuringFormStateToPayload(formData);

      setActionLoading(true);
      try {
        let response: any;

        if (isCreateFlow) {
          if (!activeBatch.batchId) {
            showAlert(STRINGS.MANUFACTURING.CASTING_CURING.BATCH_ID_MISSING, "error");
            return false;
          }
          response = await castingCuringController.createForm({
            batchId: activeBatch.batchId,
            subDepartmentId,
            formSubmissionType: intent === "draft" ? "DRAFT" : "SUBMIT",
            ...payloadBody,
          });
        } else {
          if (!activeBatch.formId) {
            showAlert(STRINGS.MANUFACTURING.CASTING_CURING.FORM_ID_MISSING, "error");
            return false;
          }
          response = await castingCuringController.updateForm({
            formId: activeBatch.formId,
            subDepartmentId,
            formSubmissionType: intent === "draft" ? "DRAFT" : "UPDATE",
            ...payloadBody,
          });
        }

        if (!response?.success) {
          const fallback = isCreateFlow
            ? STRINGS.MANUFACTURING.CASTING_CURING.CREATE_FAILED
            : STRINGS.MANUFACTURING.CASTING_CURING.UPDATE_FAILED;
          showAlert(getErrorMessage(response, fallback), "error");
          return false;
        }

        const nextFormId = response.data?.formId ?? activeBatch.formId ?? null;
        setActiveBatch((prev) => (prev ? { ...prev, formId: nextFormId } : prev));
        setInitialSnapshot(formSnapshot);

        if (intent === "draft") {
          showAlert(
            isCreateFlow
              ? STRINGS.MANUFACTURING.CASTING_CURING.CREATE_DRAFT_SUCCESS
              : STRINGS.MANUFACTURING.CASTING_CURING.UPDATE_DRAFT_SUCCESS,
            "success",
            { autoCloseMs: 2200 }
          );
          setHasSavedDraft(true);
        } else {
          showAlert(
            isCreateFlow
              ? STRINGS.MANUFACTURING.CASTING_CURING.CREATE_SUBMIT_SUCCESS
              : STRINGS.MANUFACTURING.CASTING_CURING.UPDATE_SUBMIT_SUCCESS,
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

export default useCastingAndCuringHook;
