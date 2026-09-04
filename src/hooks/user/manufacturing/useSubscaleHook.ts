import { useCallback, useMemo, useRef, useState } from "react";
import { STRINGS } from "../../../app/config/strings";
import { useAlertStore } from "../../../app/store/alertStore";
import { useAuthStore } from "../../../app/store/authStore";
import { useUserBatchRefreshStore } from "../../../app/store/userBatchRefreshStore";
import subscaleController from "../../../controllers/user/manufacturing/subscaleController";
import {
  buildSubscalePayloadSnapshot,
  createDefaultSubscaleFormState,
  hasAnySubscaleValue,
  mapSubscaleDetailsToFormState,
  mapSubscaleFormStateToPayload,
  type SubscaleFormState,
} from "../../../data/models/user/SubscaleFormModel";
import {
  normalizeBatchTypeCode,
  resolveSubdepartmentBatchDisplayStatus,
} from "../../../data/models/user/SubdepartmentBatchModel";
import { MANUFACTURING_STATUS } from "./manufacturingWorkflowData";
import { isManufacturingContinueFillingStatus } from "../../../hooks/operationStatus";
import { useSubdepartmentBatches } from "../useSubdepartmentBatches";
import type { SchemaFormValues } from "../../../schema-engine";
import { batchManagementController } from "@/controllers/admin/BatchManagement/batchManagementController";
import { fetchMixingCycleDetailsApi } from "@/data/api/common/generalAPI";
import { useFileService } from "../../../hooks/useFileService";
import { discardWorkflowForm } from "../../../utils/workflowDiscard";
import { noopTempFileExtractor } from "../../../utils/workflowTempFiles";
import { flushSubscalePendingDrafts } from "../../../ui/pages/user/manufacturing/Subscale/utils/subscalePendingDrafts";

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
  const { deleteTemp } = useFileService();

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
  const [initialPayloadSnapshot, setInitialPayloadSnapshot] = useState(
    buildSubscalePayloadSnapshot(createDefaultSubscaleFormState()),
  );
  const [detailsRow, setDetailsRow] = useState<SubscaleBatch | null>(null);
  const [detailsData, setDetailsData] = useState<any>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const snapshotStateRef = useRef(formData);
  snapshotStateRef.current = formData;
  const baselineFormStateRef = useRef<SubscaleFormState>(createDefaultSubscaleFormState());
  const initialPayloadSnapshotRef = useRef(initialPayloadSnapshot);
  initialPayloadSnapshotRef.current = initialPayloadSnapshot;
  const activeBatchType = activeBatch?.batchType;

  const isFormDirtyNow = useCallback(() => {
    if (view !== "form") return false;
    return (
      buildSubscalePayloadSnapshot(snapshotStateRef.current, activeBatchType) !==
      initialPayloadSnapshotRef.current
    );
  }, [view, activeBatchType]);

  const syncBaselineFromFormState = useCallback(
    (state: SubscaleFormState, batchType?: string | null) => {
      baselineFormStateRef.current = state;
      setInitialPayloadSnapshot(buildSubscalePayloadSnapshot(state, batchType));
    },
    [],
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
    syncBaselineFromFormState(defaults);
  }, [syncBaselineFromFormState]);

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
    async (batch: SubscaleBatch, editMode: boolean, options?: { silent?: boolean }) => {
      if (!batch.batchId) {
        showAlert(STRINGS.MANUFACTURING.SUBSCALE.BATCH_ID_MISSING, "error");
        return;
      }

      const silent = Boolean(options?.silent);
      const status = batch.ssStatus ?? batch.status;
      const shouldFetchDetails =
        silent ||
        editMode ||
        isManufacturingContinueFillingStatus(String(status ?? "")) ||
        Boolean(String(resolveFormId(batch) ?? "").trim());

      let nextBatch = batch;
      let nextFormData = createDefaultSubscaleFormState();
      let batchDetailsResponse: Record<string, unknown> | null = null;
      let detailsResponse: Awaited<ReturnType<typeof subscaleController.fetchFormDetails>> | null =
        null;

      if (!silent) setLoadingFormDetails(true);
      try {
        if (batch.batchId) {
          try {
            const response = await batchManagementController.getBatchById(batch.batchId);
            batchDetailsResponse = (response ?? null) as Record<string, unknown> | null;
            setBatchDetails(response);
          } catch (error) {
            console.error("Unable to resolve subscale batch details", error);
          }
        }

        if (shouldFetchDetails) {
          if (!subDepartmentId) {
            showAlert(STRINGS.MANUFACTURING.SUBSCALE.SUB_DEPARTMENT_MISSING, "error");
            return;
          }

          const formId = resolveFormId(batch);
          if (!formId) {
            showAlert(STRINGS.MANUFACTURING.SUBSCALE.FORM_ID_MISSING, "error");
            return;
          }

          detailsResponse = await subscaleController.fetchFormDetails({
            formId,
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

          nextFormData = mapSubscaleDetailsToFormState(detailsResponse.data);
        }
      } finally {
        if (!silent) setLoadingFormDetails(false);
      }

      const resolvedStatus = resolveSubdepartmentBatchDisplayStatus(
        batchDetailsResponse ?? batch,
        subDepartmentId,
        {
          formStatus: detailsResponse?.data?.status,
          formSubmissionType: detailsResponse?.data?.formSubmissionType,
          statusFallback: batch.ssStatus ?? batch.status,
        },
      );

      nextBatch = {
        ...batch,
        formId: detailsResponse?.data?.formId || resolveFormId(batch) || batch.formId,
        ssStatus: resolvedStatus,
        status: resolvedStatus,
      };

      setActiveBatch(nextBatch);
      setIsEditMode(editMode);
      setFormData(nextFormData);
      syncBaselineFromFormState(nextFormData, nextBatch.batchType);
      setView("form");
    },
    [showAlert, subDepartmentId, fetchBatchDetailsData, syncBaselineFromFormState],
  );

  const handleFillForm = useCallback(
    async (batch: SubscaleBatch) => await openFormWithResolvedData(batch, false),
    [openFormWithResolvedData],
  );

  const handleEditForm = useCallback(
    async (batch: SubscaleBatch) => await openFormWithResolvedData(batch, true),
    [openFormWithResolvedData],
  );

  const handleBack = useCallback(async () => {
    flushSubscalePendingDrafts();
    if (isFormDirtyNow()) {
      setBackConfirmOpen(true);
      return;
    }
    await listParams.refreshUserBatches();
    resetFormContext();
  }, [isFormDirtyNow, listParams, resetFormContext]);

  const handleDiscardAndBack = useCallback(async () => {
    setBackConfirmOpen(false);
    flushSubscalePendingDrafts();
    await discardWorkflowForm({
      subDepartmentId,
      baselineState: baselineFormStateRef.current,
      currentState: snapshotStateRef.current,
      extractTempFileIds: noopTempFileExtractor,
      deleteTemp,
      resetForm: () => {},
    });
    await listParams.refreshUserBatches();
    resetFormContext();
  }, [deleteTemp, listParams, resetFormContext, subDepartmentId]);

  const handleFormValuesChange = useCallback((values: SchemaFormValues) => {
    setFormData((prev) => {
      const next = {
        ...prev,
        schemaFormValues: values,
        schemaFormLoaded: Boolean(values.IS_PROCESS_FORM_LOADED) || prev.schemaFormLoaded,
      };
      snapshotStateRef.current = next;
      return next;
    });
  }, []);

  const submitForm = useCallback(
    async (intent: "draft" | "submit") => {
      if (!activeBatch) return false;

      flushSubscalePendingDrafts();

      if (!subDepartmentId) {
        showAlert(STRINGS.MANUFACTURING.SUBSCALE.SUB_DEPARTMENT_MISSING, "error");
        return false;
      }

      flushSubscalePendingDrafts();

      const currentFormData = snapshotStateRef.current;

      if (!hasAnySubscaleValue(currentFormData)) {
        showAlert(STRINGS.MANUFACTURING.SUBSCALE.EMPTY_FORM_ERROR, "warning");
        return false;
      }

      if (
        !currentFormData.schemaFormValues?.IS_PROCESS_FORM_LOADED &&
        !currentFormData.schemaFormLoaded
      ) {
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
      const payloadBody = mapSubscaleFormStateToPayload(currentFormData, activeBatch.batchType);

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

        const nextFormId = String(response.data?.formId ?? existingFormId ?? "").trim();

        if (intent === "draft") {
          showAlert(
            useCreate
              ? STRINGS.MANUFACTURING.SUBSCALE.CREATE_DRAFT_SUCCESS
              : STRINGS.MANUFACTURING.SUBSCALE.UPDATE_DRAFT_SUCCESS,
            "success",
            { autoCloseMs: 2200 },
          );
          setHasSavedDraft(true);

          if (nextFormId) {
            const statusForBanner = String(
              response.data?.status ?? activeBatch.ssStatus ?? activeBatch.status ?? "IN_PROGRESS",
            )
              .trim()
              .toUpperCase()
              .replace(/\s+/g, "_");
            const stillRejectedEdit = statusForBanner === "REJECTED";

            await openFormWithResolvedData(
              {
                ...activeBatch,
                formId: nextFormId,
                ssStatus:
                  response.data?.batchStatus ?? response.data?.status ?? activeBatch.ssStatus,
                status: response.data?.batchStatus ?? response.data?.status ?? activeBatch.status,
              },
              stillRejectedEdit,
              { silent: true },
            );
          } else {
            syncBaselineFromFormState(snapshotStateRef.current, activeBatch.batchType);
          }
        } else {
          showAlert(
            useCreate
              ? STRINGS.MANUFACTURING.SUBSCALE.CREATE_SUBMIT_SUCCESS
              : STRINGS.MANUFACTURING.SUBSCALE.UPDATE_SUBMIT_SUCCESS,
            "success",
            { autoCloseMs: 2200 },
          );
          await listParams.refreshUserBatches();
          bumpBatchRefresh();
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
      showAlert,
      listParams,
      bumpBatchRefresh,
      resetFormContext,
      openFormWithResolvedData,
      syncBaselineFromFormState,
    ],
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
