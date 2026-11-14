import { startTransition, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { STRINGS } from "@app/config/strings";
import { useAlertStore } from "@app/store/alertStore";
import { useUserBatchRefreshStore } from "@app/store/userBatchRefreshStore";
import { useFileService } from "@hooks/useFileService";
import rawMaterialSourcingController from "@controllers/user/sourcing/rms/rawMaterialSourcingController";
import {
  canDeleteRawMaterialLot,
  createEmptyFormBatch,
  hasIncompleteCertificateUploads,
  hasRawMaterialCreateDirtyData,
  lotListRowToFormBatch,
  mapBlocksToCreateMaterials,
  mapFirstBlockToLotUpdatePayload,
  MaterialBlock,
  normalizeRawMaterialLotListStatus,
  RawMaterialFormBatch,
  RawMaterialLotDetailsModel,
  RawMaterialLotListRow,
  serializeMaterialBlocks,
  serializeMaterialBlocksForDirtyCheck,
  SOURCING_STATUS,
} from "@data/models/user/sourcing/rms/RawMaterialSourcingModel";
import { discardWorkflowForm } from "@utils/workflowDiscard";
import { extractTempFileIdsFromMaterialBlocks } from "@utils/workflowTempFiles";
import {
  hasRawMaterialDraftData,
  validateRawMaterialSourcing,
} from "@data/validation/adapters/sourcing/rms/rawMaterialSourcing.validation";
import { hasValidationErrors } from "@data/validation/validationErrors";
import type { ValidationErrors, ValidationTier } from "@data/validation/submissionIntent";
import { getRawMaterialSourcingErrorMessage as getErrorMessage } from "@hooks/user/sourcing/rms/rawMaterialSourcingErrors";
import { resolveLotDetailsFetchErrorFallback } from "@hooks/user/sourcing/rms/rawMaterialSourcingDetailsHelpers";

export type RawMaterialSourcingFormEntryMode = "create" | "fill" | "edit";

const SUCCESS_ALERT_MS = 2200;

type UseRawMaterialSourcingFormArgs = {
  isOpen: boolean;
  subDepartmentId: number | undefined;
  onOpen: () => void;
  /** Leave the form and return to the list (resets every view). */
  onExit: () => void;
  refreshList: () => Promise<unknown>;
};

export const useRawMaterialSourcingForm = ({
  isOpen,
  subDepartmentId,
  onOpen,
  onExit,
  refreshList,
}: UseRawMaterialSourcingFormArgs) => {
  const [formEntryMode, setFormEntryMode] = useState<RawMaterialSourcingFormEntryMode>("create");
  const [activeBatch, setActiveBatch] = useState<RawMaterialFormBatch | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formBlocks, setFormBlocks] = useState<MaterialBlock[]>([]);
  /** Full snapshot for discard temp-file cleanup. */
  const [initialSnapshot, setInitialSnapshot] = useState("[]");
  /** Field-level dirty baseline from lot-details (edit/fill). */
  const [dirtyBaseline, setDirtyBaseline] = useState("[]");
  const [loadingFormDetails, setLoadingFormDetails] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [backConfirmOpen, setBackConfirmOpen] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  const showAlert = useAlertStore((state) => state.showAlert);
  const bumpBatchRefresh = useUserBatchRefreshStore((state) => state.bumpVersion);
  const { deleteTemp } = useFileService();

  const formBlocksRef = useRef(formBlocks);
  formBlocksRef.current = formBlocks;
  const initialSnapshotRef = useRef(initialSnapshot);
  initialSnapshotRef.current = initialSnapshot;
  /** After lot-details load, absorb one form hydrate reshape into the dirty baseline. */
  const pendingDirtyBaselineSyncRef = useRef(false);
  const dirtyBaselineSettleUntilRef = useRef(0);

  const parseBaselineBlocks = useCallback((): MaterialBlock[] => {
    try {
      const parsed = JSON.parse(initialSnapshotRef.current);
      return Array.isArray(parsed) ? (parsed as MaterialBlock[]) : [];
    } catch {
      return [];
    }
  }, []);

  const captureLotDetailsBaseline = useCallback((blocks: MaterialBlock[]) => {
    setInitialSnapshot(serializeMaterialBlocks(blocks));
    setDirtyBaseline(serializeMaterialBlocksForDirtyCheck(blocks));
    pendingDirtyBaselineSyncRef.current = true;
    // Allow one short window for form hydrate reshape; ignore later user edits.
    dirtyBaselineSettleUntilRef.current = Date.now() + 750;
  }, []);

  // Lot-details → form can reshape certificates/rows; adopt that once as baseline.
  useEffect(() => {
    if (!pendingDirtyBaselineSyncRef.current) return;
    if (!isOpen || formEntryMode === "create") return;
    if (loadingFormDetails || formBlocks.length === 0) return;
    if (Date.now() > dirtyBaselineSettleUntilRef.current) {
      pendingDirtyBaselineSyncRef.current = false;
      return;
    }

    const current = serializeMaterialBlocksForDirtyCheck(formBlocks);
    if (current !== dirtyBaseline) {
      setDirtyBaseline(current);
    }
    pendingDirtyBaselineSyncRef.current = false;
  }, [dirtyBaseline, formBlocks, formEntryMode, isOpen, loadingFormDetails]);

  const isFormDirty = useMemo(() => {
    if (!isOpen) return false;
    if (loadingFormDetails) return false;
    // New lot: alert only after the user entered real values (not empty templates / ACEM default).
    if (formEntryMode === "create") {
      return hasRawMaterialCreateDirtyData(formBlocks);
    }
    // Fill/edit: wait until lot-details hydrated into the form.
    if (formBlocks.length === 0) return false;
    // Still settling hydrate — don't prompt discard yet.
    if (pendingDirtyBaselineSyncRef.current) return false;
    // Compare user fields only against lot-details baseline.
    return serializeMaterialBlocksForDirtyCheck(formBlocks) !== dirtyBaseline;
  }, [dirtyBaseline, formBlocks, formEntryMode, isOpen, loadingFormDetails]);

  const resetForm = useCallback(() => {
    setActiveBatch(null);
    setIsEditMode(false);
    setFormEntryMode("create");
    setFormBlocks([]);
    setInitialSnapshot("[]");
    setDirtyBaseline("[]");
    pendingDirtyBaselineSyncRef.current = false;
    dirtyBaselineSettleUntilRef.current = 0;
    setLoadingFormDetails(false);
    setActionLoading(false);
    setBackConfirmOpen(false);
    setValidationErrors({});
  }, []);

  const returnToListWithSuccess = (message: string) => {
    showAlert(message, "success", {
      autoCloseMs: SUCCESS_ALERT_MS,
      onCloseAction: () => {
        void refreshList().then(() => onExit());
      },
    });
  };

  const stayOnFormWithDraftSuccess = (message: string) => {
    showAlert(message, "success", { autoCloseMs: SUCCESS_ALERT_MS });
    bumpBatchRefresh();
    void refreshList();
  };

  const reloadLotFormDetails = async (lotId: string): Promise<boolean> => {
    const id = String(lotId ?? "").trim();
    if (!id) {
      showAlert(STRINGS.SOURCING.SPECIFICATION_FORM.BATCH_ID_MISSING, "error");
      return false;
    }

    setLoadingFormDetails(true);
    try {
      const detailsResponse = await rawMaterialSourcingController.fetchLotDetails({ lotId: id });
      if (!detailsResponse?.success || !detailsResponse.data) {
        const fallback = resolveLotDetailsFetchErrorFallback(detailsResponse?.statusCode);
        showAlert(getErrorMessage(detailsResponse, fallback), "error");
        return false;
      }

      const blocks = RawMaterialLotDetailsModel.toMaterialBlocks(detailsResponse.data);
      const wf = detailsResponse.data.workflowInsights;

      setFormBlocks(blocks);
      captureLotDetailsBaseline(blocks);
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
          : prev,
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
    setDirtyBaseline("[]");
    pendingDirtyBaselineSyncRef.current = false;
    dirtyBaselineSettleUntilRef.current = 0;
    setIsEditMode(false);
    onOpen();
  };

  const openLotFromList = async (
    row: RawMaterialLotListRow,
    mode: RawMaterialSourcingFormEntryMode,
  ) => {
    if (!subDepartmentId) {
      showAlert(STRINGS.SOURCING.SPECIFICATION_FORM.SUB_DEPARTMENT_MISSING, "error");
      return;
    }

    setLoadingFormDetails(true);
    const detailsResponse = await rawMaterialSourcingController.fetchLotDetails({
      lotId: row.lotId,
    });

    setLoadingFormDetails(false);

    let blocks: MaterialBlock[] = [];

    if (detailsResponse?.success && detailsResponse.data) {
      blocks = RawMaterialLotDetailsModel.toMaterialBlocks(detailsResponse.data);
      const wf = detailsResponse.data.workflowInsights;
      const batch = lotListRowToFormBatch(row, blocks);
      batch.rejectionReason = detailsResponse.data?.rejectionReason ?? null;
      batch.rmStatus = normalizeRawMaterialLotListStatus(wf?.currentStatus || row.rmStatus);
      setActiveBatch(batch);
    } else if (detailsResponse?.statusCode === 404) {
      blocks = [
        {
          material: row.materialCode,
          ...(row.grade?.gradeCode ? { gradeCode: row.grade.gradeCode } : {}),
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
      const fallback = resolveLotDetailsFetchErrorFallback(detailsResponse?.statusCode);
      showAlert(getErrorMessage(detailsResponse, fallback), "error");
      return;
    }

    setFormBlocks(blocks);
    captureLotDetailsBaseline(blocks);
    setFormEntryMode(mode);
    setIsEditMode(mode === "edit");
    onOpen();
  };

  const handleFillForm = async (row: RawMaterialLotListRow) => {
    await openLotFromList(row, "fill");
  };

  const handleEditLot = async (row: RawMaterialLotListRow) => {
    await openLotFromList(row, "edit");
  };

  const handleBlocksChange = useCallback((blocks: MaterialBlock[]) => {
    startTransition(() => {
      setFormBlocks(blocks ?? []);
    });
  }, []);

  const handleBack = () => {
    if (isOpen && isFormDirty) {
      setBackConfirmOpen(true);
      return;
    }
    bumpBatchRefresh();
    onExit();
  };

  const handleDiscardAndBack = useCallback(async () => {
    setBackConfirmOpen(false);
    await discardWorkflowForm({
      subDepartmentId,
      baselineState: parseBaselineBlocks(),
      currentState: formBlocksRef.current,
      extractTempFileIds: extractTempFileIdsFromMaterialBlocks,
      deleteTemp,
      resetForm: () => {
        bumpBatchRefresh();
        onExit();
      },
    });
  }, [bumpBatchRefresh, deleteTemp, onExit, parseBaselineBlocks, subDepartmentId]);

  const validateBlocks = useCallback((blocks: MaterialBlock[], tier: ValidationTier) => {
    const errors = validateRawMaterialSourcing(blocks, tier);
    setValidationErrors(errors);
    return errors;
  }, []);

  const submitForm = async (blocks: MaterialBlock[], intent: "draft" | "submit") => {
    if (!activeBatch) {
      return false;
    }

    if (!subDepartmentId) {
      showAlert(STRINGS.SOURCING.SPECIFICATION_FORM.SUB_DEPARTMENT_MISSING, "error");
      return false;
    }

    if (hasIncompleteCertificateUploads(blocks)) {
      showAlert(STRINGS.SOURCING.SPECIFICATION_FORM.CERT_UPLOAD_PENDING, "warning");
      return false;
    }

    const errors = validateBlocks(blocks, intent === "submit" ? "SUBMIT" : "UNIT");
    if (hasValidationErrors(errors)) {
      return false;
    }

    const hasAnyDraftData = hasRawMaterialDraftData(blocks);

    if (formEntryMode === "create") {
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

      if ((intent === "draft" && !hasAnyDraftData) || !materials.length) {
        showAlert(STRINGS.SOURCING.SPECIFICATION_FORM.EMPTY_FORM_ERROR, "warning");
        return false;
      }

      setActionLoading(true);
      try {
        const response = await rawMaterialSourcingController.createForm({
          subDepartmentId,
          submissionType: intent === "draft" ? "DRAFT" : "SUBMIT",
          materials,
        });

        if (!response?.success) {
          showAlert(
            getErrorMessage(response, STRINGS.SOURCING.SPECIFICATION_FORM.CREATE_FAILED),
            "error",
          );
          return false;
        }

        setFormBlocks(blocks);
        setInitialSnapshot(serializeMaterialBlocks(blocks));
        setDirtyBaseline(serializeMaterialBlocksForDirtyCheck(blocks));
        pendingDirtyBaselineSyncRef.current = false;
        const createdLotId = String(
          response.data?.lotId || response.data?.batchId || blocks[0]?.lotNo || "",
        ).trim();
        const createdFormId = String(
          response.data?.formId || response.data?.sourcingId || "",
        ).trim();
        setActiveBatch((prev) =>
          prev
            ? {
                ...prev,
                formId: createdFormId || prev.formId,
                lotId: createdLotId || prev.lotId,
                sourcingId: createdFormId || prev.sourcingId,
                batchId: createdLotId || createdFormId || prev.batchId,
                rmStatus: normalizeRawMaterialLotListStatus(response.data?.status || prev.rmStatus),
              }
            : prev,
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
        (r) => (r.specificationCode ?? "").trim() && String(r.analysedResult ?? "").trim(),
      );
      if (!hasSpec) {
        showAlert(STRINGS.SOURCING.SPECIFICATION_FORM.SUBMIT_DISABLED_TOOLTIP, "warning");
        return false;
      }
    }

    setActionLoading(true);
    try {
      const submissionType: "DRAFT" | "UPDATE" =
        intent === "draft"
          ? "DRAFT"
          : activeBatch.rmStatus === SOURCING_STATUS.REJECTED
            ? "UPDATE"
            : "UPDATE";

      const updatePayload = mapFirstBlockToLotUpdatePayload(
        head,
        lotId,
        subDepartmentId,
        submissionType,
      );

      const response = await rawMaterialSourcingController.updateForm(updatePayload);

      if (!response?.success) {
        showAlert(
          getErrorMessage(response, STRINGS.SOURCING.SPECIFICATION_FORM.UPDATE_FAILED),
          "error",
        );
        return false;
      }

      const successMessage =
        response.message ||
        (intent === "draft"
          ? STRINGS.SOURCING.SPECIFICATION_FORM.UPDATE_DRAFT_SUCCESS
          : STRINGS.SOURCING.SPECIFICATION_FORM.UPDATE_SUBMIT_SUCCESS);

      if (intent === "draft") {
        const resolvedLotId = String(
          response.data?.lotId || response.data?.batchId || lotId || "",
        ).trim();
        setActiveBatch((prev) =>
          prev
            ? {
                ...prev,
                formId: response.data?.formId || response.data?.sourcingId || prev.formId,
                lotId: resolvedLotId || prev.lotId,
                sourcingId: response.data?.formId || response.data?.sourcingId || prev.sourcingId,
                batchId: resolvedLotId || prev.batchId,
                rmStatus: normalizeRawMaterialLotListStatus(response.data?.status || prev.rmStatus),
              }
            : prev,
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

  const canDeleteActiveLot =
    formEntryMode !== "create" && canDeleteRawMaterialLot(activeBatch?.rmStatus);

  return {
    formEntryMode,
    activeBatch,
    isEditMode,
    formBlocks,
    isFormDirty,
    loadingFormDetails,
    actionLoading,
    backConfirmOpen,
    setBackConfirmOpen,
    canDeleteActiveLot,
    handleCreateLot,
    handleFillForm,
    handleEditLot,
    handleBack,
    handleBlocksChange,
    handleDiscardAndBack,
    handleSaveDraft,
    handleSubmit,
    validationErrors,
    validateBlocks,
    resetForm,
  };
};

export default useRawMaterialSourcingForm;
