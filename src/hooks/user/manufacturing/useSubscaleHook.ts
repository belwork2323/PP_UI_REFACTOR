import { useCallback, useMemo, useState } from "react";
import { STRINGS } from "../../../app/config/strings";
import { useAlertStore } from "../../../app/store/alertStore";
import { useAuthStore } from "../../../app/store/authStore";
import { useUserBatchRefreshStore } from "../../../app/store/userBatchRefreshStore";
import subscaleController from "../../../controllers/user/manufacturing/subscaleController";
import {
  createDefaultSubscaleFormState,
  hasAnySubscaleValue,
  mapSubscaleDetailsToFormState,
  mapSubscaleFormStateToPayload,
  type SubscaleFormState,
} from "../../../data/models/user/SubscaleFormModel";
import { normalizeBatchTypeCode } from "../../../data/models/user/SubdepartmentBatchModel";
import { MANUFACTURING_STATUS } from "./manufacturingWorkflowData";
import { useSubdepartmentBatches } from "../useSubdepartmentBatches";
import type { SchemaFormValues } from "../../../schema-engine";
import { batchManagementController } from "@/controllers/admin/BatchManagement/batchManagementController";
import { fetchMixingCycleDetailsApi } from "@/data/api/common/generalAPI";

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
  const [batchDetails, setBatchDetails] = useState<any>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [loadingFormDetails, setLoadingFormDetails] = useState(false);
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
    setBatchDetails(null);
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

  const fetchBatchDetailsData = useCallback(async (batchId: string) => {
    try {
      const response = await batchManagementController.getBatchById(batchId);
      setBatchDetails(response);
      return response;
    } catch (error) {
      console.error("Error fetching batch details:", error);
      return null;
    }
  }, []);

  const fetchMixingCycleList = useCallback(async (mixingCycleCode: string) => {
    if (!mixingCycleCode) return null;
    try {
      const response = await fetchMixingCycleDetailsApi(mixingCycleCode);
      return response;
    } catch (error) {
      console.error("Error fetching mixing cycle details:", error);
      return null;
    }
  }, []);

  const openFormWithResolvedData = useCallback(
    async (batch: SubscaleBatch, editMode: boolean) => {
      const status = parseStatus(batch.ssStatus);
      const existingFormId = resolveFormId(batch);
      const shouldFetchDetails =
        Boolean(existingFormId) &&
        (editMode ||
          status === parseStatus(SS_STATUS.IN_PROGRESS) ||
          status === parseStatus(SS_STATUS.REJECTED) ||
          status === parseStatus(SS_STATUS.TO_BE_INITIATED));

      let nextBatch = batch;
      let nextFormData = createDefaultSubscaleFormState();

      setLoadingFormDetails(true);
      try {
        if (shouldFetchDetails) {
          if (!subDepartmentId) {
            showAlert(STRINGS.MANUFACTURING.SUBSCALE.SUB_DEPARTMENT_MISSING, "error");
            return;
          }
          if (!existingFormId) {
            showAlert(STRINGS.MANUFACTURING.SUBSCALE.FORM_ID_MISSING, "error");
            return;
          }

          const detailsResponse = await subscaleController.fetchFormDetails({
            formId: existingFormId,
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

          nextBatch = { ...batch, formId: detailsResponse.data.formId || existingFormId };
          nextFormData = mapSubscaleDetailsToFormState(detailsResponse.data);
        }

        if (batch.batchId) {
          await fetchBatchDetailsData(batch.batchId);
        }
      } finally {
        setLoadingFormDetails(false);
      }

      setActiveBatch(nextBatch);
      setIsEditMode(editMode);
      setFormData(nextFormData);
      setInitialSnapshot(JSON.stringify(nextFormData));
      setView("form");
    },
    [showAlert, subDepartmentId, fetchBatchDetailsData],
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
    bumpBatchRefresh();
    resetFormContext();
  }, [isFormDirty, resetFormContext, bumpBatchRefresh]);

  const handleDiscardAndBack = useCallback(() => {
    bumpBatchRefresh();
    resetFormContext();
  }, [resetFormContext, bumpBatchRefresh]);

  const handleFormValuesChange = useCallback((values: SchemaFormValues) => {
    setFormData((prev) => ({
      ...prev,
      schemaFormValues: values,
      schemaFormLoaded: Boolean(values.IS_PROCESS_FORM_LOADED) || prev.schemaFormLoaded,
    }));
  }, []);

  const submitForm = useCallback(
    async (intent: "draft" | "submit") => {
      if (!activeBatch) return false;

      if (!subDepartmentId) {
        showAlert(STRINGS.MANUFACTURING.SUBSCALE.SUB_DEPARTMENT_MISSING, "error");
        return false;
      }

      if (!hasAnySubscaleValue(formData)) {
        showAlert(STRINGS.MANUFACTURING.SUBSCALE.EMPTY_FORM_ERROR, "warning");
        return false;
      }

      if (!formData.schemaFormValues?.IS_PROCESS_FORM_LOADED && !formData.schemaFormLoaded) {
        showAlert(STRINGS.MANUFACTURING.SUBSCALE.LOAD_FORM_REQUIRED, "warning");
        return false;
      }

      const existingFormId = resolveFormId(activeBatch);
      const status = parseStatus(activeBatch.ssStatus);
      const isToBeInitiated =
        !activeBatch.ssStatus || status === parseStatus(SS_STATUS.TO_BE_INITIATED);
      // First save on To Be Initiated (no form yet) → create; otherwise update.
      const useCreate = isToBeInitiated && !existingFormId;

      if (!useCreate && !existingFormId) {
        showAlert(STRINGS.MANUFACTURING.SUBSCALE.FORM_ID_MISSING, "error");
        return false;
      }

      const apiBatchType = normalizeBatchTypeCode(activeBatch.batchType);
      const payloadBody = mapSubscaleFormStateToPayload(formData, activeBatch.batchType);

      setActionLoading(true);
      try {
        let response: any;

        if (useCreate) {
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
          response = await subscaleController.updateForm({
            formId: existingFormId as string,
            batchId: activeBatch.batchId,
            batchType: apiBatchType,
            subDepartmentId,
            formSubmissionType: intent === "draft" ? "DRAFT" : "SUBMIT",
            ...payloadBody,
          });
        }

        if (!response?.success) {
          const fallback = useCreate
            ? STRINGS.MANUFACTURING.SUBSCALE.CREATE_FAILED
            : STRINGS.MANUFACTURING.SUBSCALE.UPDATE_FAILED;
          showAlert(getErrorMessage(response, fallback), "error");
          return false;
        }

        const nextFormId = response.data?.formId ?? existingFormId ?? null;
        setActiveBatch((prev) =>
          prev
            ? {
                ...prev,
                formId: nextFormId,
                ssStatus:
                  intent === "draft" && isToBeInitiated
                    ? SS_STATUS.IN_PROGRESS
                    : prev.ssStatus,
              }
            : prev,
        );
        setInitialSnapshot(formSnapshot);

        if (intent === "draft") {
          showAlert(
            useCreate
              ? STRINGS.MANUFACTURING.SUBSCALE.CREATE_DRAFT_SUCCESS
              : STRINGS.MANUFACTURING.SUBSCALE.UPDATE_DRAFT_SUCCESS,
            "success",
            { autoCloseMs: 2200 },
          );
          setHasSavedDraft(true);
        } else {
          showAlert(
            useCreate
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
        showAlert(response?.message || STRINGS.MANUFACTURING.SUBSCALE.DETAILS_FETCH_ERROR, "error");
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

  return {
    ...listParams,
    loading: listParams.loading || loadingFormDetails,
    loadingFormDetails,
    view,
    activeBatch,
    batchDetails,
    fetchBatchDetailsData,
    isEditMode,
    formData,
    isFormDirty,
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
    fetchMixingCycleList,
  };
};

export default useSubscaleHook;
