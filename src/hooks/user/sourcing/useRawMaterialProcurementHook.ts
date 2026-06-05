import { startTransition, useCallback, useMemo, useState } from "react";
import { STRINGS } from "../../../app/config/strings";
import { useAlertStore } from "../../../app/store/alertStore";
import { useAuthStore } from "../../../app/store/authStore";
import { useUserBatchRefreshStore } from "../../../app/store/userBatchRefreshStore";
import rawMaterialProcurementController from "../../../controllers/user/sourcing/rawMaterialProcurementController";
import {
  createEmptyFormBatch,
  lotListRowToFormBatch,
  mapBlocksToCreateMaterials,
  canDeleteRawMaterialLot,
  mapFirstBlockToLotUpdatePayload,
  MaterialBlock,
  normalizeRawMaterialLotListStatus,
  serializeMaterialBlocks,
  RawMaterialFormBatch,
  RawMaterialLotDetailsModel,
  RawMaterialLotDetailsContext,
  RawMaterialLotListRow,
  SOURCING_STATUS,
} from "../../../data/models/user/RawMaterialProcurementModel";
import { useRawMaterialLotList } from "./useRawMaterialLotList";
import { rmCertDebug, summarizeBlocks } from "../../../utils/rawMaterialCertUploadDebug";

type WorkflowView = "list" | "form" | "details";
type FormEntryMode = "create" | "fill" | "edit";

export const useRawMaterialProcurementHook = () => {
  const [view, setView] = useState<WorkflowView>("list");
  const [formEntryMode, setFormEntryMode] = useState<FormEntryMode>("create");
  const [activeBatch, setActiveBatch] = useState<RawMaterialFormBatch | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formBlocks, setFormBlocks] = useState<MaterialBlock[]>([]);
  const [initialSnapshot, setInitialSnapshot] = useState("[]");
  const [loadingFormDetails, setLoadingFormDetails] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [backConfirmOpen, setBackConfirmOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTargetLotId, setDeleteTargetLotId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [hasSavedDraft, setHasSavedDraft] = useState(false);
  const [detailsRow, setDetailsRow] = useState<RawMaterialLotDetailsContext | null>(null);
  const [detailsBlocks, setDetailsBlocks] = useState<MaterialBlock[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const listParams = useRawMaterialLotList();
  const user = useAuthStore((s) => s.user);
  const showAlert = useAlertStore((state) => state.showAlert);
  const bumpBatchRefresh = useUserBatchRefreshStore((state) => state.bumpVersion);

  const subDepartmentId = useMemo(
    () =>
      user?.allSubDepartments.find((sd) => sd.slugs?.subDept === "raw-material")?.subDepartmentId,
    [user]
  );

  const isFormDirty = useMemo(
    () => serializeMaterialBlocks(formBlocks) !== initialSnapshot,
    [formBlocks, initialSnapshot]
  );

  const resetFormContext = () => {
    setView("list");
    setActiveBatch(null);
    setIsEditMode(false);
    setFormEntryMode("create");
    setFormBlocks([]);
    setInitialSnapshot("[]");
    setLoadingFormDetails(false);
    setActionLoading(false);
    setBackConfirmOpen(false);
    setHasSavedDraft(false);
    setDetailsRow(null);
    setDetailsBlocks([]);
    setLoadingDetails(false);
  };

  const getErrorMessage = (response: any, fallbackMessage: string) => {
    const details = response?.error?.details;
    if (details) return String(details);
    if (response?.message) return response.message;
    return fallbackMessage;
  };

  const SUCCESS_ALERT_MS = 2200;

  const returnToListWithSuccess = (message: string) => {
    showAlert(message, "success", {
      autoCloseMs: SUCCESS_ALERT_MS,
      onCloseAction: () => {
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

  const reloadLotFormDetails = async (lotId: string): Promise<boolean> => {
    const id = String(lotId ?? "").trim();
    if (!id) {
      showAlert(STRINGS.SOURCING.SPECIFICATION_FORM.BATCH_ID_MISSING, "error");
      return false;
    }

    setLoadingFormDetails(true);
    try {
      const detailsResponse = await rawMaterialProcurementController.fetchLotDetails({ lotId: id });

      if (!detailsResponse?.success || !detailsResponse.data) {
        const fallback =
          detailsResponse?.statusCode === 404
            ? STRINGS.SOURCING.SPECIFICATION_FORM.DETAILS_NOT_FOUND
            : STRINGS.SOURCING.SPECIFICATION_FORM.DETAILS_FETCH_ERROR;
        showAlert(getErrorMessage(detailsResponse, fallback), "error");
        return false;
      }

      const blocks = RawMaterialLotDetailsModel.toMaterialBlocks(detailsResponse.data);
      const wf = detailsResponse.data.workflowInsights;

      setFormBlocks(blocks);
      setInitialSnapshot(serializeMaterialBlocks(blocks));
      setActiveBatch((prev) =>
        prev
          ? {
              ...prev,
              formId: detailsResponse.data.formId ?? prev.formId,
              lotId: id,
              batchId: id,
              rmStatus: normalizeRawMaterialLotListStatus(wf?.currentStatus || prev.rmStatus),
              rejectionReason: wf?.rejectionReason ?? null,
            }
          : prev
      );
      return true;
    } finally {
      setLoadingFormDetails(false);
    }
  };

  const handleCreateLot = () => {
    setFormEntryMode("create");
    setActiveBatch(createEmptyFormBatch());
    setFormBlocks([]);
    setInitialSnapshot("[]");
    setIsEditMode(false);
    setView("form");
  };

  const openLotFromList = async (row: RawMaterialLotListRow, mode: FormEntryMode) => {
    if (!subDepartmentId) {
      showAlert(STRINGS.SOURCING.SPECIFICATION_FORM.SUB_DEPARTMENT_MISSING, "error");
      return;
    }

    setLoadingFormDetails(true);
    const detailsResponse = await rawMaterialProcurementController.fetchLotDetails({ lotId: row.lotId });
    setLoadingFormDetails(false);

    let blocks: MaterialBlock[] = [];

    if (detailsResponse?.success && detailsResponse.data) {
      blocks = RawMaterialLotDetailsModel.toMaterialBlocks(detailsResponse.data);
      const wf = detailsResponse.data.workflowInsights;
      const batch = lotListRowToFormBatch(row, blocks);
      batch.rejectionReason = wf?.rejectionReason ?? null;
      batch.rmStatus = normalizeRawMaterialLotListStatus(wf?.currentStatus || row.rmStatus);
      setActiveBatch(batch);
    } else if (detailsResponse?.statusCode === 404) {
      blocks = [
        {
          material: row.materialCode,
          lotNo: row.lotId,
          supplyOrderNo: row.supplyOrderNo,
          receiptDate: row.receiptDate,
          manufacturerName: row.manufacturerName,
          certificates: [],
          rows: [],
        },
      ];
      setActiveBatch({
        ...lotListRowToFormBatch(row, blocks),
        rejectionReason: null,
      });
    } else {
      const fallback =
        detailsResponse?.statusCode === 404
          ? STRINGS.SOURCING.SPECIFICATION_FORM.DETAILS_NOT_FOUND
          : STRINGS.SOURCING.SPECIFICATION_FORM.DETAILS_FETCH_ERROR;
      showAlert(getErrorMessage(detailsResponse, fallback), "error");
      return;
    }

    setFormBlocks(blocks);
    setInitialSnapshot(serializeMaterialBlocks(blocks));
    setFormEntryMode(mode);
    setIsEditMode(mode === "edit");
    setView("form");
  };

  const handleFillForm = async (row: RawMaterialLotListRow) => {
    await openLotFromList(row, "fill");
  };

  const handleEditLot = async (row: RawMaterialLotListRow) => {
    await openLotFromList(row, "edit");
  };

  const handleViewLotDetails = async (row: RawMaterialLotListRow) => {
    const lotId = String(row?.lotId ?? "").trim();
    if (!lotId) {
      showAlert(STRINGS.SOURCING.SPECIFICATION_FORM.BATCH_ID_MISSING, "error");
      return;
    }

    setDetailsRow({
      lotId,
      procurementId: row.procurementId,
      materialCode: row.materialCode,
      materialName: row.materialName,
      supplyOrderNo: row.supplyOrderNo,
      receiptDate: row.receiptDate,
      manufacturerName: row.manufacturerName,
      rmStatus: row.rmStatus,
      createdBy: row.createdBy,
      createdOn: row.createdOn,
      rejectionReason: null,
    });
    setDetailsBlocks([]);
    setView("details");
    setLoadingDetails(true);

    try {
      const detailsResponse = await rawMaterialProcurementController.fetchLotDetails({ lotId });

      if (!detailsResponse?.success || !detailsResponse.data) {
        const fallback =
          detailsResponse?.statusCode === 404
            ? STRINGS.SOURCING.SPECIFICATION_FORM.DETAILS_NOT_FOUND
            : STRINGS.SOURCING.SPECIFICATION_FORM.DETAILS_FETCH_ERROR;
        showAlert(getErrorMessage(detailsResponse, fallback), "error");
        resetFormContext();
        return;
      }

      const model = detailsResponse.data;
      const wf = model.workflowInsights;
      const blocks = RawMaterialLotDetailsModel.toMaterialBlocks(model);

      setDetailsBlocks(blocks);
      setDetailsRow({
        lotId: model.lotId || lotId,
        procurementId: row.procurementId,
        materialCode: model.materialCode || row.materialCode,
        materialName: row.materialName,
        supplyOrderNo: model.supplyOrderNo || row.supplyOrderNo,
        receiptDate: model.receiptDate || row.receiptDate,
        manufacturerName: model.manufacturerName || row.manufacturerName,
        rmStatus: normalizeRawMaterialLotListStatus(wf?.currentStatus || row.rmStatus),
        createdBy: row.createdBy,
        createdOn: row.createdOn,
        rejectionReason: wf?.rejectionReason ?? null,
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

  const handleBlocksChange = useCallback((blocks: MaterialBlock[]) => {
    rmCertDebug("6.parent.handleBlocksChange", {
      formEntryMode,
      blockCount: (blocks ?? []).length,
      blocks: summarizeBlocks(blocks ?? []),
    });
    startTransition(() => {
      setFormBlocks(blocks ?? []);
      rmCertDebug("6.parent.setFormBlocks.done", {
        blockCount: (blocks ?? []).length,
      });
    });
  }, [formEntryMode]);

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

  const submitForm = async (blocks: MaterialBlock[], intent: "draft" | "submit") => {
    if (!activeBatch) {
      return false;
    }

    if (!subDepartmentId) {
      showAlert(STRINGS.SOURCING.SPECIFICATION_FORM.SUB_DEPARTMENT_MISSING, "error");
      return false;
    }

    const hasAnyDraftData = (blocks ?? []).some((block) => {
      if ((block?.lotNo ?? "").trim().length > 0) return true;
      if ((block?.supplyOrderNo ?? "").trim().length > 0) return true;
      if ((block?.manufacturerName ?? "").trim().length > 0) return true;
      if (
        (block?.certificates ?? []).some(
          (c) => String(c.fileName ?? "").trim().length > 0 || Boolean(c.file)
        )
      ) {
        return true;
      }
      return (block?.rows ?? []).some((row) => {
        const analysedResult = String(row?.analysedResult ?? "").trim();
        const remarks = String(row?.remarks ?? "").trim();
        return analysedResult.length > 0 || remarks.length > 0;
      });
    });

    if (formEntryMode === "create") {
      rmCertDebug("8.submitForm.create.start", {
        intent,
        incomingBlocks: summarizeBlocks(blocks ?? []),
      });
      const mapped = mapBlocksToCreateMaterials(blocks);
      const materials = mapped
        .map((mat) => ({
          ...mat,
          lots: mat.lots
            .map((lot, lotIdx) => {
              const trimmed = lot.lotId.trim();
              const hasSpecs = lot.specifications.length > 0;
              const hasCerts = (lot.certificates ?? []).length > 0;
              const lotId =
                trimmed ||
                (intent === "draft" && (hasSpecs || hasCerts)
                  ? `DRAFT-${mat.materialCode}-${lotIdx + 1}`
                  : "");
              return { ...lot, lotId };
            })
            .filter((lot) => {
              if (!lot.lotId) return false;
              const hasSpecs = lot.specifications.length > 0;
              const hasCerts = (lot.certificates ?? []).length > 0;
              return hasSpecs || (intent === "draft" && hasCerts);
            }),
        }))
        .filter((mat) => mat.materialCode && mat.lots.length > 0);

      rmCertDebug("8.submitForm.create.mapped", {
        intent,
        hasAnyDraftData,
        materialCount: materials.length,
        materials: materials.map((m) => ({
          materialCode: m.materialCode,
          lots: m.lots.map((l) => ({
            lotId: l.lotId,
            certCount: (l.certificates ?? []).length,
            certificates: (l.certificates ?? []).map((c) => ({
              fileName: c.fileName,
              fileUrl: String(c.fileUrl ?? "").slice(0, 56),
            })),
          })),
        })),
      });

      if ((intent === "draft" && !hasAnyDraftData) || !materials.length) {
        rmCertDebug("8.submitForm.create.aborted", {
          reason: !hasAnyDraftData ? "no draft data" : "no materials",
        });
        showAlert(STRINGS.SOURCING.SPECIFICATION_FORM.EMPTY_FORM_ERROR, "warning");
        return false;
      }

      setActionLoading(true);
      try {
        const response = await rawMaterialProcurementController.createForm({
          subDepartmentId,
          submissionType: intent === "draft" ? "DRAFT" : "SUBMIT",
          materials,
        });

        if (!response?.success) {
          showAlert(getErrorMessage(response, STRINGS.SOURCING.SPECIFICATION_FORM.CREATE_FAILED), "error");
          return false;
        }

        setInitialSnapshot(serializeMaterialBlocks(blocks));
        setFormBlocks(blocks);
        setActiveBatch((prev) =>
          prev
            ? {
                ...prev,
                procurementId: response.data?.procurementId ?? prev.procurementId,
                batchId: response.data?.procurementId || prev.batchId,
                rmStatus: normalizeRawMaterialLotListStatus(response.data?.status || prev.rmStatus),
              }
            : prev
        );

        if (intent === "draft") {
          returnToListWithSuccess(STRINGS.SOURCING.SPECIFICATION_FORM.CREATE_DRAFT_SUCCESS);
        } else {
          returnToListWithSuccess(STRINGS.SOURCING.SPECIFICATION_FORM.CREATE_SUBMIT_SUCCESS);
        }
        return true;
      } finally {
        setActionLoading(false);
      }
    }

    const lotId = (activeBatch.lotId ?? blocks[0]?.lotNo ?? "").trim();
    if (!lotId) {
      showAlert(STRINGS.SOURCING.SPECIFICATION_FORM.BATCH_ID_MISSING, "error");
      return false;
    }

    const head = blocks[0];
    if (!head) {
      showAlert(STRINGS.SOURCING.SPECIFICATION_FORM.EMPTY_FORM_ERROR, "warning");
      return false;
    }

    if (intent === "submit") {
      const hasSpec = head.rows.some(
        (r) => (r.specificationCode ?? "").trim() && String(r.analysedResult ?? "").trim()
      );
      if (!hasSpec) {
        showAlert(STRINGS.SOURCING.SPECIFICATION_FORM.SUBMIT_DISABLED_TOOLTIP, "warning");
        return false;
      }
    }

    setActionLoading(true);
    try {
      const submissionType: "DRAFT" | "UPDATE" =
        intent === "draft" ? "DRAFT" : activeBatch.rmStatus === SOURCING_STATUS.REJECTED ? "UPDATE" : "UPDATE";

      const updatePayload = mapFirstBlockToLotUpdatePayload(head, lotId, subDepartmentId, submissionType);

      const response = await rawMaterialProcurementController.updateForm(updatePayload);

      if (!response?.success) {
        showAlert(getErrorMessage(response, STRINGS.SOURCING.SPECIFICATION_FORM.UPDATE_FAILED), "error");
        return false;
      }

      const successMessage =
        response.message ||
        (intent === "draft"
          ? STRINGS.SOURCING.SPECIFICATION_FORM.UPDATE_DRAFT_SUCCESS
          : STRINGS.SOURCING.SPECIFICATION_FORM.UPDATE_SUBMIT_SUCCESS);

      if (intent === "draft") {
        const resolvedLotId = String(response.data?.batchId ?? lotId).trim();
        setActiveBatch((prev) =>
          prev
            ? {
                ...prev,
                formId: response.data?.formId ?? prev.formId,
                lotId: resolvedLotId,
                batchId: resolvedLotId,
                rmStatus: normalizeRawMaterialLotListStatus(response.data?.status || prev.rmStatus),
              }
            : prev
        );
        const reloaded = await reloadLotFormDetails(resolvedLotId);
        if (reloaded) stayOnFormWithDraftSuccess(successMessage);
        return reloaded;
      }

      returnToListWithSuccess(successMessage);
      return true;
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveDraft = async (blocks: MaterialBlock[]) => {
    return await submitForm(blocks, "draft");
  };

  const handleSubmit = async (blocks: MaterialBlock[]) => {
    return await submitForm(blocks, "submit");
  };

  const closeDeleteLotConfirm = useCallback(() => {
    if (deleteLoading) return;
    setDeleteConfirmOpen(false);
    setDeleteTargetLotId(null);
  }, [deleteLoading]);

  const openDeleteLotConfirm = useCallback((lotId: string) => {
    setDeleteTargetLotId(lotId);
    setDeleteConfirmOpen(true);
  }, []);

  const handleDeleteLotFromList = useCallback(
    (row: RawMaterialLotListRow) => {
      if (!canDeleteRawMaterialLot(row.rmStatus)) {
        showAlert(STRINGS.SOURCING.SPECIFICATION_FORM.DELETE_NOT_ALLOWED, "warning");
        return;
      }
      openDeleteLotConfirm(row.lotId);
    },
    [openDeleteLotConfirm, showAlert]
  );

  const handleDeleteLotFromForm = useCallback(() => {
    const lotId = (activeBatch?.lotId ?? "").trim();
    if (!lotId || !canDeleteRawMaterialLot(activeBatch?.rmStatus)) {
      showAlert(STRINGS.SOURCING.SPECIFICATION_FORM.DELETE_NOT_ALLOWED, "warning");
      return;
    }
    openDeleteLotConfirm(lotId);
  }, [activeBatch, openDeleteLotConfirm, showAlert]);

  const handleConfirmDeleteLot = useCallback(async () => {
    const lotId = deleteTargetLotId?.trim();
    if (!lotId || deleteLoading) return;

    setDeleteLoading(true);
    try {
      const response = await rawMaterialProcurementController.deleteLot({ lotId });

      if (!response?.success) {
        showAlert(
          getErrorMessage(response, STRINGS.SOURCING.SPECIFICATION_FORM.DELETE_FAILED),
          "error"
        );
        return;
      }

      setDeleteConfirmOpen(false);
      setDeleteTargetLotId(null);

      const wasOnForm = view === "form";
      if (wasOnForm) resetFormContext();

      showAlert(
        response.message || STRINGS.SOURCING.SPECIFICATION_FORM.DELETE_SUCCESS,
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
  }, [deleteTargetLotId, listParams, showAlert, view]);

  const canDeleteActiveLot =
    formEntryMode !== "create" && canDeleteRawMaterialLot(activeBatch?.rmStatus);

  return {
    view,
    formEntryMode,
    activeBatch,
    isEditMode,
    formBlocks,
    detailsRow,
    detailsBlocks,
    loadingDetails,
    isFormDirty,
    loadingFormDetails,
    actionLoading,
    backConfirmOpen,
    deleteConfirmOpen,
    deleteLoading,
    canDeleteActiveLot,
    closeDeleteLotConfirm,
    handleConfirmDeleteLot,
    handleDeleteLotFromList,
    handleDeleteLotFromForm,
    handleCreateLot,
    handleEditLot,
    ...listParams,
    handleFillForm,
    handleViewLotDetails,
    handleBackFromDetails,
    handleBack,
    handleBlocksChange,
    handleDiscardAndBack,
    setBackConfirmOpen,
    handleSaveDraft,
    handleSubmit,
  };
};

export default useRawMaterialProcurementHook;
