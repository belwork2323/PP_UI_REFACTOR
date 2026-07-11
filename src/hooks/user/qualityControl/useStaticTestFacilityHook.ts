import { useCallback, useEffect, useMemo, useState } from "react";
import { STRINGS } from "../../../app/config/strings";
import { useAlertStore } from "../../../app/store/alertStore";
import { useAuthStore } from "../../../app/store/authStore";
import { useUserBatchRefreshStore } from "../../../app/store/userBatchRefreshStore";
import { operationsController } from "../../../controllers/user/operationsController";
import stfController from "../../../controllers/user/quality_control/stfController";
import {
  STFDetailsModel,
} from "../../../data/models/user/StaticTestFacilityApiModel";
import {
  buildStfAddedMotors,
  createDefaultStaticTestFacilityFormState,
  createEmptyStfMotorSession,
  hasAnyStaticTestFacilityValue,
  hydrateStaticTestFacilityFormState,
  hydrateStfMotorSession,
  mapStaticTestFacilityFormStateToPayload,
  normalizeStfMotorSession,
  resolveStfFormSubTypes,
  type StaticTestFacilityFormState,
  type StfMotorSession,
} from "../../../data/models/user/StaticTestFacilityFormModel";
import {
  fetchStfSchema,
  mapStfSubType,
  type SchemaFormValues,
  type StfSubType,
} from "../../../schema-engine";
import {
  mapApprovedMotorsToOptions,
  mergeStfMockBatches,
  mergeStfMotorOptions,
  resolveBatchMotorStage,
  resolveBatchProjectId,
  resolveStfMotorCountLimit,
  resolveStfMotorOptions,
  type STFBatch,
  type StfAddedMotor,
  type StfMotorOption,
} from "./stfFlowConfig";
import { useSubdepartmentBatches } from "../useSubdepartmentBatches";
import { QUALITY_CONTROL_STATUS } from "./qualityControlWorkflowData";

type WorkflowView = "list" | "form" | "details";

const normalizeBatch = (batch: any): STFBatch => ({
  ...batch,
  lotId: batch?.lotId ?? "",
  stfStatus: batch?.stfStatus ?? batch?.status ?? QUALITY_CONTROL_STATUS.TO_BE_INITIATED,
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
    JSON.stringify({ formData: createDefaultStaticTestFacilityFormState(), addedMotors: [] }),
  );
  const [selectedMotorType, setSelectedMotorType] = useState<StfSubType | "">("");
  const [motorCount, setMotorCount] = useState<number | "">("");
  const [draftMotorIds, setDraftMotorIds] = useState<string[]>([]);
  const [draftBemNo, setDraftBemNo] = useState("");
  const [addedMotors, setAddedMotors] = useState<StfAddedMotor[]>([]);
  const [approvedMotorOptions, setApprovedMotorOptions] = useState<StfMotorOption[]>([]);
  const [approvedMotorsLoading, setApprovedMotorsLoading] = useState(false);
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

  const batchMotorOptions = useMemo(
    () => resolveStfMotorOptions(activeBatch),
    [activeBatch],
  );

  const availableMotorOptions = useMemo(
    () => mergeStfMotorOptions(approvedMotorOptions, batchMotorOptions),
    [approvedMotorOptions, batchMotorOptions],
  );

  const maxMotorCount = useMemo(
    () =>
      resolveStfMotorCountLimit({
        availableMotorOptions,
        batchNumberOfMotors: Number(activeBatch?.numberOfMotors ?? 0),
      }),
    [activeBatch?.numberOfMotors, availableMotorOptions],
  );

  const formSnapshot = useMemo(
    () =>
      JSON.stringify({
        formData,
        addedMotors,
        selectedMotorType,
      }),
    [formData, addedMotors, selectedMotorType],
  );

  const isFormDirty = useMemo(
    () => view === "form" && formSnapshot !== initialSnapshot,
    [view, formSnapshot, initialSnapshot],
  );

  const resetFlowDraft = useCallback(() => {
    setMotorCount("");
    setDraftMotorIds([]);
    setDraftBemNo("");
  }, []);

  const resetFlowBarDraft = useCallback(() => {
    resetFlowDraft();
    setSchemaError(null);
  }, [resetFlowDraft]);

  const resetFormContext = useCallback(() => {
    const defaults = createDefaultStaticTestFacilityFormState();
    setView("list");
    setActiveBatch(null);
    setIsEditMode(false);
    setFormData(defaults);
    setInitialSnapshot(JSON.stringify({ formData: defaults, addedMotors: [], selectedMotorType: "" }));
    setSelectedMotorType("");
    setAddedMotors([]);
    setApprovedMotorOptions([]);
    setApprovedMotorsLoading(false);
    resetFlowDraft();
    setLoadingFormDetails(false);
    setSchemaLoading(false);
    setSchemaError(null);
    setActionLoading(false);
    setBackConfirmOpen(false);
    setHasSavedDraft(false);
    setDetailsRow(null);
    setDetailsData(null);
    setDetailsLoading(false);
  }, [resetFlowDraft]);

  const getErrorMessage = (response: any, fallbackMessage: string) => {
    const details = response?.error?.details;
    if (Array.isArray(details)) {
      const detailMessages = details
        .map((item: any) => (typeof item === "string" ? item : item?.message))
        .filter(Boolean);
      if (detailMessages.length > 0) return detailMessages.join("\n");
    }
    if (typeof details === "string" && details.trim()) return details;
    if (response?.message) return response.message;
    return fallbackMessage;
  };

  useEffect(() => {
    const projectId = resolveBatchProjectId(activeBatch);
    const motorStage = resolveBatchMotorStage(activeBatch);
    if (!activeBatch || !projectId || !motorStage) {
      setApprovedMotorOptions([]);
      return;
    }

    let active = true;
    setApprovedMotorsLoading(true);
    void operationsController
      .fetchApprovedMotorsList({ projectId, motorStage })
      .then((response) => {
        if (!active) return;
        if (response?.success && response.data) {
          setApprovedMotorOptions(mapApprovedMotorsToOptions(response.data.motors ?? []));
        } else {
          setApprovedMotorOptions([]);
        }
      })
      .finally(() => {
        if (active) setApprovedMotorsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [activeBatch]);

  const fetchStfSchemaDocument = useCallback(
    async (subType: StfSubType, options?: { silent?: boolean }) => {
      if (!subDepartmentId) {
        showAlert(messages.SUB_DEPARTMENT_MISSING, "error");
        return null;
      }

      const cached = formData.schemasBySubType?.[subType];
      if (cached) return cached;

      const silent = options?.silent ?? false;
      if (!silent) {
        setSchemaLoading(true);
        setSchemaError(null);
      }
      try {
        const response = await fetchStfSchema({ subDepartmentId, subType });
        if (!response?.success || !response?.data) {
          const message = getErrorMessage(response, messages.SCHEMA_FETCH_ERROR);
          setSchemaError(message);
          if (!silent) showAlert(message, "error");
          return null;
        }
        return response.data;
      } finally {
        if (!silent) setSchemaLoading(false);
      }
    },
    [formData.schemasBySubType, messages.SCHEMA_FETCH_ERROR, messages.SUB_DEPARTMENT_MISSING, showAlert, subDepartmentId],
  );

  const appendMotorsToForm = useCallback(
    async (motorIds: string[], subType: StfSubType) => {
      if (!activeBatch || motorIds.length === 0) return false;

      const schema = await fetchStfSchemaDocument(subType);
      if (!schema) return false;

      const newMotorSessions: StfMotorSession[] = motorIds
        .filter((motorId) => motorId.trim())
        .map((motorId) => hydrateStfMotorSession(createEmptyStfMotorSession(motorId, subType), schema));

      setFormData((prev) => {
        const existing = (prev.motors ?? []).map((motor) => normalizeStfMotorSession(motor));
        const nextMotors = [
          ...existing,
          ...newMotorSessions.filter(
            (motor) => !existing.some((existingMotor) => existingMotor.motorId === motor.motorId),
          ),
        ];

        return {
          ...prev,
          subType: prev.subType ?? subType,
          schemasBySubType: {
            ...(prev.schemasBySubType ?? {}),
            [subType]: schema,
          },
          stfSchema: prev.stfSchema ?? schema,
          motors: nextMotors,
          schemaFormLoaded: nextMotors.length > 0,
        };
      });

      setAddedMotors((prev) => {
        const existingIds = new Set(prev.map((motor) => motor.motorId));
        return [
          ...prev,
          ...motorIds
            .filter((id) => !existingIds.has(id))
            .map((motorId) => ({ motorId, subType })),
        ];
      });

      resetFlowBarDraft();
      return true;
    },
    [activeBatch, fetchStfSchemaDocument, resetFlowBarDraft],
  );

  const handleMotorTypeChange = useCallback((value: string) => {
    const nextType = value ? mapStfSubType(value) : "";
    setSelectedMotorType(nextType);
    setSchemaError(null);
    resetFlowDraft();
  }, [resetFlowDraft]);

  const handleMotorCountChange = useCallback((count: number | "") => {
    setMotorCount(count);
    setDraftMotorIds((prev) => {
      const nextCount = count === "" ? 0 : Number(count);
      if (nextCount <= 0) return [];
      return Array.from({ length: nextCount }, (_, idx) => prev[idx] ?? "");
    });
  }, []);

  const handleDraftMotorIdChange = useCallback((index: number, motorId: string) => {
    setDraftMotorIds((prev) => {
      const next = [...prev];
      next[index] = motorId;
      return next;
    });
  }, []);

  const handleDraftBemNoChange = useCallback((value: string) => {
    setDraftBemNo(value);
  }, []);

  const handleLoadStfForm = useCallback(async () => {
    if (!selectedMotorType) return false;

    if (selectedMotorType === "MAIN_MOTOR") {
      const count = motorCount === "" ? 0 : Number(motorCount);
      const effectiveCount = count > 0 ? count : draftMotorIds.some((id) => id.trim()) ? 1 : 0;
      if (effectiveCount <= 0) return false;

      const selectedIds = Array.from({ length: effectiveCount }, (_, idx) =>
        String(draftMotorIds[idx] ?? "").trim(),
      ).filter(Boolean);

      if (selectedIds.length !== effectiveCount) return false;
      if (new Set(selectedIds).size !== selectedIds.length) return false;

      const usedIds = addedMotors.map((motor) => motor.motorId);
      if (selectedIds.some((id) => usedIds.includes(id))) return false;

      return appendMotorsToForm(selectedIds, "MAIN_MOTOR");
    }

    const bemNo = String(draftBemNo ?? "").trim();
    if (!bemNo) return false;

    const usedIds = addedMotors.map((motor) => motor.motorId);
    if (usedIds.includes(bemNo)) return false;

    return appendMotorsToForm([bemNo], "BEM");
  }, [addedMotors, appendMotorsToForm, draftBemNo, draftMotorIds, motorCount, selectedMotorType]);

  const handleAddMotors = useCallback(async () => {
    if (!selectedMotorType) return false;

    if (selectedMotorType === "MAIN_MOTOR") {
      const count = motorCount === "" ? 0 : Number(motorCount);
      const effectiveCount = count > 0 ? count : draftMotorIds.some((id) => id.trim()) ? 1 : 0;
      if (effectiveCount <= 0) return false;

      const selectedIds = Array.from({ length: effectiveCount }, (_, idx) =>
        String(draftMotorIds[idx] ?? "").trim(),
      ).filter(Boolean);

      if (selectedIds.length !== effectiveCount) return false;
      if (new Set(selectedIds).size !== selectedIds.length) return false;

      const usedIds = new Set(addedMotors.map((motor) => motor.motorId));
      const newIds = selectedIds.filter((id) => !usedIds.has(id));
      if (newIds.length === 0) return false;

      return appendMotorsToForm(newIds, "MAIN_MOTOR");
    }

    const bemNo = String(draftBemNo ?? "").trim();
    if (!bemNo) return false;

    const usedIds = new Set(addedMotors.map((motor) => motor.motorId));
    if (usedIds.has(bemNo)) return false;

    return appendMotorsToForm([bemNo], "BEM");
  }, [addedMotors, appendMotorsToForm, draftBemNo, draftMotorIds, motorCount, selectedMotorType]);

  const handleRemoveMotor = useCallback((motorId: string) => {
    setFormData((prev) => {
      const nextMotors = (prev.motors ?? []).filter((motor) => motor.motorId !== motorId);
      return {
        ...prev,
        motors: nextMotors,
        schemaFormLoaded: nextMotors.length > 0,
      };
    });
    setAddedMotors((prev) => prev.filter((motor) => motor.motorId !== motorId));
    resetFlowDraft();
  }, [resetFlowDraft]);

  const handleFormValuesChange = useCallback((motorId: string, values: SchemaFormValues) => {
    setFormData((prev) => ({
      ...prev,
      motors: (prev.motors ?? []).map((motor) =>
        motor.motorId === motorId ? { ...motor, schemaFormValues: values } : motor,
      ),
    }));
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
      const nextAddedMotors = buildStfAddedMotors(resolvedData);
      const subTypesToHydrate = resolveStfFormSubTypes(resolvedData);

      setActiveBatch({
        ...batch,
        formId: resolvedFormId,
        subType: nextMotorType,
        rejectionReason,
      });
      setSelectedMotorType(nextMotorType ?? subTypesToHydrate[0] ?? "");
      setAddedMotors(nextAddedMotors);
      setIsEditMode(editMode);
      setView("form");
      resetFlowDraft();

      if (subTypesToHydrate.length > 0) {
        let hydrated = resolvedData;
        for (const subType of subTypesToHydrate) {
          const schema = await fetchStfSchemaDocument(subType, { silent: true });
          if (!schema) continue;
          hydrated = hydrateStaticTestFacilityFormState(hydrated, schema, subType);
        }

        setFormData(hydrated);
        setInitialSnapshot(
          JSON.stringify({
            formData: hydrated,
            addedMotors: nextAddedMotors,
            selectedMotorType: nextMotorType ?? subTypesToHydrate[0] ?? "",
          }),
        );
        return;
      }

      setFormData(resolvedData);
      setInitialSnapshot(
        JSON.stringify({
          formData: resolvedData,
          addedMotors: nextAddedMotors,
          selectedMotorType: nextMotorType ?? "",
        }),
      );
    },
    [
      fetchStfSchemaDocument,
      messages.DETAILS_FETCH_ERROR,
      messages.DETAILS_NOT_FOUND,
      messages.FORM_ID_MISSING,
      messages.SUB_DEPARTMENT_MISSING,
      resetFlowDraft,
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

    if ((formData.motors ?? []).length === 0) {
      showAlert(messages.EMPTY_FORM_ERROR, "warning");
      return false;
    }

    const subTypes = resolveStfFormSubTypes(formData);
    if (subTypes.length === 0) {
      showAlert(messages.EMPTY_FORM_ERROR, "warning");
      return false;
    }

    if (!subTypes.every((subType) => formData.schemasBySubType?.[subType])) {
      showAlert(messages.SCHEMA_NOT_LOADED, "warning");
      return false;
    }

    if (!hasAnyStaticTestFacilityValue(formData)) {
      showAlert(messages.EMPTY_FORM_ERROR, "warning");
      return false;
    }

    const mapped = mapStaticTestFacilityFormStateToPayload(formData);
    const isCreateFlow =
      activeBatch.stfStatus === QUALITY_CONTROL_STATUS.TO_BE_INITIATED && !activeBatch.formId;

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
        showAlert(response?.message || messages.DETAILS_FETCH_ERROR, "error");
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
    motorCount,
    draftMotorIds,
    draftBemNo,
    addedMotors,
    availableMotorOptions,
    maxMotorCount,
    approvedMotorsLoading,
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
    handleMotorCountChange,
    handleDraftMotorIdChange,
    handleDraftBemNoChange,
    handleLoadStfForm,
    handleAddMotors,
    handleRemoveMotor,
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
