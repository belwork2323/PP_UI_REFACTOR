import { useCallback, useMemo, useState } from "react";
import { STRINGS } from "../../../app/config/strings";
import { useAlertStore } from "../../../app/store/alertStore";
import { useAuthStore } from "../../../app/store/authStore";
import { useUserBatchRefreshStore } from "../../../app/store/userBatchRefreshStore";
import stfController from "../../../controllers/user/quality_control/stfController";
import {
  mapSTFPayload,
  STFDetailsModel,
} from "../../../data/models/user/StaticTestFacilityApiModel";
import {
  createDefaultStaticTestFacilityFormState,
  hasAnyStaticTestFacilityValue,
  hydrateStaticTestFacilityFormState,
  mapStaticTestFacilityDetailsToFormState,
  type StaticTestFacilityFormState,
} from "../../../data/models/user/StaticTestFacilityFormModel";
import {
  fetchStfSchema,
  mapStfSubType,
  type SchemaFormValues,
  type StfSubType,
} from "../../../schema-engine";
import {
  canLoadStfForm,
  mergeStfMockBatches,
  type STFBatch,
} from "./stfFlowConfig";
import { useSubdepartmentBatches } from "../useSubdepartmentBatches";
import { QUALITY_CONTROL_STATUS } from "./qualityControlWorkflowData";

type WorkflowView = "list" | "form" | "details";

const normalizeBatch = (batch: any): STFBatch => ({
  ...batch,
  lotId: batch?.lotId ?? "",
  stfStatus: batch?.stfStatus ?? batch?.status ?? QUALITY_CONTROL_STATUS.INITIATED,
  formId: batch?.formId ?? null,
  subType: batch?.subType ?? null,
  motorIdNo: batch?.motorIdNo ?? null,
  rejectionReason: batch?.rejectionReason ?? null,
});

export const useStaticTestFacilityHook = () => {
  const listParams = useSubdepartmentBatches("static-test-facility");
  const user = useAuthStore((state) => state.user);
  const showAlert = useAlertStore((state) => state.showAlert);
  const bumpBatchRefresh = useUserBatchRefreshStore((state) => state.bumpVersion);
  const messages = STRINGS.QUALITY_CONTROL.STATIC_TEST_FACILITY;

  const subDepartmentId = useMemo(
    () =>
      user?.allSubDepartments.find(
        (subDept) => subDept.slugs?.subDept === "static-test-facility",
      )?.subDepartmentId,
    [user],
  );

  const [view, setView] = useState<WorkflowView>("list");
  const [activeBatch, setActiveBatch] = useState<STFBatch | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState<StaticTestFacilityFormState>(
    createDefaultStaticTestFacilityFormState(),
  );
  const [initialSnapshot, setInitialSnapshot] = useState(
    JSON.stringify(createDefaultStaticTestFacilityFormState()),
  );
  const [selectedMotorType, setSelectedMotorType] = useState<StfSubType | "">("");
  const [motorIdNo, setMotorIdNo] = useState("");
  const [loadingFormDetails, setLoadingFormDetails] = useState(false);
  const [schemaLoading, setSchemaLoading] = useState(false);
  const [schemaError, setSchemaError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [backConfirmOpen, setBackConfirmOpen] = useState(false);
  const [hasSavedDraft, setHasSavedDraft] = useState(false);
  const [detailsRow, setDetailsRow] = useState<any>(null);
  const [detailsData, setDetailsData] = useState<any>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const batches = useMemo(
    () => mergeStfMockBatches((listParams.batches ?? []).map(normalizeBatch)),
    [listParams.batches],
  );

  const formSnapshot = useMemo(
    () =>
      JSON.stringify({
        formData,
        selectedMotorType,
        motorIdNo,
      }),
    [formData, selectedMotorType, motorIdNo],
  );

  const isFormDirty = useMemo(
    () => view === "form" && formSnapshot !== initialSnapshot,
    [view, formSnapshot, initialSnapshot],
  );

  const resetFormContext = useCallback(() => {
    const defaults = createDefaultStaticTestFacilityFormState();
    setView("list");
    setActiveBatch(null);
    setIsEditMode(false);
    setFormData(defaults);
    setInitialSnapshot(JSON.stringify({ formData: defaults, selectedMotorType: "", motorIdNo: "" }));
    setSelectedMotorType("");
    setMotorIdNo("");
    setLoadingFormDetails(false);
    setSchemaLoading(false);
    setSchemaError(null);
    setActionLoading(false);
    setBackConfirmOpen(false);
    setHasSavedDraft(false);
    setDetailsRow(null);
    setDetailsData(null);
    setDetailsLoading(false);
  }, []);

  const getErrorMessage = (response: any, fallbackMessage: string) => {
    if (response?.error?.details) return response.error.details;
    if (response?.message) return response.message;
    return fallbackMessage;
  };

  const fetchStfSchemaDocument = useCallback(
    async (subType: StfSubType) => {
      if (!subDepartmentId) {
        showAlert(messages.SUB_DEPARTMENT_MISSING, "error");
        return null;
      }

      const cached = formData.schemasBySubType?.[subType];
      if (cached) return cached;

      setSchemaLoading(true);
      setSchemaError(null);
      try {
        const response = await fetchStfSchema({ subDepartmentId, subType });
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
    },
    [formData.schemasBySubType, messages.SCHEMA_FETCH_ERROR, messages.SUB_DEPARTMENT_MISSING, showAlert, subDepartmentId],
  );

  const handleMotorTypeChange = useCallback((value: string) => {
    const nextType = value ? mapStfSubType(value) : "";
    setSelectedMotorType(nextType);
    setSchemaError(null);
    setFormData((prev) => ({
      ...prev,
      schemaFormLoaded: false,
      subType: nextType || null,
      stfSchema: null,
      schemaFormValues: {},
    }));
  }, []);

  const handleMotorIdNoChange = useCallback((value: string) => {
    setMotorIdNo(value);
    setFormData((prev) => ({ ...prev, motorIdNo: value }));
  }, []);

  const handleLoadStfForm = useCallback(async () => {
    if (!selectedMotorType || !canLoadStfForm(selectedMotorType, motorIdNo)) return;

    const schema = await fetchStfSchemaDocument(selectedMotorType);
    if (!schema) return;

    setFormData((prev) => {
      const hydrated = hydrateStaticTestFacilityFormState(
        {
          ...prev,
          motorIdNo,
          subType: selectedMotorType,
        },
        schema,
        selectedMotorType,
      );
      return hydrated;
    });
  }, [fetchStfSchemaDocument, motorIdNo, selectedMotorType]);

  const handleFormValuesChange = useCallback((values: SchemaFormValues) => {
    setFormData((prev) => ({ ...prev, schemaFormValues: values }));
  }, []);

  const openFormWithResolvedData = useCallback(
    async (batch: STFBatch, editMode: boolean) => {
      const shouldFetchDetails =
        editMode ||
        batch.stfStatus === QUALITY_CONTROL_STATUS.IN_PROGRESS ||
        batch.stfStatus === QUALITY_CONTROL_STATUS.REJECTED;

      let resolvedData = createDefaultStaticTestFacilityFormState();
      let resolvedFormId = batch.formId ?? null;
      let rejectionReason = batch.rejectionReason ?? null;
      const initialMotorType = batch.subType
        ? mapStfSubType(batch.subType)
        : batch.motorType
          ? mapStfSubType(batch.motorType)
          : "";
      const initialMotorIdNo = String(batch.motorIdNo ?? batch.motorId ?? "");

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
        const detailsResponse = await stfController.fetchFormDetails({
          formId: resolvedFormId,
          subDepartmentId,
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

        resolvedData = STFDetailsModel.toFormState(detailsResponse.data);
        resolvedFormId = detailsResponse.data.formId || resolvedFormId;
        rejectionReason =
          detailsResponse.data.workflowInsights?.rejectionReason ?? rejectionReason;
      }

      const nextMotorType: StfSubType | null = resolvedData.subType ?? (initialMotorType || null);
      const nextMotorIdNo = resolvedData.motorIdNo || initialMotorIdNo;

      setActiveBatch({
        ...batch,
        formId: resolvedFormId,
        subType: nextMotorType,
        motorIdNo: nextMotorIdNo,
        rejectionReason,
      });
      setSelectedMotorType(nextMotorType ?? "");
      setMotorIdNo(nextMotorIdNo);
      setIsEditMode(editMode);
      setView("form");

      if (nextMotorType) {
        const schema = await fetchStfSchemaDocument(nextMotorType);
        if (schema) {
          const hydrated = hydrateStaticTestFacilityFormState(
            { ...resolvedData, motorIdNo: nextMotorIdNo },
            schema,
            nextMotorType,
          );
          setFormData(hydrated);
          setInitialSnapshot(
            JSON.stringify({
              formData: hydrated,
              selectedMotorType: nextMotorType,
              motorIdNo: nextMotorIdNo,
            }),
          );
          return;
        }
      }

      setInitialSnapshot(
        JSON.stringify({
          formData: resolvedData,
          selectedMotorType: nextMotorType ?? "",
          motorIdNo: nextMotorIdNo,
        }),
      );
    },
    [
      fetchStfSchemaDocument,
      messages.DETAILS_FETCH_ERROR,
      messages.DETAILS_NOT_FOUND,
      messages.FORM_ID_MISSING,
      messages.SUB_DEPARTMENT_MISSING,
      showAlert,
      subDepartmentId,
    ],
  );

  const handleFillForm = useCallback(
    async (batch: STFBatch) => {
      await openFormWithResolvedData(batch, false);
    },
    [openFormWithResolvedData],
  );

  const handleEditForm = useCallback(
    async (batch: STFBatch) => {
      await openFormWithResolvedData(batch, true);
    },
    [openFormWithResolvedData],
  );

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

  const submitForm = async (intent: "draft" | "submit") => {
    if (!activeBatch) return false;

    if (!subDepartmentId) {
      showAlert(messages.SUB_DEPARTMENT_MISSING, "error");
      return false;
    }

    if (!formData.schemaFormLoaded || !formData.stfSchema) {
      showAlert(messages.SCHEMA_NOT_LOADED, "warning");
      return false;
    }

    if (!hasAnyStaticTestFacilityValue(formData)) {
      showAlert(messages.EMPTY_FORM_ERROR, "warning");
      return false;
    }

    const mapped = mapSTFPayload(formData);
    const subType = formData.subType ?? "";
    const isCreateFlow =
      activeBatch.stfStatus === QUALITY_CONTROL_STATUS.INITIATED && !activeBatch.formId;

    setActionLoading(true);
    try {
      let response;

      if (isCreateFlow) {
        if (!activeBatch.batchId) {
          showAlert(messages.BATCH_ID_MISSING, "error");
          return false;
        }

        response = await stfController.createForm({
          batchId: activeBatch.batchId,
          subDepartmentId,
          formSubmissionType: intent === "draft" ? "DRAFT" : "SUBMIT",
          subType,
          ...mapped,
        });
      } else {
        if (!activeBatch.formId) {
          showAlert(messages.FORM_ID_MISSING, "error");
          return false;
        }

        response = await stfController.updateForm({
          formId: activeBatch.formId,
          batchId: activeBatch.batchId ?? "",
          subDepartmentId,
          formSubmissionType: intent === "draft" ? "DRAFT" : "SUBMIT",
          subType,
          ...mapped,
        });
      }

      if (!response?.success) {
        const fallback = isCreateFlow ? messages.CREATE_FAILED : messages.UPDATE_FAILED;
        showAlert(getErrorMessage(response, fallback), "error");
        return false;
      }

      const nextFormId = response.data?.formId ?? activeBatch.formId ?? null;
      setActiveBatch((prev) =>
        prev
          ? {
              ...prev,
              formId: nextFormId,
              subType: formData.subType,
              motorIdNo: formData.motorIdNo,
            }
          : prev,
      );
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
  };

  const handleSaveDraft = async () => submitForm("draft");
  const handleSubmit = async () => submitForm("submit");

  const handleViewDetails = useCallback(
    async (row: STFBatch) => {
      if (!row.formId) {
        showAlert(messages.FORM_ID_MISSING, "error");
        return;
      }
      if (!subDepartmentId) {
        showAlert(messages.SUB_DEPARTMENT_MISSING, "error");
        return;
      }

      setDetailsLoading(true);
      const response = await stfController.fetchFormDetails({
        formId: row.formId,
        subDepartmentId,
      });
      setDetailsLoading(false);

      if (!response?.success || !response?.data) {
        showAlert(
          response?.message || messages.DETAILS_FETCH_ERROR,
          "error",
        );
        return;
      }

      setDetailsRow(row);
      setDetailsData(response.data);
      setView("details");
    },
    [showAlert, subDepartmentId, messages],
  );

  const handleBackFromDetails = useCallback(() => {
    setDetailsRow(null);
    setDetailsData(null);
    setView("list");
  }, []);

  return {
    ...listParams,
    batches,
    view,
    activeBatch,
    isEditMode,
    formData,
    isFormDirty,
    selectedMotorType,
    motorIdNo,
    loadingFormDetails,
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
    handleMotorTypeChange,
    handleMotorIdNoChange,
    handleLoadStfForm,
    handleFormValuesChange,
    handleSaveDraft,
    handleSubmit,
    detailsRow,
    detailsData,
    detailsLoading,
    handleViewDetails,
    handleBackFromDetails,
  };
};

export default useStaticTestFacilityHook;
