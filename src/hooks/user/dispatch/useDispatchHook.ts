import { useCallback, useMemo, useState } from "react";
import { STRINGS } from "../../../app/config/strings";
import { useAlertStore } from "../../../app/store/alertStore";
import { useAuthStore } from "../../../app/store/authStore";
import { useUserBatchRefreshStore } from "../../../app/store/userBatchRefreshStore";
import dispatchController from "../../../controllers/user/dispatch/dispatchController";
import {
  DispatchDetailsModel,
} from "../../../data/models/user/DispatchApiModel";
import {
  appendDispatchMotorToState,
  createDefaultDispatchFormState,
  hasAnyDispatchValue,
  mapDispatchFormStateToBackendPayload,
  mapDispatchFormStateToUpdatePayload,
  type DispatchFormState,
} from "../../../data/models/user/DispatchFormModel";
import { fetchDispatchSchema, type SchemaFormValues } from "../../../schema-engine";
import {
  type DispatchAddedMotor,
  type DispatchBatch,
  normalizeDispatchMotorStage,
  parseDispatchMotorIds,
} from "./dispatchFlowConfig";
import { OPERATION_STATUS } from "../../operationStatus";
import { useSubdepartmentBatches } from "../useSubdepartmentBatches";

type WorkflowView = "list" | "form" | "details";

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

export const useDispatchHook = () => {
  const listParams = useSubdepartmentBatches("dispatch");
  const user = useAuthStore((state) => state.user);
  const showAlert = useAlertStore((state) => state.showAlert);
  const bumpBatchRefresh = useUserBatchRefreshStore((state) => state.bumpVersion);
  const messages = STRINGS.DISPATCH;

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
  
  const [schemaLoading, setSchemaLoading] = useState(false);
  const [schemaError, setSchemaError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [backConfirmOpen, setBackConfirmOpen] = useState(false);
  const [hasSavedDraft, setHasSavedDraft] = useState(false);

  const [formData, setFormData] = useState<DispatchFormState>(() => createDefaultDispatchFormState());
  const [initialSnapshot, setInitialSnapshot] = useState("{}");
  const [draftMotorId, setDraftMotorId] = useState("");

  const addedMotors = useMemo<DispatchAddedMotor[]>(
    () => (formData.motors ?? []).map((motor) => ({ motorId: motor.motorId })),
    [formData.motors],
  );

  const resetFlowDraft = useCallback(() => {
    setDraftMotorId("");
    setSchemaError(null);
  }, []);

  const batches = useMemo(
    () => (listParams.batches ?? []).map(normalizeBatch),
    [listParams.batches],
  );

  const formSnapshot = useMemo(() => JSON.stringify(formData), [formData]);

  const isFormDirty = useMemo(
    () => view === "form" && formSnapshot !== initialSnapshot,
    [view, formSnapshot, initialSnapshot],
  );

  const isUpdateMode = useMemo(() => Boolean(activeBatch?.formId), [activeBatch?.formId]);

  const canSaveDraft = useMemo(() => {
    if (isUpdateMode) return true;
    return (
      formData.schemaFormLoaded &&
      Boolean(formData.dispatchSchema) &&
      (formData.motors ?? []).length > 0 &&
      hasAnyDispatchValue(formData)
    );
  }, [formData, isUpdateMode]);

  const canSubmit = useMemo(
    () =>
      formData.schemaFormLoaded &&
      Boolean(formData.dispatchSchema) &&
      (formData.motors ?? []).length > 0 &&
      hasAnyDispatchValue(formData),
    [formData],
  );

  const resetFormContext = useCallback(() => {
    const defaults = createDefaultDispatchFormState();
    setView("list");
    setActiveBatch(null);
    setIsEditMode(false);
    setFormData(defaults);
    setInitialSnapshot(JSON.stringify(defaults));
    setLoadingFormDetails(false);
    setSchemaLoading(false);
    setSchemaError(null);
    setActionLoading(false);
    setBackConfirmOpen(false);
    setHasSavedDraft(false);
    setDetailsRow(null);
    setDetailsData(null);
    resetFlowDraft();
  }, [resetFlowDraft]);

  const getErrorMessage = (response: any, fallbackMessage: string) => {
    if (response?.error?.details) return response.error.details;
    if (response?.message) return response.message;
    return fallbackMessage;
  };

  const fetchDispatchSchemaDocument = useCallback(async () => {
    if (!subDepartmentId) {
      showAlert(messages.SUB_DEPARTMENT_MISSING, "error");
      return null;
    }

    setSchemaLoading(true);
    setSchemaError(null);
    try {
      const response = await fetchDispatchSchema({ subDepartmentId });
      if (!response?.success || !response?.data) {
        const message = getErrorMessage(response, messages.SCHEMA_FETCH_ERROR);
        setSchemaError(message);
        showAlert(message, "error");
        return null;
      }
      return response.data;
    } finally {
      setSchemaLoading(false);
    }
  }, [messages.SCHEMA_FETCH_ERROR, messages.SUB_DEPARTMENT_MISSING, showAlert, subDepartmentId]);

  const updateSetupField = useCallback(
    <K extends keyof DispatchFormState>(field: K, value: DispatchFormState[K]) => {
      setFormData((prev) => {
        const next = { ...prev, [field]: value };
        const hasMotors = (prev.motors ?? []).length > 0;

        if (field === "motorStage" && !hasMotors) {
          next.motors = [];
          next.schemaFormLoaded = false;
          next.dispatchSchema = null;
        }
        if (field === "ndtClearance" && value !== "YES") {
          next.ndtMomNo = "";
        }
        if (field === "finalAcceptanceClearance" && value !== "YES") {
          next.finalAcceptanceMomNo = "";
        }
        return next;
      });

      if (field === "motorStage") {
        setDraftMotorId("");
      }
    },
    [],
  );

  const appendMotorToForm = useCallback(
    async (motorId: string, savedSchemaValues?: Record<string, unknown>) => {
      const trimmedId = String(motorId ?? "").trim();
      if (!trimmedId) return false;

      const schema = formData.dispatchSchema ?? (await fetchDispatchSchemaDocument());
      if (!schema) return false;

      setFormData((prev) => appendDispatchMotorToState(prev, schema, trimmedId, savedSchemaValues));
      resetFlowDraft();
      return true;
    },
    [fetchDispatchSchemaDocument, formData.dispatchSchema, resetFlowDraft],
  );

  const handleLoadDispatchForm = useCallback(async () => {
    if (addedMotors.length > 0) return false;
    return appendMotorToForm(draftMotorId);
  }, [addedMotors.length, appendMotorToForm, draftMotorId]);

  const handleAddDispatchMotor = useCallback(async () => {
    if (addedMotors.length === 0) return false;
    return appendMotorToForm(draftMotorId);
  }, [addedMotors.length, appendMotorToForm, draftMotorId]);

  const handleDraftMotorIdChange = useCallback((value: string) => {
    setDraftMotorId(value);
  }, []);

  const handleFormValuesChange = useCallback((motorId: string, values: SchemaFormValues) => {
    setFormData((prev) => ({
      ...prev,
      motors: (prev.motors ?? []).map((motor) =>
        motor.motorId === motorId ? { ...motor, schemaFormValues: values } : motor,
      ),
    }));
  }, []);

  const handleRemoveMotor = useCallback(
    (motorId: string) => {
      setFormData((prev) => {
        const nextMotors = (prev.motors ?? []).filter((motor) => motor.motorId !== motorId);
        return {
          ...prev,
          motors: nextMotors,
          schemaFormLoaded: nextMotors.length > 0,
        };
      });
      resetFlowDraft();
    },
    [resetFlowDraft],
  );

  const openFormWithResolvedData = useCallback(
    async (batch: DispatchBatch, editMode: boolean) => {
      const shouldFetchDetails =
        editMode ||
        batch.dispatchStatus === OPERATION_STATUS.IN_PROGRESS ||
        batch.dispatchStatus === OPERATION_STATUS.REJECTED;

      let resolvedData = createDefaultDispatchFormState();
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
        const detailsResponse = await dispatchController.fetchFormDetails({
          formId: resolvedFormId,
          // subDepartmentId,
        });
        setLoadingFormDetails(false);

        if (!detailsResponse?.success || !detailsResponse.data) {
          const fallback =
            detailsResponse?.statusCode === 404
              ? messages.DETAILS_NOT_FOUND
              : messages.DETAILS_FETCH_ERROR;
          showAlert(getErrorMessage(detailsResponse, fallback), "error");
          return;
        }

        resolvedData = DispatchDetailsModel.toFormState(detailsResponse.data);
        resolvedFormId = detailsResponse.data.formId || resolvedFormId;
        rejectionReason =
          detailsResponse.data.workflowInsights?.rejectionReason ?? rejectionReason;
      } else {
        resolvedData = {
          ...resolvedData,
          motorStage: normalizeDispatchMotorStage(batch.motorStage ?? batch.motorType),
        };
      }

      setActiveBatch({
        ...batch,
        formId: resolvedFormId,
        rejectionReason,
      });
      setFormData(resolvedData);
      setIsEditMode(editMode);
      setView("form");
      resetFlowDraft();

      if (resolvedData.motors.length > 0) {
        const schema = await fetchDispatchSchemaDocument();
        if (schema) {
          let hydrated: DispatchFormState = {
            ...resolvedData,
            motors: [],
            dispatchSchema: schema,
            schemaFormLoaded: false,
          };
          for (const motor of resolvedData.motors) {
            hydrated = appendDispatchMotorToState(
              hydrated,
              schema,
              motor.motorId,
              motor.savedSchemaValues,
              motor.setup,
            );
          }
          setFormData(hydrated);
          setInitialSnapshot(JSON.stringify(hydrated));
          return;
        }
      }

      setInitialSnapshot(JSON.stringify(resolvedData));
    },
    [fetchDispatchSchemaDocument, messages.DETAILS_FETCH_ERROR, messages.DETAILS_NOT_FOUND, messages.FORM_ID_MISSING, messages.SUB_DEPARTMENT_MISSING, resetFlowDraft, showAlert, subDepartmentId],
  );

  const handleViewDispatchDetails = useCallback(
    async (row: DispatchBatch) => {
      if (!row.formId) {
        showAlert(messages.FORM_ID_MISSING, "error");
        return;
      }

      setDetailsLoading(true);
      const response = await dispatchController.fetchFormDetails({
        formId: row.formId,
        // subDepartmentId: subDepartmentId ?? 0,
      });
      setDetailsLoading(false);

      if (!response?.success || !response?.data) {
        showAlert(getErrorMessage(response, messages.DETAILS_FETCH_ERROR), "error");
        return;
      }

      setDetailsRow(row);
      setDetailsData(response.data);
      setView("details");
    },
    [messages.FORM_ID_MISSING, messages.DETAILS_FETCH_ERROR, showAlert, subDepartmentId],
  );

  const handleBackFromDetails = useCallback(() => {
    setDetailsRow(null);
    setDetailsData(null);
    setView("list");
    bumpBatchRefresh();
  }, [bumpBatchRefresh]);

  const handleFillForm = useCallback(
    async (batch: DispatchBatch) => {
      await openFormWithResolvedData(batch, false);
    },
    [openFormWithResolvedData],
  );

  const handleEditForm = useCallback(
    async (batch: DispatchBatch) => {
      await openFormWithResolvedData(batch, true);
    },
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

  const handleDiscardAndBack = useCallback(() => {
    setBackConfirmOpen(false);
    bumpBatchRefresh();
    resetFormContext();
  }, [bumpBatchRefresh, resetFormContext]);

  const submitForm = useCallback(
    async (intent: "draft" | "submit") => {
      if (!activeBatch) return false;

      if (!subDepartmentId) {
        showAlert(messages.SUB_DEPARTMENT_MISSING, "error");
        return false;
      }

      if (intent === "submit") {
        if (!formData.schemaFormLoaded || !formData.dispatchSchema || (formData.motors ?? []).length === 0) {
          showAlert(messages.SCHEMA_NOT_LOADED, "warning");
          return false;
        }
        if (!hasAnyDispatchValue(formData)) {
          showAlert(messages.EMPTY_FORM_ERROR, "warning");
          return false;
        }
      } else if (!isUpdateMode) {
        if (!formData.schemaFormLoaded || !formData.dispatchSchema || (formData.motors ?? []).length === 0) {
          showAlert(messages.SCHEMA_NOT_LOADED, "warning");
          return false;
        }
        if (!hasAnyDispatchValue(formData)) {
          showAlert(messages.EMPTY_FORM_ERROR, "warning");
          return false;
        }
      }

      const submissionMode: "DRAFT" | "SUBMIT" =
        intent === "draft" ? "DRAFT" : "SUBMIT";

      const isCreateFlow =
        activeBatch.dispatchStatus === OPERATION_STATUS.TO_BE_INITIATED && !activeBatch.formId;

      // Conditional payload assembly logic matching mapping architecture
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
          submissionMode
        );
      } else {
        if (!activeBatch.formId) {
          showAlert(messages.FORM_ID_MISSING, "error");
          return false;
        }
        mappedPayload = mapDispatchFormStateToUpdatePayload(
          formData,
          activeBatch.formId,
          activeBatch.batchId,
          subDepartmentId,
          submissionMode
        );
      }

      setActionLoading(true);
      try {
        let response;

        if (isCreateFlow) {
          response = await dispatchController.createForm(mappedPayload);
        } else {
          response = await dispatchController.updateForm(mappedPayload);
        }

        if (!response?.success) {
          const fallback = isCreateFlow ? messages.CREATE_FAILED : messages.UPDATE_FAILED;
          showAlert(getErrorMessage(response, fallback), "error");
          return false;
        }

        const nextFormId = response.data?.formId ?? activeBatch.formId ?? null;
        setActiveBatch((prev) => (prev ? { ...prev, formId: nextFormId } : prev));
        setInitialSnapshot(formSnapshot);

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
    },
    [activeBatch, subDepartmentId, formData, isUpdateMode, messages, formSnapshot, showAlert, listParams, resetFormContext],
  );

  const handleSaveDraft = useCallback(async () => submitForm("draft"), [submitForm]);
  const handleSubmit = useCallback(async () => submitForm("submit"), [submitForm]);

  return {
    ...listParams,
    loading: listParams.loading,
    loadingFormDetails,
    batches,
    view,
    activeBatch,
    isEditMode,
    formData,
    isFormDirty,
    isUpdateMode,
    canSaveDraft,
    canSubmit,
    draftMotorId,
    addedMotors,
    schemaLoading,
    schemaError,
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
    handleAddDispatchMotor,
    handleFormValuesChange,
    handleRemoveMotor,
    handleSaveDraft,
    handleSubmit,
    detailsRow,
    detailsData,
    detailsLoading,
    handleViewDispatchDetails,
    handleBackFromDetails,
  };
};

export default useDispatchHook;