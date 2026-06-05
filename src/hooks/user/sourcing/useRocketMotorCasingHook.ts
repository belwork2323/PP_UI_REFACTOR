import { startTransition, useCallback, useEffect, useMemo, useState } from "react";
import { useAlertStore } from "../../../app/store/alertStore";
import { useAuthStore } from "../../../app/store/authStore";
import { useUserBatchRefreshStore } from "../../../app/store/userBatchRefreshStore";
import { STRINGS } from "../../../app/config/strings";
import rocketMotorCasingController from "../../../controllers/user/sourcing/rocketMotorCasingController";
import {
  buildCasingFormPayload,
  canDeleteRocketMotorCasing,
  dimensionalRowFromParameter,
  normalizeDimensionalRow,
  mapCasingFormDataToDetailBlocks,
  normalizeRocketCasingListStatus,
  INITIAL_ROCKET_MOTOR_CASING_FORM,
  RocketMotorCasingDetailsModel,
  type CasingDetailBlock,
  type RocketMotorCasingDetailsContext,
  serializeCasingForm,
  canSaveCasingDraft,
  validateCasingFormForSubmit,
  type RocketMotorCasingFormData,
} from "../../../data/models/user/RocketMotorCasingProcurementModel";
import useDimensionalParametersHook from "../useDimensionalParametersHook";
import {
  createEmptyRocketMotorBatch,
  RocketMotorBatch,
  SOURCING_STATUS,
} from "./sourcingWorkflowData";
import { useRocketMotorCasingList } from "./useRocketMotorCasingList";
import useRocketMotorCasingLookups from "./useRocketMotorCasingLookups";
import { OPERATION_STATUS } from "../../operationStatus";

type WorkflowView = "list" | "form" | "details";
type FormEntryMode = "create" | "fill" | "edit";

const shouldUseCreateEndpoint = (batch: RocketMotorBatch | null) => {
  if (!batch) return false;
  const noPersistedCasing =
    !String(batch.motorCasingId ?? "").trim() &&
    !String(batch.procurementId ?? "").trim() &&
    !String(batch.formId ?? "").trim();
  return batch.rmStatus === OPERATION_STATUS.INITIATED && noPersistedCasing;
};

export const useRocketMotorCasingHook = () => {
  const [view, setView] = useState<WorkflowView>("list");
  const [formEntryMode, setFormEntryMode] = useState<FormEntryMode>("create");
  const [activeBatch, setActiveBatch] = useState<RocketMotorBatch | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [casingForm, setCasingForm] = useState<RocketMotorCasingFormData>(INITIAL_ROCKET_MOTOR_CASING_FORM);
  const [initialSnapshot, setInitialSnapshot] = useState(serializeCasingForm(INITIAL_ROCKET_MOTOR_CASING_FORM));
  const [loadingFormDetails, setLoadingFormDetails] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [backConfirmOpen, setBackConfirmOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTargetMotorCasingId, setDeleteTargetMotorCasingId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [hasSavedDraft, setHasSavedDraft] = useState(false);
  const [detailsRow, setDetailsRow] = useState<RocketMotorCasingDetailsContext | null>(null);
  const [detailsBlocks, setDetailsBlocks] = useState<CasingDetailBlock[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [dimensionalParameters, setDimensionalParameters] = useState<any[]>([]);
  const [dimensionalParametersErrorMessage, setDimensionalParametersErrorMessage] = useState("");
  const [fetchingMotorParams, setFetchingMotorParams] = useState(false);

  const listParams = useRocketMotorCasingList();
  const lookups = useRocketMotorCasingLookups();

  const [submitConfirm, setSubmitConfirm] = useState(false);
  const [draftConfirm, setDraftConfirm] = useState(false);

  const showAlert = useAlertStore.getState().showAlert;
  const user = useAuthStore((s) => s.user);
  const bumpBatchRefresh = useUserBatchRefreshStore((s) => s.bumpVersion);
  const { fetchDimensionalParameters, isLoading: isDimensionalParamsLoading } = useDimensionalParametersHook();

  const subDepartmentId = useMemo(
    () => user?.allSubDepartments.find((sd) => sd.slugs?.subDept === "rocket-motor")?.subDepartmentId,
    [user]
  );

  const isFormDirty = useMemo(
    () => serializeCasingForm(casingForm) !== initialSnapshot,
    [casingForm, initialSnapshot]
  );

  const resolvedMotorStage = String(casingForm.motorStageApi ?? "").trim() || activeBatch?.motorType || "";

  const SUCCESS_ALERT_MS = 2200;

  const returnToListWithSuccess = (message: string) => {
    showAlert(message, "success", {
      autoCloseMs: SUCCESS_ALERT_MS,
      onCloseAction: () => {
        bumpBatchRefresh();
        void listParams.refreshUserBatches().then(() => resetFormContext());
      },
    });
  };

  const stayOnFormWithDraftSuccess = (message: string) => {
    showAlert(message, "success", { autoCloseMs: SUCCESS_ALERT_MS });
    setHasSavedDraft(true);
    bumpBatchRefresh();
    void listParams.refreshUserBatches();
  };

  const reloadCasingFormDetails = async (motorCasingId: string): Promise<boolean> => {
    const id = String(motorCasingId ?? "").trim();
    if (!id) {
      showAlert(STRINGS.SOURCING.CASING_FORM.FORM_ID_MISSING, "error");
      return false;
    }

    setLoadingFormDetails(true);
    try {
      const detailsResponse = await rocketMotorCasingController.fetchFormDetails({ motorCasingId: id });
      if (!detailsResponse?.success || !detailsResponse.data) {
        const fallback =
          detailsResponse?.statusCode === 404
            ? STRINGS.SOURCING.CASING_FORM.DETAILS_NOT_FOUND
            : STRINGS.SOURCING.CASING_FORM.DETAILS_FETCH_ERROR;
        showAlert(resolveCasingErrorMessage(detailsResponse, fallback), "error");
        return false;
      }

      const detailsModel = detailsResponse.data as RocketMotorCasingDetailsModel;
      const resolvedForm = RocketMotorCasingDetailsModel.toCasingFormData(detailsModel);
      const stage = resolvedForm.motorStageApi || "";

      await loadDimensionalForStage(stage, resolvedForm.dimensionalData);

      setActiveBatch((prev) =>
        prev
          ? {
              ...prev,
              formId: detailsModel.formId || prev.formId,
              procurementId: detailsModel.formId || prev.procurementId,
              motorCasingId: detailsModel.motorCasingId || prev.motorCasingId,
              motorStage: detailsModel.motorStage || prev.motorStage,
              motorNo: detailsModel.motorId || prev.motorNo,
              motorId: detailsModel.motorId || prev.motorId,
              motorType: detailsModel.motorStage || prev.motorType,
              rmStatus: normalizeRocketCasingListStatus(detailsModel.status),
            }
          : prev
      );
      setCasingForm(resolvedForm);
      setInitialSnapshot(serializeCasingForm(resolvedForm));
      setFormEntryMode((mode) => (mode === "create" ? "fill" : mode));
      return true;
    } finally {
      setLoadingFormDetails(false);
    }
  };

  const resetFormContext = () => {
    setView("list");
    setFormEntryMode("create");
    setActiveBatch(null);
    setIsEditMode(false);
    setCasingForm(INITIAL_ROCKET_MOTOR_CASING_FORM);
    setInitialSnapshot(serializeCasingForm(INITIAL_ROCKET_MOTOR_CASING_FORM));
    setLoadingFormDetails(false);
    setActionLoading(false);
    setBackConfirmOpen(false);
    setDraftConfirm(false);
    setSubmitConfirm(false);
    setDimensionalParameters([]);
    setDimensionalParametersErrorMessage("");
    setFetchingMotorParams(false);
    setHasSavedDraft(false);
    setDetailsRow(null);
    setDetailsBlocks([]);
    setLoadingDetails(false);
  };

  const alignDimensionalRows = (params: any[], current: RocketMotorCasingFormData["dimensionalData"]) => {
    if (!params.length) return [];
    const byId = new Map(current.filter((r) => r.paramId).map((r) => [r.paramId, r]));
    return params.map((p, idx) => {
      const existing = byId.get(p.paramId);
      return existing ? normalizeDimensionalRow(existing) : dimensionalRowFromParameter(p, idx);
    });
  };

  const resolveCasingErrorMessage = (response: any, fallback: string) => {
    const apiErr = response?.error as { details?: string; code?: string } | string | null | undefined;
    const fromDetails =
      apiErr && typeof apiErr === "object" && apiErr.details != null ? String(apiErr.details) : null;
    const code =
      (apiErr && typeof apiErr === "object" ? apiErr.code : null) ||
      response?.errorCode ||
      null;

    if (response?.statusCode === 409 && (code === "FORM_ALREADY_EXISTS" || response?.errorCode === "FORM_ALREADY_EXISTS")) {
      return STRINGS.SOURCING.CASING_FORM.FORM_ALREADY_EXISTS;
    }
    if (response?.statusCode === 409 && code === "INVALID_STATE_UPDATE") {
      return STRINGS.SOURCING.CASING_FORM.INVALID_STATE_UPDATE;
    }
    if (response?.statusCode === 409 && code === "INVALID_STATE_FOR_DELETION") {
      return fromDetails || STRINGS.SOURCING.CASING_FORM.DELETE_NOT_ALLOWED;
    }
    if (code === "INVALID_PARAM_ID" || response?.errorCode === "INVALID_PARAM_ID") {
      return STRINGS.SOURCING.CASING_FORM.INVALID_PARAM_ID;
    }
    if (code === "INVALID_MOTOR_STAGE") {
      return fromDetails || STRINGS.SOURCING.CASING_FORM.INVALID_MOTOR_TYPE;
    }
    if (code === "MISSING_UNITS") {
      return fromDetails || response?.message || fallback;
    }
    if (code === "MISSING_INSULATION_PROPS") {
      return fromDetails || response?.message || fallback;
    }
    if (code === "MISSING_VISUAL_INSPECTION" || code === "MISSING_DIMENSIONAL_READINGS") {
      return fromDetails || response?.message || fallback;
    }
    if (response?.statusCode === 404 && response?.errorCode === "FORM_NOT_FOUND") {
      return STRINGS.SOURCING.CASING_FORM.FORM_NOT_FOUND;
    }

    return fromDetails || response?.message || fallback;
  };

  const loadDimensionalForStage = async (stage: string, currentRows: RocketMotorCasingFormData["dimensionalData"]) => {
    if (!stage) {
      setDimensionalParameters([]);
      setDimensionalParametersErrorMessage("");
      return;
    }
    const { parameters, errorMessage } = await fetchDimensionalParameters(stage);
    setDimensionalParameters(parameters);
    setDimensionalParametersErrorMessage(errorMessage ?? "");
    if (parameters.length) {
      setCasingForm((prev) => ({
        ...prev,
        dimensionalData: alignDimensionalRows(parameters, currentRows),
      }));
    }
  };

  const openForm = async (batch: RocketMotorBatch, editMode: boolean) => {
    const shouldFetchDetails =
      editMode ||
      batch.rmStatus === SOURCING_STATUS.IN_PROGRESS ||
      batch.rmStatus === SOURCING_STATUS.REJECTED ||
      batch.rmStatus === SOURCING_STATUS.WAITING_FOR_APPROVAL;

    let resolvedForm = { ...INITIAL_ROCKET_MOTOR_CASING_FORM };
    let resolvedBatch = { ...batch };

    if (!shouldFetchDetails) {
      resolvedForm = {
        ...resolvedForm,
        projectId: String(batch.projectId ?? ""),
        motorCasingId: String(batch.motorCasingId ?? ""),
        motorStageApi: String(batch.motorStage ?? ""),
        motorId: String(batch.motorId ?? batch.motorNo ?? ""),
      };
    } else {
      const motorCasingId = String(batch.motorCasingId ?? "").trim();
      if (!motorCasingId) {
        showAlert(STRINGS.SOURCING.CASING_FORM.FORM_ID_MISSING, "error");
        return;
      }

      setLoadingFormDetails(true);
      const detailsResponse = await rocketMotorCasingController.fetchFormDetails({ motorCasingId });
      setLoadingFormDetails(false);

      if (!detailsResponse?.success || !detailsResponse.data) {
        const fallback =
          detailsResponse?.statusCode === 404
            ? STRINGS.SOURCING.CASING_FORM.DETAILS_NOT_FOUND
            : STRINGS.SOURCING.CASING_FORM.DETAILS_FETCH_ERROR;
        showAlert(resolveCasingErrorMessage(detailsResponse, fallback), "error");
        return;
      }

      const detailsModel = detailsResponse.data as RocketMotorCasingDetailsModel;
      resolvedForm = RocketMotorCasingDetailsModel.toCasingFormData(detailsModel);
      resolvedBatch = {
        ...resolvedBatch,
        motorCasingId: detailsModel.motorCasingId || resolvedBatch.motorCasingId,
        motorStage: detailsModel.motorStage || resolvedBatch.motorStage,
        motorNo: detailsModel.motorId || resolvedBatch.motorNo,
        motorId: detailsModel.motorId || resolvedBatch.motorId,
        motorType: detailsModel.motorStage || resolvedBatch.motorType,
      };
    }

    const stage = resolvedForm.motorStageApi || resolvedBatch.motorType || "";
    await loadDimensionalForStage(stage, resolvedForm.dimensionalData);

    setActiveBatch(resolvedBatch);
    setIsEditMode(editMode);
    setFormEntryMode(editMode ? "edit" : "fill");
    setCasingForm(resolvedForm);
    setInitialSnapshot(serializeCasingForm(resolvedForm));
    setView("form");
  };

  const batchToDetailsContext = (batch: RocketMotorBatch): RocketMotorCasingDetailsContext => ({
    formId: String(batch.formId ?? batch.procurementId ?? ""),
    projectId: String(batch.projectId ?? ""),
    motorCasingId: String(batch.motorCasingId ?? batch.batchId ?? ""),
    procurementId: String(batch.procurementId ?? batch.formId ?? ""),
    motorStage: String(batch.motorStage ?? batch.motorType ?? ""),
    motorNo: String(batch.motorNo ?? batch.motorId ?? ""),
    casingType: String(batch.casingType ?? batch.batchType ?? ""),
    insulationType: String(batch.insulationType ?? ""),
    receivingDate: String(batch.receivingDate ?? ""),
    rmStatus: batch.rmStatus,
    createdBy: batch.createdBy ?? (batch.assignedTo ? { id: "", fullName: batch.assignedTo.fullName } : null),
    createdOn: batch.createdOn,
    rejectionReason: batch.rejectionReason,
  });

  const handleViewCasingDetails = async (batch: RocketMotorBatch) => {
    const motorCasingId = String(batch.motorCasingId ?? batch.batchId ?? "").trim();
    if (!motorCasingId) {
      showAlert(STRINGS.SOURCING.CASING_FORM.FORM_ID_MISSING, "error");
      return;
    }

    setDetailsRow(batchToDetailsContext(batch));
    setDetailsBlocks([]);
    setView("details");
    setLoadingDetails(true);

    try {
      const detailsResponse = await rocketMotorCasingController.fetchFormDetails({ motorCasingId });

      if (!detailsResponse?.success || !detailsResponse.data) {
        const fallback =
          detailsResponse?.statusCode === 404
            ? STRINGS.SOURCING.CASING_FORM.DETAILS_NOT_FOUND
            : STRINGS.SOURCING.CASING_FORM.DETAILS_FETCH_ERROR;
        showAlert(resolveCasingErrorMessage(detailsResponse, fallback), "error");
        resetFormContext();
        return;
      }

      const detailsModel = detailsResponse.data as RocketMotorCasingDetailsModel;
      const formData = RocketMotorCasingDetailsModel.toCasingFormData(detailsModel);
      const blocks = mapCasingFormDataToDetailBlocks(formData);

      setDetailsBlocks(blocks);
      setDetailsRow({
        formId: detailsModel.formId || String(batch.formId ?? ""),
        projectId: detailsModel.projectId || "",
        motorCasingId: detailsModel.motorCasingId || motorCasingId,
        procurementId: String(batch.procurementId ?? detailsModel.formId ?? ""),
        motorStage: detailsModel.motorStage || batch.motorStage || "",
        motorNo: detailsModel.motorId || detailsModel.motorNo || batch.motorNo || batch.motorId || "",
        casingType: formData.casingType || String(batch.casingType ?? batch.batchType ?? ""),
        insulationType: formData.insulationType || String(batch.insulationType ?? ""),
        receivingDate: formData.receivingDate || String(batch.receivingDate ?? ""),
        rmStatus: normalizeRocketCasingListStatus(detailsModel.status),
        createdBy: batch.assignedTo ? { fullName: batch.assignedTo.fullName } : null,
        createdOn: batch.createdOn,
        rejectionReason: batch.rejectionReason,
      });
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleBackFromDetails = () => {
    setDetailsRow(null);
    setDetailsBlocks([]);
    setLoadingDetails(false);
    setView("list");
  };

  const handleCreateMotorCasing = () => {
    const empty = { ...INITIAL_ROCKET_MOTOR_CASING_FORM, dimensionalData: [] };
    setFormEntryMode("create");
    setActiveBatch(createEmptyRocketMotorBatch());
    setCasingForm(empty);
    setInitialSnapshot(serializeCasingForm(empty));
    setIsEditMode(false);
    setLoadingFormDetails(false);
    setDimensionalParameters([]);
    setDimensionalParametersErrorMessage("");
    setFetchingMotorParams(false);
    setView("form");
  };

  useEffect(() => {
    if (view !== "form") return;
    const stage = String(casingForm.motorStageApi ?? "").trim();
    if (!stage) {
      setFetchingMotorParams(false);
      return;
    }

    let cancelled = false;
    setFetchingMotorParams(true);

    (async () => {
      try {
        const { parameters, errorMessage } = await fetchDimensionalParameters(stage);
        if (cancelled) return;
        setDimensionalParameters(parameters);
        setDimensionalParametersErrorMessage(errorMessage ?? "");
        if (parameters.length) {
          startTransition(() => {
            setCasingForm((prev) => ({
              ...prev,
              dimensionalData: alignDimensionalRows(parameters, prev.dimensionalData),
            }));
          });
        }
      } finally {
        if (!cancelled) setFetchingMotorParams(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [casingForm.motorStageApi, view, fetchDimensionalParameters]);

  const handleFillForm = async (batch: RocketMotorBatch) => openForm(batch, false);
  const handleEditForm = async (batch: RocketMotorBatch) => openForm(batch, true);

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

  const submitCasingForm = async (intent: "draft" | "submit") => {
    if (!activeBatch) return false;

    if (!subDepartmentId) {
      showAlert(STRINGS.SOURCING.CASING_FORM.SUB_DEPARTMENT_MISSING, "error");
      return false;
    }

    const isCreateFlow = shouldUseCreateEndpoint(activeBatch);
    const submissionType = intent === "draft" ? "DRAFT" : "SUBMIT";

    const validationError = validateCasingFormForSubmit(casingForm, "DRAFT");
    if (validationError) {
      showAlert(validationError, "warning");
      return false;
    }

    const resolvedMotorCasingId = String(
      casingForm.motorCasingId || activeBatch.motorCasingId || ""
    ).trim();

    if (!isCreateFlow && !resolvedMotorCasingId) {
      showAlert(STRINGS.SOURCING.CASING_FORM.BATCH_ID_MISSING, "error");
      return false;
    }

    const payload = buildCasingFormPayload(casingForm, subDepartmentId, submissionType, {
      includeMotorCasingId: !isCreateFlow,
      motorCasingId: resolvedMotorCasingId,
    });

    setActionLoading(true);
    try {
      const response = isCreateFlow
        ? await rocketMotorCasingController.createForm(payload)
        : await rocketMotorCasingController.updateForm({
            ...payload,
            motorCasingId: resolvedMotorCasingId,
          });

      if (!response?.success) {
        const fallback = isCreateFlow
          ? STRINGS.SOURCING.CASING_FORM.CREATE_FAILED
          : STRINGS.SOURCING.CASING_FORM.UPDATE_FAILED;
        showAlert(resolveCasingErrorMessage(response, fallback), "error");
        return false;
      }

      const data = response.data;
      const successMessage =
        response.message ||
        (intent === "draft"
          ? isCreateFlow
            ? STRINGS.SOURCING.CASING_FORM.CREATE_DRAFT_SUCCESS
            : STRINGS.SOURCING.CASING_FORM.UPDATE_DRAFT_SUCCESS
          : isCreateFlow
            ? STRINGS.SOURCING.CASING_FORM.CREATE_SUBMIT_SUCCESS
            : STRINGS.SOURCING.CASING_FORM.UPDATE_SUBMIT_SUCCESS);

      if (intent === "draft") {
        const motorCasingId = String(
          data?.motorCasingId || casingForm.motorCasingId || activeBatch.motorCasingId || ""
        ).trim();
        if (motorCasingId) {
          setActiveBatch((prev) =>
            prev
              ? {
                  ...prev,
                  formId: data?.formId ?? prev.formId,
                  procurementId: data?.procurementId ?? data?.formId ?? prev.procurementId,
                  motorCasingId: motorCasingId || prev.motorCasingId,
                  motorId: casingForm.motorId || prev.motorId,
                  rmStatus: data?.status ? (data.status as typeof prev.rmStatus) : prev.rmStatus,
                }
              : prev
          );
          const reloaded = await reloadCasingFormDetails(motorCasingId);
          if (reloaded) stayOnFormWithDraftSuccess(successMessage);
          return reloaded;
        }
      }

      returnToListWithSuccess(successMessage);
      return true;
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmDraft = async () => {
    setDraftConfirm(false);
    await submitCasingForm("draft");
  };

  const handleConfirmSubmit = async () => {
    setSubmitConfirm(false);
    await submitCasingForm("submit");
  };

  const closeDeleteCasingConfirm = useCallback(() => {
    if (deleteLoading) return;
    setDeleteConfirmOpen(false);
    setDeleteTargetMotorCasingId(null);
  }, [deleteLoading]);

  const openDeleteCasingConfirm = useCallback((motorCasingId: string) => {
    setDeleteTargetMotorCasingId(motorCasingId);
    setDeleteConfirmOpen(true);
  }, []);

  const handleDeleteCasingFromList = useCallback(
    (batch: RocketMotorBatch) => {
      if (!canDeleteRocketMotorCasing(batch.rmStatus)) {
        showAlert(STRINGS.SOURCING.CASING_FORM.DELETE_NOT_ALLOWED, "warning");
        return;
      }
      const motorCasingId = String(batch.motorCasingId ?? "").trim();
      if (!motorCasingId) {
        showAlert(STRINGS.SOURCING.CASING_FORM.FORM_ID_MISSING, "error");
        return;
      }
      openDeleteCasingConfirm(motorCasingId);
    },
    [openDeleteCasingConfirm, showAlert]
  );

  const handleDeleteCasingFromForm = useCallback(() => {
    const motorCasingId = String(activeBatch?.motorCasingId ?? casingForm.motorCasingId ?? "").trim();
    if (!motorCasingId || !canDeleteRocketMotorCasing(activeBatch?.rmStatus)) {
      showAlert(STRINGS.SOURCING.CASING_FORM.DELETE_NOT_ALLOWED, "warning");
      return;
    }
    openDeleteCasingConfirm(motorCasingId);
  }, [activeBatch, casingForm.motorCasingId, openDeleteCasingConfirm, showAlert]);

  const handleConfirmDeleteCasing = useCallback(async () => {
    const motorCasingId = deleteTargetMotorCasingId?.trim();
    if (!motorCasingId || deleteLoading) return;

    setDeleteLoading(true);
    try {
      const response = await rocketMotorCasingController.deleteForm({ motorCasingId });

      if (!response?.success) {
        showAlert(resolveCasingErrorMessage(response, STRINGS.SOURCING.CASING_FORM.DELETE_FAILED), "error");
        return;
      }

      setDeleteConfirmOpen(false);
      setDeleteTargetMotorCasingId(null);

      const wasOnForm = view === "form";
      if (wasOnForm) resetFormContext();

      const SUCCESS_ALERT_MS = 2200;
      showAlert(
        response.message || STRINGS.SOURCING.CASING_FORM.DELETE_SUCCESS,
        "success",
        {
          autoCloseMs: SUCCESS_ALERT_MS,
          onCloseAction: () => {
            void listParams.refreshUserBatches();
          },
        }
      );

      if (!wasOnForm) {
        void listParams.refreshUserBatches();
      }
    } finally {
      setDeleteLoading(false);
    }
  }, [deleteTargetMotorCasingId, deleteLoading, listParams, resolveCasingErrorMessage, showAlert, view]);

  const canSaveDraft = useMemo(() => canSaveCasingDraft(casingForm), [casingForm]);
  const canSubmit = canSaveDraft;

  const canDeleteActiveCasing =
    formEntryMode !== "create" && canDeleteRocketMotorCasing(activeBatch?.rmStatus);

  return {
    view,
    detailsRow,
    detailsBlocks,
    loadingDetails,
    handleViewCasingDetails,
    handleBackFromDetails,
    formEntryMode,
    activeBatch,
    isEditMode,
    casingForm,
    setCasingForm,
    formData: casingForm,
    isFormDirty,
    loadingFormDetails,
    actionLoading,
    dimensionalParameters,
    dimensionalParametersErrorMessage,
    isDimensionalParamsLoading,
    fetchingMotorParams,
    resolvedMotorStage,
    subDepartmentId: subDepartmentId ?? 0,
    lookups,
    backConfirmOpen,
    deleteConfirmOpen,
    deleteLoading,
    canDeleteActiveCasing,
    closeDeleteCasingConfirm,
    handleConfirmDeleteCasing,
    handleDeleteCasingFromList,
    handleDeleteCasingFromForm,
    canSubmit,
    canSaveDraft,
    ...listParams,
    submitConfirm,
    draftConfirm,
    setSubmitConfirm,
    setDraftConfirm,
    setBackConfirmOpen,
    handleCreateMotorCasing,
    handleFillForm,
    handleEditForm,
    handleBack,
    handleDiscardAndBack,
    handleConfirmDraft,
    handleConfirmSubmit,
  };
};

export default useRocketMotorCasingHook;
