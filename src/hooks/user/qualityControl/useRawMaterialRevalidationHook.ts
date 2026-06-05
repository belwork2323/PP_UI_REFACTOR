import { useCallback, useMemo, useState } from "react";
import { STRINGS } from "../../../app/config/strings";
import { useAlertStore } from "../../../app/store/alertStore";
import { useAuthStore } from "../../../app/store/authStore";
import { useUserBatchRefreshStore } from "../../../app/store/userBatchRefreshStore";
import rawMaterialRevalidationController from "../../../controllers/user/quality_control/rawMaterialRevalidationController";
import {
  mapBlocksToRawMaterialRevalidationPayload,
  RawMaterialRevalidationDetailsModel,
} from "../../../data/models/user/QCRawMaterialRevalidationApiModel";
import {
  createDefaultRawMaterialRevalidationState,
  hasAnyRawMaterialRevalidationValue,
  type RawMaterialRevalidationBlock,
} from "../../../data/models/user/QCRawMaterialRevalidationModel";
import { useSubdepartmentBatches } from "../useSubdepartmentBatches";
import { QUALITY_CONTROL_STATUS } from "./qualityControlWorkflowData";

type WorkflowView = "list" | "form";

export type RawMaterialRevalidationBatch = {
  id: number | string;
  batchId: string;
  motorId: string;
  motorType: string;
  priority: string;
  assignedTo: { fullName: string } | null;
  createdOn: string;
  qcRmStatus: string;
  formId?: string | null;
  draftData?: RawMaterialRevalidationBlock[];
  rejectionReason?: string | null;
};

const normalizeBatch = (batch: any): RawMaterialRevalidationBatch => ({
  ...batch,
  qcRmStatus: batch?.qcRmStatus ?? batch?.status ?? QUALITY_CONTROL_STATUS.INITIATED,
  formId: batch?.formId ?? null,
  draftData: Array.isArray(batch?.draftData) ? batch.draftData : createDefaultRawMaterialRevalidationState(),
  rejectionReason: batch?.rejectionReason ?? null,
});

export const useRawMaterialRevalidationHook = () => {
  const [view, setView] = useState<WorkflowView>("list");
  const [activeBatch, setActiveBatch] = useState<RawMaterialRevalidationBatch | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formBlocks, setFormBlocks] = useState<RawMaterialRevalidationBlock[]>([]);
  const [initialSnapshot, setInitialSnapshot] = useState("[]");
  const [loadingFormDetails, setLoadingFormDetails] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [backConfirmOpen, setBackConfirmOpen] = useState(false);
  const [hasSavedDraft, setHasSavedDraft] = useState(false);

  const listParams = useSubdepartmentBatches("raw-material-revalidation");
  const user = useAuthStore((state) => state.user);
  const showAlert = useAlertStore((state) => state.showAlert);
  const bumpBatchRefresh = useUserBatchRefreshStore((state) => state.bumpVersion);
  const messages = STRINGS.QUALITY_CONTROL.RAW_MATERIAL_REVALIDATION;

  const subDepartmentId = useMemo(
    () =>
      user?.allSubDepartments.find((subDept) => subDept.slugs?.subDept === "raw-material-revalidation")
        ?.subDepartmentId,
    [user],
  );

  const batches = useMemo(() => (listParams.batches ?? []).map(normalizeBatch), [listParams.batches]);

  const isFormDirty = useMemo(
    () => JSON.stringify(formBlocks) !== initialSnapshot,
    [formBlocks, initialSnapshot],
  );

  const resetFormContext = () => {
    setView("list");
    setActiveBatch(null);
    setIsEditMode(false);
    setFormBlocks(createDefaultRawMaterialRevalidationState());
    setInitialSnapshot("[]");
    setLoadingFormDetails(false);
    setActionLoading(false);
    setBackConfirmOpen(false);
    setHasSavedDraft(false);
  };

  const getErrorMessage = (response: any, fallbackMessage: string) => {
    if (response?.error?.details) return response.error.details;
    if (response?.message) return response.message;
    return fallbackMessage;
  };

  const openFormWithResolvedData = async (batch: RawMaterialRevalidationBatch, editMode: boolean) => {
    const shouldFetchDetails =
      editMode ||
      batch.qcRmStatus === QUALITY_CONTROL_STATUS.IN_PROGRESS ||
      batch.qcRmStatus === QUALITY_CONTROL_STATUS.REJECTED;

    let resolvedBlocks = batch.draftData ?? createDefaultRawMaterialRevalidationState();
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
      const detailsResponse = await rawMaterialRevalidationController.fetchFormDetails({
        formId: resolvedFormId,
        subDepartmentId,
      });
      setLoadingFormDetails(false);

      if (!detailsResponse?.success || !detailsResponse.data) {
        const fallback = detailsResponse?.statusCode === 404 ? messages.DETAILS_NOT_FOUND : messages.DETAILS_FETCH_ERROR;
        showAlert(getErrorMessage(detailsResponse, fallback), "error");
        return;
      }

      resolvedBlocks = RawMaterialRevalidationDetailsModel.toBlocks(detailsResponse.data);
      resolvedFormId = detailsResponse.data.formId || resolvedFormId;
      rejectionReason = detailsResponse.data.workflowInsights?.rejectionReason ?? rejectionReason;
    }

    const openedBatch: RawMaterialRevalidationBatch = {
      ...batch,
      formId: resolvedFormId,
      draftData: resolvedBlocks,
      rejectionReason,
    };

    setActiveBatch(openedBatch);
    setFormBlocks(resolvedBlocks);
    setInitialSnapshot(JSON.stringify(resolvedBlocks));
    setIsEditMode(editMode);
    setView("form");
  };

  const handleFillForm = async (batch: RawMaterialRevalidationBatch) => {
    await openFormWithResolvedData(batch, false);
  };

  const handleEditForm = async (batch: RawMaterialRevalidationBatch) => {
    await openFormWithResolvedData(batch, true);
  };

  const handleBlocksChange = useCallback((blocks: RawMaterialRevalidationBlock[]) => {
    const nextBlocks = blocks ?? [];
    setFormBlocks((prev) => (prev === nextBlocks ? prev : nextBlocks));
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

  const submitForm = async (blocks: RawMaterialRevalidationBlock[], intent: "draft" | "submit") => {
    if (!activeBatch) {
      return false;
    }

    if (!subDepartmentId) {
      showAlert(messages.SUB_DEPARTMENT_MISSING, "error");
      return false;
    }

    if (!hasAnyRawMaterialRevalidationValue(blocks)) {
      showAlert(messages.EMPTY_FORM_ERROR, "warning");
      return false;
    }

    const payloadBlocks = mapBlocksToRawMaterialRevalidationPayload(blocks).filter((block) => {
      if (!block.ingredientCode) return false;
      return block.rows.some((row) => row.specificationCode);
    });

    if (!payloadBlocks.length) {
      showAlert(messages.EMPTY_FORM_ERROR, "warning");
      return false;
    }

    const isCreateFlow = activeBatch.qcRmStatus === QUALITY_CONTROL_STATUS.INITIATED && !activeBatch.formId;

    setActionLoading(true);
    try {
      let response;

      if (isCreateFlow) {
        if (!activeBatch.batchId) {
          showAlert(messages.BATCH_ID_MISSING, "error");
          return false;
        }

        response = await rawMaterialRevalidationController.createForm({
          batchId: activeBatch.batchId,
          subDepartmentId,
          formSubmissionType: intent === "draft" ? "DRAFT" : "SUBMIT",
          blocks: payloadBlocks,
        });
      } else {
        if (!activeBatch.formId) {
          showAlert(messages.FORM_ID_MISSING, "error");
          return false;
        }

        response = await rawMaterialRevalidationController.updateForm({
          formId: activeBatch.formId,
          subDepartmentId,
          formSubmissionType: intent === "draft" ? "DRAFT" : "UPDATE",
          blocks: payloadBlocks,
        });
      }

      if (!response?.success) {
        const fallback = isCreateFlow ? messages.CREATE_FAILED : messages.UPDATE_FAILED;
        showAlert(getErrorMessage(response, fallback), "error");
        return false;
      }

      const nextFormId = response.data?.formId ?? activeBatch.formId ?? null;
      setActiveBatch((prev) => (prev ? { ...prev, formId: nextFormId, draftData: blocks } : prev));
      setFormBlocks(blocks);
      setInitialSnapshot(JSON.stringify(blocks));

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

  const handleSaveDraft = async (blocks: RawMaterialRevalidationBlock[]) => {
    return await submitForm(blocks, "draft");
  };

  const handleSubmit = async (blocks: RawMaterialRevalidationBlock[]) => {
    return await submitForm(blocks, "submit");
  };

  return {
    ...listParams,
    view,
    activeBatch,
    isEditMode,
    formBlocks,
    isFormDirty,
    loadingFormDetails,
    actionLoading,
    backConfirmOpen,
    batches,
    handleFillForm,
    handleEditForm,
    handleBlocksChange,
    handleBack,
    handleDiscardAndBack,
    setBackConfirmOpen,
    handleSaveDraft,
    handleSubmit,
  };
};

export default useRawMaterialRevalidationHook;
