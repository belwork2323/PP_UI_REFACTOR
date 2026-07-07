import { useCallback, useMemo, useState } from "react";
import { STRINGS } from "../../../app/config/strings";
import { useAlertStore } from "../../../app/store/alertStore";
import { useAuthStore } from "../../../app/store/authStore";
import { useUserBatchRefreshStore } from "../../../app/store/userBatchRefreshStore";
import subscaleController from "../../../controllers/user/manufacturing/subscaleController";
import {
  createDefaultSubscaleFormState,
  hasAnySubscaleValue,
  hydrateSubscaleFormState,
  mapSubscaleDetailsToFormState,
  mapSubscaleFormStateToPayload,
  type SubscaleFormState,
} from "../../../data/models/user/SubscaleFormModel";
import { normalizeBatchTypeCode } from "../../../data/models/user/SubdepartmentBatchModel";
import { fetchSubscaleSchema } from "../../../schema-engine";
import { MANUFACTURING_STATUS } from "./manufacturingWorkflowData";
import { useSubdepartmentBatches } from "../useSubdepartmentBatches";
import type { SchemaFormValues } from "../../../schema-engine";

type WorkflowView = "list" | "form" | "details";

type SubscaleBatch = {
  batchId: string;
  ssStatus?: string;
  formId?: string | null;
  batchType?: string | null;
  [key: string]: any;
};

const SS_STATUS = MANUFACTURING_STATUS;
const parseStatus = (status: string | undefined) => String(status ?? "").toLowerCase();

const resolveFormId = (batch: SubscaleBatch | null | undefined) => {
  const formId = String(batch?.formId ?? "").trim();
  return formId || null;
};

export const useSubscaleHook = () => {
  const listParams = useSubdepartmentBatches("subscale");
  const user = useAuthStore((s) => s.user);
  const showAlert = useAlertStore((state) => state.showAlert);
  const bumpBatchRefresh = useUserBatchRefreshStore((state) => state.bumpVersion);

  const subDepartmentId = useMemo(
    () => user?.allSubDepartments.find((sd) => sd.slugs?.subDept === "subscale")?.subDepartmentId,
    [user],
  );

  const [view, setView] = useState<WorkflowView>("list");
  const [activeBatch, setActiveBatch] = useState<SubscaleBatch | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [loadingFormDetails, setLoadingFormDetails] = useState(false);
  const [schemaLoading, setSchemaLoading] = useState(false);
  const [schemaError, setSchemaError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [backConfirmOpen, setBackConfirmOpen] = useState(false);
  const [hasSavedDraft, setHasSavedDraft] = useState(false);
  const [formData, setFormData] = useState<SubscaleFormState>(createDefaultSubscaleFormState());
  const [initialSnapshot, setInitialSnapshot] = useState("{}");
  const [detailsRow, setDetailsRow] = useState<SubscaleBatch | null>(null);
  const [detailsData, setDetailsData] = useState<any>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const formSnapshot = useMemo(() => JSON.stringify(formData), [formData]);
  const isFormDirty = useMemo(
    () => view === "form" && formSnapshot !== initialSnapshot,
    [view, formSnapshot, initialSnapshot],
  );

  const resetFormContext = useCallback(() => {
    const defaults = createDefaultSubscaleFormState();
    setView("list");
    setActiveBatch(null);
    setIsEditMode(false);
    setLoadingFormDetails(false);
    setSchemaLoading(false);
    setSchemaError(null);
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

  const fetchSubscaleSchemaDocument = useCallback(async (batchType?: string | null) => {
    setSchemaLoading(true);
    setSchemaError(null);
    try {
      const response = await fetchSubscaleSchema({ batchType });
      if (!response?.success || !response?.data) {
        const message = getErrorMessage(response, STRINGS.MANUFACTURING.SUBSCALE.SCHEMA_FETCH_ERROR);
        setSchemaError(message);
        showAlert(message, "error");
        return null;
      }
      return response.data;
    } finally {
      setSchemaLoading(false);
    }
  }, [showAlert]);

  const openFormWithResolvedData = useCallback(
    async (batch: SubscaleBatch, editMode: boolean) => {
      const status = parseStatus(batch.ssStatus);
      const shouldFetchDetails =
        editMode ||
        status === parseStatus(SS_STATUS.IN_PROGRESS) ||
        status === parseStatus(SS_STATUS.REJECTED);

      let nextBatch = batch;
      let nextFormData = createDefaultSubscaleFormState();

      setLoadingFormDetails(true);
      try {
        if (shouldFetchDetails) {
          if (!subDepartmentId) {
            showAlert(STRINGS.MANUFACTURING.SUBSCALE.SUB_DEPARTMENT_MISSING, "error");
            return;
          }
          if (!batch.formId) {
            showAlert(STRINGS.MANUFACTURING.SUBSCALE.FORM_ID_MISSING, "error");
            return;
          }

          const detailsResponse = await subscaleController.fetchFormDetails({
            formId: batch.formId,
            subDepartmentId,
          });

          if (!detailsResponse?.success || !detailsResponse?.data) {
            const fallback =
              detailsResponse?.statusCode === 404
                ? STRINGS.MANUFACTURING.SUBSCALE.DETAILS_NOT_FOUND
                : STRINGS.MANUFACTURING.SUBSCALE.DETAILS_FETCH_ERROR;
            showAlert(getErrorMessage(detailsResponse, fallback), "error");
            return;
          }

          nextBatch = { ...batch, formId: detailsResponse.data.formId || batch.formId };
          nextFormData = mapSubscaleDetailsToFormState(detailsResponse.data);
        }

        const schema = await fetchSubscaleSchemaDocument(batch.batchType);
        if (!schema) return;

        nextFormData = hydrateSubscaleFormState(
          { ...nextFormData, schemaFormLoaded: true },
          schema,
        );
      } finally {
        setLoadingFormDetails(false);
      }

      setActiveBatch(nextBatch);
      setIsEditMode(editMode);
      setFormData(nextFormData);
      setInitialSnapshot(JSON.stringify(nextFormData));
      setView("form");
    },
    [showAlert, subDepartmentId, fetchSubscaleSchemaDocument],
  );

  const handleFillForm = useCallback(
    async (batch: SubscaleBatch) => await openFormWithResolvedData(batch, false),
    [openFormWithResolvedData],
  );

  const handleEditForm = useCallback(
    async (batch: SubscaleBatch) => await openFormWithResolvedData(batch, true),
    [openFormWithResolvedData],
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

  const handleFormValuesChange = useCallback((values: SchemaFormValues) => {
    setFormData((prev) => ({ ...prev, schemaFormValues: values }));
  }, []);

  const submitForm = useCallback(
    async (intent: "draft" | "submit") => {
      if (!activeBatch) return false;

      if (!formData.schemaFormLoaded || !formData.subscaleSchema) {
        showAlert(STRINGS.MANUFACTURING.SUBSCALE.SCHEMA_NOT_LOADED, "warning");
        return false;
      }

      if (!subDepartmentId) {
        showAlert(STRINGS.MANUFACTURING.SUBSCALE.SUB_DEPARTMENT_MISSING, "error");
        return false;
      }

      if (!hasAnySubscaleValue(formData)) {
        showAlert(STRINGS.MANUFACTURING.SUBSCALE.EMPTY_FORM_ERROR, "warning");
        return false;
      }

      const isCreateFlow = !resolveFormId(activeBatch);
      const apiBatchType = normalizeBatchTypeCode(activeBatch.batchType);
      const payloadBody = mapSubscaleFormStateToPayload(formData, activeBatch.batchType);

      setActionLoading(true);
      try {
        let response: any;

        if (isCreateFlow) {
          if (!activeBatch.batchId) {
            showAlert(STRINGS.MANUFACTURING.SUBSCALE.BATCH_ID_MISSING, "error");
            return false;
          }
          response = await subscaleController.createForm({
            batchId: activeBatch.batchId,
            batchType: apiBatchType,
            subDepartmentId,
            formSubmissionType: intent === "draft" ? "DRAFT" : "SUBMIT",
            ...payloadBody,
          });
        } else {
          const formId = resolveFormId(activeBatch);
          if (!formId) {
            showAlert(STRINGS.MANUFACTURING.SUBSCALE.FORM_ID_MISSING, "error");
            return false;
          }
          response = await subscaleController.updateForm({
            formId,
            batchId: activeBatch.batchId,
            batchType: apiBatchType,
            subDepartmentId,
            formSubmissionType: intent === "draft" ? "DRAFT" : "SUBMIT",
            ...payloadBody,
          });
        }

        if (!response?.success) {
          const fallback = isCreateFlow
            ? STRINGS.MANUFACTURING.SUBSCALE.CREATE_FAILED
            : STRINGS.MANUFACTURING.SUBSCALE.UPDATE_FAILED;
          showAlert(getErrorMessage(response, fallback), "error");
          return false;
        }

        const nextFormId = response.data?.formId ?? activeBatch.formId ?? null;
        setActiveBatch((prev) => (prev ? { ...prev, formId: nextFormId } : prev));
        setInitialSnapshot(formSnapshot);

        if (intent === "draft") {
          showAlert(
            isCreateFlow
              ? STRINGS.MANUFACTURING.SUBSCALE.CREATE_DRAFT_SUCCESS
              : STRINGS.MANUFACTURING.SUBSCALE.UPDATE_DRAFT_SUCCESS,
            "success",
            { autoCloseMs: 2200 },
          );
          setHasSavedDraft(true);
        } else {
          showAlert(
            isCreateFlow
              ? STRINGS.MANUFACTURING.SUBSCALE.CREATE_SUBMIT_SUCCESS
              : STRINGS.MANUFACTURING.SUBSCALE.UPDATE_SUBMIT_SUCCESS,
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

  const handleViewDetails = useCallback(
    async (row: SubscaleBatch) => {
      if (!row.formId) {
        showAlert(STRINGS.MANUFACTURING.SUBSCALE.FORM_ID_MISSING, "error");
        return;
      }
      if (!subDepartmentId) {
        showAlert(STRINGS.MANUFACTURING.SUBSCALE.SUB_DEPARTMENT_MISSING, "error");
        return;
      }

      setDetailsLoading(true);
      const response = await subscaleController.fetchFormDetails({
        formId: row.formId,
        subDepartmentId,
      });
      setDetailsLoading(false);

      if (!response?.success || !response?.data) {
        showAlert(
          response?.message || STRINGS.MANUFACTURING.SUBSCALE.DETAILS_FETCH_ERROR,
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
  }, []);

  return {
    ...listParams,
    loading: listParams.loading || loadingFormDetails || schemaLoading,
    view,
    activeBatch,
    isEditMode,
    formData,
    isFormDirty,
    schemaLoading,
    schemaError,
    actionLoading,
    backConfirmOpen,
    setBackConfirmOpen,
    subDepartmentId,
    detailsRow,
    detailsData,
    detailsLoading,
    handleFillForm,
    handleEditForm,
    handleBack,
    handleDiscardAndBack,
    handleFormValuesChange,
    handleSaveDraft,
    handleSubmit,
    handleViewDetails,
    handleBackFromDetails,
  };
};

export default useSubscaleHook;
