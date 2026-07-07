import { useCallback, useMemo, useState } from "react";
import { STRINGS } from "../../../app/config/strings";
import { useAlertStore } from "../../../app/store/alertStore";
import { useAuthStore } from "../../../app/store/authStore";
import { useUserBatchRefreshStore } from "../../../app/store/userBatchRefreshStore";
import ndtController from "../../../controllers/user/quality_control/ndtController";
import {
  mapNDTPayload,
  NDTDetailsModel,
} from "../../../data/models/user/NDTApiModel";
import {
  buildNDTAddedMotors,
  createDefaultNDTFormState,
  createEmptyNDTMotorSession,
  hasAnyNDTValue,
  motorHasValue,
  normalizeNDTFormState,
  normalizeNDTMotorSession,
  resolveRadiographyPlanRows,
  type NDTFormState,
  type NDTMotorSession,
} from "../../../data/models/user/NDTFormModel";
import { useSubdepartmentBatches } from "../useSubdepartmentBatches";
import { QUALITY_CONTROL_STATUS } from "./qualityControlWorkflowData";
import {
  getSelectedNDTDraftMotorIds,
  resolveEffectiveNDTMotorCount,
  resolveNDTMotorCountLimit,
  resolveNDTMotorOptions,
  type NDTAddedMotor,
  type NDTBatch,
} from "./ndtFlowConfig";

type WorkflowView = "list" | "form" | "details";

export type { NDTBatch };

const normalizeBatch = (batch: any): NDTBatch => ({
  ...batch,
  lotId: batch?.lotId ?? batch?.batchId ?? "",
  ndtStatus: batch?.ndtStatus ?? batch?.status ?? QUALITY_CONTROL_STATUS.INITIATED,
  formId: batch?.formId ?? null,
  draftData: batch?.draftData ?? null,
  rejectionReason: batch?.rejectionReason ?? null,
});

export const useNDTHook = () => {
  const [view, setView] = useState<WorkflowView>("list");
  const [activeBatch, setActiveBatch] = useState<NDTBatch | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState<NDTFormState>(createDefaultNDTFormState());
  const [initialSnapshot, setInitialSnapshot] = useState(
    () => JSON.stringify({ formData: createDefaultNDTFormState(), addedMotors: [] }),
  );
  const [loadingFormDetails, setLoadingFormDetails] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [backConfirmOpen, setBackConfirmOpen] = useState(false);
  const [hasSavedDraft, setHasSavedDraft] = useState(false);
  const [detailsRow, setDetailsRow] = useState<NDTBatch | null>(null);
  const [detailsData, setDetailsData] = useState<any>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const [motorCount, setMotorCount] = useState<number | "">("");
  const [draftMotorIds, setDraftMotorIds] = useState<string[]>([]);
  const [addedMotors, setAddedMotors] = useState<NDTAddedMotor[]>([]);

  const listParams = useSubdepartmentBatches("ndt");
  const user = useAuthStore((state) => state.user);
  const showAlert = useAlertStore((state) => state.showAlert);
  const bumpBatchRefresh = useUserBatchRefreshStore((state) => state.bumpVersion);
  const messages = STRINGS.QUALITY_CONTROL.NDT;

  const subDepartmentId = useMemo(
    () =>
      user?.allSubDepartments.find((subDept) => subDept.slugs?.subDept === "ndt")
        ?.subDepartmentId,
    [user],
  );

  const batches = useMemo(
    () => (listParams.batches ?? []).map(normalizeBatch),
    [listParams.batches],
  );

  const statusCounts = useMemo(
    () => listParams.statusCounts,
    [listParams.statusCounts],
  );

  const totalRecords = useMemo(
    () => listParams.totalRecords,
    [listParams.totalRecords],
  );

  const availableMotorOptions = useMemo(
    () => resolveNDTMotorOptions(activeBatch),
    [activeBatch],
  );

  const maxMotorCount = useMemo(
    () =>
      resolveNDTMotorCountLimit({
        availableMotorOptions,
        batchNumberOfMotors: Number((activeBatch as any)?.numberOfMotors ?? 0),
      }),
    [activeBatch, availableMotorOptions],
  );

  const formSnapshot = useMemo(
    () => JSON.stringify({ formData, addedMotors }),
    [formData, addedMotors],
  );

  const isFormDirty = useMemo(
    () => formSnapshot !== initialSnapshot,
    [formSnapshot, initialSnapshot],
  );

  const resetFlowDraft = useCallback(() => {
    setMotorCount("");
    setDraftMotorIds([]);
  }, []);

  const resetSetupDraft = useCallback(() => {
    setFormData((prev) =>
      normalizeNDTFormState({
        ...prev,
        equipment: "",
        beamEnergies: [],
        radiographyPlan: "",
        radiographyPlanRows: [],
      }),
    );
    resetFlowDraft();
  }, [resetFlowDraft]);

  const resetFormContext = () => {
    const defaults = createDefaultNDTFormState();
    setView("list");
    setActiveBatch(null);
    setIsEditMode(false);
    setFormData(defaults);
    setInitialSnapshot(JSON.stringify({ formData: defaults, addedMotors: [] }));
    setLoadingFormDetails(false);
    setActionLoading(false);
    setBackConfirmOpen(false);
    setHasSavedDraft(false);
    setAddedMotors([]);
    resetFlowDraft();
  };

  const getErrorMessage = (response: any, fallbackMessage: string) => {
    if (response?.error?.details) return response.error.details;
    if (response?.message) return response.message;
    return fallbackMessage;
  };

  const appendMotorsToForm = useCallback(
    (motorIds: string[]) => {
      if (!activeBatch || motorIds.length === 0) return false;

      setFormData((prev) => {
        const existing = (prev.motors ?? []).map((motor) => normalizeNDTMotorSession(motor));
        const nextMotors: NDTMotorSession[] = [
          ...existing,
          ...motorIds
            .filter((motorId) => !existing.some((motor) => motor.motorId === motorId))
            .map((motorId) => createEmptyNDTMotorSession(motorId)),
        ];

        return normalizeNDTFormState({
          ...prev,
          batchId: activeBatch.batchId ?? prev.batchId,
          formLoaded: true,
          radiographyPlanRows:
            prev.radiographyPlanRows.length > 0
              ? prev.radiographyPlanRows
              : resolveRadiographyPlanRows(prev.radiographyPlan),
          motors: nextMotors,
          motorId: nextMotors[0]?.motorId ?? prev.motorId,
        });
      });

      setAddedMotors((prev) => {
        const existingIds = new Set(prev.map((motor) => motor.motorId));
        return [...prev, ...motorIds.filter((id) => !existingIds.has(id)).map((motorId) => ({ motorId }))];
      });

      resetFlowDraft();
      return true;
    },
    [activeBatch, resetFlowDraft],
  );

  const handleLoadNDTForm = useCallback(() => {
    const count = resolveEffectiveNDTMotorCount(motorCount, draftMotorIds);
    if (count <= 0) return false;

    const selectedIds = getSelectedNDTDraftMotorIds(count, draftMotorIds);
    if (selectedIds.length !== count) return false;

    return appendMotorsToForm(selectedIds);
  }, [appendMotorsToForm, draftMotorIds, motorCount]);

  const handleAddMotors = useCallback(() => {
    if (!formData.formLoaded) {
      const loaded = handleLoadNDTForm();
      return loaded;
    }

    const count = resolveEffectiveNDTMotorCount(motorCount, draftMotorIds);
    if (count <= 0) return false;

    const selectedIds = getSelectedNDTDraftMotorIds(count, draftMotorIds);
    if (selectedIds.length !== count) return false;

    const existingIds = new Set(addedMotors.map((motor) => motor.motorId));
    const newIds = selectedIds.filter((id) => !existingIds.has(id));
    if (newIds.length === 0) return false;

    const added = appendMotorsToForm(newIds);
    if (added) {
      resetSetupDraft();
    }
    return added;
  }, [addedMotors, appendMotorsToForm, draftMotorIds, formData.formLoaded, handleLoadNDTForm, motorCount, resetSetupDraft]);

  const openFormWithResolvedData = async (batch: NDTBatch, editMode: boolean) => {
    const shouldFetchDetails =
      editMode ||
      batch.ndtStatus === QUALITY_CONTROL_STATUS.IN_PROGRESS ||
      batch.ndtStatus === QUALITY_CONTROL_STATUS.REJECTED ||
      !!batch.formId;

    let resolvedData = normalizeNDTFormState(
      batch.draftData ?? createDefaultNDTFormState(batch.batchId),
    );
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
      const detailsResponse = await ndtController.fetchFormDetails({
        formId: resolvedFormId,
        subDepartmentId,
      });
      setLoadingFormDetails(false);

      if (!detailsResponse?.success || !detailsResponse.data) {
        const fallback = detailsResponse?.statusCode === 404 ? messages.DETAILS_NOT_FOUND : messages.DETAILS_FETCH_ERROR;
        showAlert(getErrorMessage(detailsResponse, fallback), "error");
        return;
      }

      resolvedData = normalizeNDTFormState(NDTDetailsModel.toFormState(detailsResponse.data));
      resolvedFormId = detailsResponse.data.formId || resolvedFormId;
      rejectionReason = detailsResponse.data.workflowInsights?.rejectionReason ?? rejectionReason;
    }

    resolvedData = normalizeNDTFormState({
      ...resolvedData,
      motors: resolvedData.motors.filter(motorHasValue),
    });

    const openedBatch: NDTBatch = {
      ...batch,
      formId: resolvedFormId,
      draftData: resolvedData,
      rejectionReason,
    };

    const motors = buildNDTAddedMotors(resolvedData);

    setActiveBatch(openedBatch);
    setFormData(resolvedData);
    setAddedMotors(motors);
    setInitialSnapshot(JSON.stringify({ formData: resolvedData, addedMotors: motors }));
    setIsEditMode(editMode);
    setView("form");
    setMotorCount("");
    setDraftMotorIds([]);
  };

  const handleFillForm = async (batch: NDTBatch) => {
    await openFormWithResolvedData(batch, false);
  };

  const handleEditForm = async (batch: NDTBatch) => {
    await openFormWithResolvedData(batch, true);
  };

  const handleFormChange = useCallback((nextForm: NDTFormState) => {
    setFormData(normalizeNDTFormState(nextForm));
  }, []);

  const handleSetupChange = useCallback((patch: Partial<NDTFormState>) => {
    setFormData((prev) => {
      const merged = { ...prev, ...patch };
      if (patch.radiographyPlan && patch.radiographyPlan !== prev.radiographyPlan) {
        merged.radiographyPlanRows = resolveRadiographyPlanRows(patch.radiographyPlan);
      }
      return normalizeNDTFormState(merged);
    });
  }, []);

  const handleMotorSessionChange = useCallback((motorId: string, patch: Partial<NDTMotorSession>) => {
    setFormData((prev) =>
      normalizeNDTFormState({
        ...prev,
        motors: (prev.motors ?? []).map((motor) =>
          motor.motorId === motorId
            ? normalizeNDTMotorSession({ ...motor, ...patch, motorId })
            : normalizeNDTMotorSession(motor),
        ),
      }),
    );
  }, []);

  const handleMotorCountChange = useCallback((count: number | "") => {
    setMotorCount(count);
    setDraftMotorIds((prev) => {
      if (count === "") return [];
      return Array.from({ length: Number(count) }, (_, idx) => prev[idx] ?? "");
    });
  }, []);

  const handleDraftMotorIdChange = useCallback((index: number, motorId: string) => {
    setDraftMotorIds((prev) => {
      const next = [...prev];
      next[index] = motorId;
      return next;
    });
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

  const submitForm = async (payload: NDTFormState, intent: "draft" | "submit") => {
    if (!activeBatch) return false;

    if (!subDepartmentId) {
      showAlert(messages.SUB_DEPARTMENT_MISSING, "error");
      return false;
    }

    const normalized = normalizeNDTFormState(payload);
    if (!hasAnyNDTValue(normalized)) {
      showAlert(messages.EMPTY_FORM_ERROR, "warning");
      return false;
    }

    const mapped = mapNDTPayload(normalized);
    const isCreateFlow = activeBatch.ndtStatus === QUALITY_CONTROL_STATUS.INITIATED && !activeBatch.formId;

    setActionLoading(true);
    try {
      let response;

      if (isCreateFlow) {
        if (!activeBatch.batchId) {
          showAlert(messages.BATCH_ID_MISSING, "error");
          return false;
        }

        response = await ndtController.createForm({
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

        response = await ndtController.updateForm({
          formId: activeBatch.formId,
          batchId: activeBatch.batchId,
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
      setActiveBatch((prev) => (prev ? { ...prev, formId: nextFormId, draftData: normalized } : prev));
      setFormData(normalized);
      setInitialSnapshot(JSON.stringify({ formData: normalized, addedMotors }));

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

  const handleSaveDraft = async (payload?: NDTFormState) => {
    return await submitForm(payload ?? formData, "draft");
  };

  const handleSubmit = async (payload?: NDTFormState) => {
    return await submitForm(payload ?? formData, "submit");
  };

  const handleViewDetails = async (row: NDTBatch) => {
    if (!row.formId) {
      showAlert(messages.FORM_ID_MISSING, "error");
      return;
    }
    if (!subDepartmentId) {
      showAlert(messages.SUB_DEPARTMENT_MISSING, "error");
      return;
    }

    setDetailsLoading(true);
    const response = await ndtController.fetchFormDetails({
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
  };

  const handleBackFromDetails = () => {
    setDetailsRow(null);
    setDetailsData(null);
    setView("list");
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
    statusCounts,
    totalRecords,
    detailsRow,
    detailsData,
    detailsLoading,
    motorCount,
    draftMotorIds,
    addedMotors,
    availableMotorOptions,
    maxMotorCount,
    handleFillForm,
    handleEditForm,
    handleBack,
    handleFormChange,
    handleSetupChange,
    handleMotorSessionChange,
    handleMotorCountChange,
    handleDraftMotorIdChange,
    handleLoadNDTForm,
    handleAddMotors,
    handleDiscardAndBack,
    setBackConfirmOpen,
    handleSaveDraft,
    handleSubmit,
    handleViewDetails,
    handleBackFromDetails,
  };
};

export default useNDTHook;
