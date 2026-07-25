import { useCallback, useMemo, useState } from "react";
import { STRINGS } from "../../../app/config/strings";
import { useAlertStore } from "../../../app/store/alertStore";
import { useAuthStore } from "../../../app/store/authStore";
import { useUserBatchRefreshStore } from "../../../app/store/userBatchRefreshStore";
import { batchManagementController } from "../../../controllers/admin/BatchManagement/batchManagementController";
import { mixingController } from "../../../controllers/user/manufacturing/mixingController";
import type { IdentificationSheet } from "../../../data/models/admin/BatchManagement/BatchManagementModel";
import {
  buildMixCardId,
  buildMixingApproverCards,
  createDefaultMixingFormState,
  createEmptyFinalMixEntry,
  createEmptyPremixEntry,
  hasMixCardValue,
  isMixCardEditable,
  mapMixingDetailsForDisplay,
  mapMixingDetailsToFormState,
  mapMixingFormStateToPayload,
  mergeProcessParticularsWithOperations,
  resolveApiMixingCycleDisplayValue,
  resolveMixingCycleOperations,
  type MixCardStageType,
  type MixCardStatusMeta,
  type MixCardSubmissionStatus,
  type MixingFormState,
} from "../../../data/models/user/MixingFormModel";
import { MANUFACTURING_STATUS } from "./manufacturingWorkflowData";
import { useSubdepartmentBatches } from "../useSubdepartmentBatches";

type WorkflowView = "list" | "form" | "details";

type MixingBatch = {
  batchId: string;
  mxStatus?: string;
  formId?: string | null;
  [key: string]: any;
};

const MX_STATUS = MANUFACTURING_STATUS;
const parseStatus = (status: string | undefined) => String(status ?? "").toLowerCase();

const buildMixCardStatusMapFromForm = (
  form: MixingFormState,
): Record<string, MixCardStatusMeta> => {
  const next: Record<string, MixCardStatusMeta> = {};
  buildMixingApproverCards({
    premixCards: form.premixCards,
    finalMixCards: form.finalMixCards,
  }).forEach((card) => {
    next[card.mixCardId] = {
      mixCardSubmissionStatus: card.mixCardSubmissionStatus ?? "TO_BE_INITIATED",
      mixCardSubmissionType: null,
      rejectionReason: card.rejectionReason ?? null,
      remarks: card.remarks ?? null,
    };
  });
  return next;
};

const buildMixCardStatusMapFromDetails = (
  data: Record<string, unknown>,
): Record<string, MixCardStatusMeta> => {
  const detailView = mapMixingDetailsForDisplay(data);
  const next: Record<string, MixCardStatusMeta> = {};
  buildMixingApproverCards(detailView).forEach((card) => {
    next[card.mixCardId] = {
      mixCardSubmissionStatus: card.mixCardSubmissionStatus,
      mixCardSubmissionType: null,
      rejectionReason: card.rejectionReason ?? null,
      remarks: card.remarks ?? null,
    };
  });
  return next;
};

export const useMixingHook = () => {
  const listParams = useSubdepartmentBatches("mixing");
  const user = useAuthStore((s) => s.user);
  const showAlert = useAlertStore((state) => state.showAlert);
  const bumpBatchRefresh = useUserBatchRefreshStore((state) => state.bumpVersion);

  const subDepartmentId = useMemo(
    () => user?.allSubDepartments.find((sd) => sd.slugs?.subDept === "mixing")?.subDepartmentId,
    [user],
  );

  const [view, setView] = useState<WorkflowView>("list");
  const [activeBatch, setActiveBatch] = useState<MixingBatch | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [loadingFormDetails, setLoadingFormDetails] = useState(false);
  const [detailsRow, setDetailsRow] = useState<any>(null);
  const [detailsData, setDetailsData] = useState<any>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [backConfirmOpen, setBackConfirmOpen] = useState(false);
  const [hasSavedDraft, setHasSavedDraft] = useState(false);
  const resolvePremixCount = (batch?: MixingBatch | null) =>
    Number(batch?.numberOfPremix ?? batch?.identificationSheet?.numberOfPremix ?? 1) || 1;
  const resolveMotorStage = (batch?: MixingBatch | null) => Number(batch?.motorStage);
  const loadBatchIdentificationSheet = useCallback(async (batchId: string) => {
    const details = await batchManagementController.getBatchById(batchId);
    const identificationSheet = (details?.identificationSheet ??
      null) as IdentificationSheet | null;
    const numberOfPremix = Number(identificationSheet?.numberOfPremix) || 1;
    const mixingCycle = (details as { mixingCycle?: unknown } | null | undefined)?.mixingCycle;

    return { identificationSheet, numberOfPremix, mixingCycle };
  }, []);

  const [formData, setFormData] = useState<MixingFormState>(() => createDefaultMixingFormState());
  const [initialSnapshot, setInitialSnapshot] = useState("{}");
  const [mixCardStatusById, setMixCardStatusById] = useState<Record<string, MixCardStatusMeta>>(
    {},
  );

  const formSnapshot = useMemo(() => JSON.stringify(formData), [formData]);
  const isFormDirty = useMemo(
    () => view === "form" && formSnapshot !== initialSnapshot,
    [view, formSnapshot, initialSnapshot],
  );

  const resetFormContext = useCallback(() => {
    const defaults = createDefaultMixingFormState();
    setView("list");
    setActiveBatch(null);
    setIsEditMode(false);
    setLoadingFormDetails(false);
    setActionLoading(false);
    setBackConfirmOpen(false);
    setHasSavedDraft(false);
    setFormData(defaults);
    setInitialSnapshot(JSON.stringify(defaults));
    setMixCardStatusById({});
  }, []);

  const getErrorMessage = (response: any, fallbackMessage: string) => {
    if (response?.error?.details) return response.error.details;
    if (response?.message) return response.message;
    return fallbackMessage;
  };

  const openFormWithResolvedData = useCallback(
    async (batch: MixingBatch, editMode: boolean) => {
      if (!batch.batchId) {
        showAlert(STRINGS.MANUFACTURING.MIXING.BATCH_ID_MISSING, "error");
        return;
      }

      // Always hydrate from saved form details whenever a formId exists (draft, rejected,
      // waiting for approval, etc.). New batches without formId use identification defaults.
      const shouldFetchDetails = Boolean(String(batch.formId ?? "").trim());

      setLoadingFormDetails(true);

      try {
        const { identificationSheet, numberOfPremix, mixingCycle } =
          await loadBatchIdentificationSheet(batch.batchId);

        let nextBatch: MixingBatch = {
          ...batch,
          identificationSheet,
          numberOfPremix,
          mixingCycle,
        };

        const buildPrefilledFormData = () => {
          const premixCards = Array.from(
            { length: Math.max(1, Number(numberOfPremix) || 1) },
            (_, index) => ({
              ...createEmptyPremixEntry(index + 1),
              mixerType: String(identificationSheet?.mixerType ?? ""),
              bldgNo: String(
                (identificationSheet as any)?.bldgNo ?? (identificationSheet as any)?.BldgNo ?? "",
              ),
              premixDate: String(identificationSheet?.date ?? ""),
              premixQuantity: String(identificationSheet?.batchSize ?? ""),
              mixingCycle: resolveApiMixingCycleDisplayValue(mixingCycle) || "",
              mixingCycleCode: String(
                (mixingCycle as any)?.mixingCycleCode ??
                  (mixingCycle as any)?.mixingCycleCode ??
                  "",
              ),
            }),
          );

          const finalMixCards = Array.from(
            { length: Math.max(1, Number(numberOfPremix) || 1) },
            (_, index) => ({
              ...createEmptyFinalMixEntry(index + 1),
              linkedPremixNo: String(index + 1),
              mixerType: String(identificationSheet?.mixerType ?? ""),
              bldgNo: String(
                (identificationSheet as any)?.bldgNo ?? (identificationSheet as any)?.BldgNo ?? "",
              ),
              mixingCycle: resolveApiMixingCycleDisplayValue(mixingCycle) || "",
              mixingCycleCode: String(
                (mixingCycle as any)?.mixingCycleCode ?? (mixingCycle as any)?.id ?? "",
              ),
              mixingCycleName: String((mixingCycle as any)?.mixingCycleName ?? ""),
            }),
          );

          return { premixCards, finalMixCards } as MixingFormState;
        };

        let nextFormData = buildPrefilledFormData();
        let detailsPayload: Record<string, unknown> | null = null;

        if (shouldFetchDetails) {
          if (!subDepartmentId) {
            showAlert(STRINGS.MANUFACTURING.MIXING.SUB_DEPARTMENT_MISSING, "error");
            return;
          }
          if (!batch.formId) {
            showAlert(STRINGS.MANUFACTURING.MIXING.FORM_ID_MISSING, "error");
            return;
          }

          const detailsResponse = await mixingController.fetchFormDetails({
            formId: batch.formId,
            subDepartmentId,
          });

          if (!detailsResponse?.success || !detailsResponse?.data) {
            const fallback =
              detailsResponse?.statusCode === 404
                ? STRINGS.MANUFACTURING.MIXING.DETAILS_NOT_FOUND
                : STRINGS.MANUFACTURING.MIXING.DETAILS_FETCH_ERROR;
            showAlert(getErrorMessage(detailsResponse, fallback), "error");
            return;
          }

          detailsPayload = detailsResponse.data as unknown as Record<string, unknown>;
          nextBatch = {
            ...nextBatch,
            formId: detailsResponse.data.formId || batch.formId,
          };
          nextFormData = mapMixingDetailsToFormState(detailsResponse.data);
          nextFormData = {
            ...nextFormData,
            premixCards: (nextFormData.premixCards ?? []).map((card) => ({
              ...card,
              mixerType: card.mixerType || String(identificationSheet?.mixerType ?? ""),
              bldgNo:
                card.bldgNo ||
                String(
                  (identificationSheet as any)?.bldgNo ??
                    (identificationSheet as any)?.BldgNo ??
                    "",
                ),
              premixDate: card.premixDate || String(identificationSheet?.date ?? ""),
              premixQuantity: card.premixQuantity || String(identificationSheet?.batchSize ?? ""),
              mixingCycle: card.mixingCycle || resolveApiMixingCycleDisplayValue(mixingCycle) || "",
              mixingCycleCode:
                card.mixingCycleCode || String((mixingCycle as any)?.mixingCycleCode ?? ""),
              mixingCycleName:
                card.mixingCycleName || String((mixingCycle as any)?.mixingCycleName ?? ""),
            })),
            finalMixCards: (nextFormData.finalMixCards ?? []).map((card) => ({
              ...card,
              mixerType: card.mixerType || String(identificationSheet?.mixerType ?? ""),
              bldgNo:
                card.bldgNo ||
                String(
                  (identificationSheet as any)?.bldgNo ??
                    (identificationSheet as any)?.BldgNo ??
                    "",
                ),
              mixingCycle: card.mixingCycle || resolveApiMixingCycleDisplayValue(mixingCycle) || "",
              mixingCycleCode:
                card.mixingCycleCode || String((mixingCycle as any)?.mixingCycleCode ?? ""),
              mixingCycleName:
                card.mixingCycleName || String((mixingCycle as any)?.mixingCycleName ?? ""),
            })),
          };
        }

        setActiveBatch(nextBatch);
        setIsEditMode(editMode);
        setFormData(nextFormData);
        setInitialSnapshot(JSON.stringify(nextFormData));
        setMixCardStatusById(
          detailsPayload
            ? buildMixCardStatusMapFromDetails(detailsPayload)
            : buildMixCardStatusMapFromForm(nextFormData),
        );
        setView("form");

        // Enrich process particulars with operation names from the mixing cycle, preserving saved values.
        try {
          const mixingCycleCode = String(
            nextFormData.premixCards[0]?.mixingCycleCode ??
              (nextBatch?.mixingCycle as { mixingCycleCode?: string } | undefined)?.mixingCycleCode ??
              "",
          ).trim();

          if (mixingCycleCode) {
            const res = await mixingController.fetchMixingCycleDetails(mixingCycleCode);

            if (res?.success && res?.data) {
              const { premixOperations, finalMixOperations } = resolveMixingCycleOperations(
                res.data as Record<string, unknown>,
              );

              if (premixOperations.length || finalMixOperations.length) {
                const updated = {
                  ...nextFormData,
                  premixCards: nextFormData.premixCards.map((card) => ({
                    ...card,
                    processParticulars: mergeProcessParticularsWithOperations(
                      premixOperations,
                      card.processParticulars,
                    ),
                  })),
                  finalMixCards: nextFormData.finalMixCards.map((card) => ({
                    ...card,
                    processParticulars: mergeProcessParticularsWithOperations(
                      finalMixOperations,
                      card.processParticulars,
                    ),
                  })),
                };

                setFormData(updated);
                setInitialSnapshot(JSON.stringify(updated));
              }
            }
          }
        } catch (err) {
          console.warn("Failed to fetch mixing cycle details", err);
        }
      } finally {
        setLoadingFormDetails(false);
      }
    },
    [loadBatchIdentificationSheet, showAlert, subDepartmentId],
  );
  const handleViewMixingDetails = useCallback(
    async (row: MixingBatch) => {
      if (!row.formId) {
        showAlert(STRINGS.MANUFACTURING.MIXING.FORM_ID_MISSING, "error");
        return;
      }

      if (!subDepartmentId) {
        showAlert(STRINGS.MANUFACTURING.MIXING.SUB_DEPARTMENT_MISSING, "error");
        return;
      }

      setDetailsLoading(true);

      const response = await mixingController.fetchFormDetails({
        formId: row.formId,
        subDepartmentId,
      });

      setDetailsLoading(false);

      if (!response?.success || !response?.data) {
        showAlert(response?.message ?? STRINGS.MANUFACTURING.MIXING.DETAILS_FETCH_ERROR, "error");
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
  const handleFillForm = useCallback(
    async (batch: MixingBatch) => await openFormWithResolvedData(batch, false),
    [openFormWithResolvedData],
  );

  const handleEditForm = useCallback(
    async (batch: MixingBatch) => await openFormWithResolvedData(batch, true),
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

  const handleFormChange = useCallback((payload) => {
    setFormData((prev) => {
      if (JSON.stringify(prev) === JSON.stringify(payload)) {
        return prev;
      }
      return payload;
    });
  }, []);

  const getMixCardStatus = useCallback(
    (mixCardId: string): MixCardSubmissionStatus =>
      mixCardStatusById[mixCardId]?.mixCardSubmissionStatus ?? "TO_BE_INITIATED",
    [mixCardStatusById],
  );

  const checkMixCardEditable = useCallback(
    (mixCardId: string) => isMixCardEditable(getMixCardStatus(mixCardId)),
    [getMixCardStatus],
  );

  const submitMixCard = useCallback(
    async (stageType: MixCardStageType, cardNo: string | number, intent: "draft" | "submit") => {
      if (!activeBatch) return false;
      const S = STRINGS.MANUFACTURING.MIXING;
      const mixCardId = buildMixCardId(stageType, cardNo);
      const cardLabel = stageType === "PREMIX" ? `Premix ${cardNo}` : `Final Mix ${cardNo}`;

      if (!subDepartmentId) {
        showAlert(S.SUB_DEPARTMENT_MISSING, "error");
        return false;
      }

      if (!checkMixCardEditable(mixCardId)) {
        showAlert(
          getMixCardStatus(mixCardId) === "APPROVED"
            ? S.MIX_CARD_LOCKED_APPROVED
            : S.MIX_CARD_LOCKED_WAITING,
          "warning",
        );
        return false;
      }

      if (intent === "submit" && !hasMixCardValue(formData, stageType, cardNo)) {
        showAlert(S.MIX_CARD_EMPTY_ERROR, "warning");
        return false;
      }

      const mixCardSubmissionType = intent === "draft" ? "DRAFT" : "SUBMIT";
      const formSubmissionType = "DRAFT" as const;
      const status = parseStatus(activeBatch.mxStatus);
      const isCreateFlow = status === parseStatus(MX_STATUS.TO_BE_INITIATED) && !activeBatch.formId;
      const mixingDetails = mapMixingFormStateToPayload(formData, {
        targetMixCardId: mixCardId,
        mixCardSubmissionType,
        mixCardStatusById,
      });

      setActionLoading(true);
      try {
        let response: any;

        if (isCreateFlow) {
          if (!activeBatch.batchId) {
            showAlert(S.BATCH_ID_MISSING, "error");
            return false;
          }
          response = await mixingController.createForm({
            batchId: activeBatch.batchId,
            subDepartmentId,
            formSubmissionType,
            ...mixingDetails,
          });
        } else {
          if (!activeBatch.formId) {
            showAlert(S.FORM_ID_MISSING, "error");
            return false;
          }
          response = await mixingController.updateForm({
            formId: activeBatch.formId,
            batchId: activeBatch.batchId,
            subDepartmentId,
            formSubmissionType,
            ...mixingDetails,
          });
        }

        if (!response?.success) {
          const fallback = isCreateFlow ? S.CREATE_FAILED : S.UPDATE_FAILED;
          showAlert(getErrorMessage(response, fallback), "error");
          return false;
        }

        const nextFormId = response.data?.formId ?? activeBatch.formId ?? null;
        setActiveBatch((prev) => (prev ? { ...prev, formId: nextFormId } : prev));
        setInitialSnapshot(JSON.stringify(formData));
        setHasSavedDraft(true);

        const nextStatus: MixCardSubmissionStatus =
          intent === "draft" ? "IN_PROGRESS" : "WAITING_FOR_APPROVAL";

        setMixCardStatusById((prev) => {
          const updated: Record<string, MixCardStatusMeta> = {
            ...prev,
            [mixCardId]: {
              ...prev[mixCardId],
              mixCardSubmissionType,
              mixCardSubmissionStatus: nextStatus,
            },
          };

          const responseStatuses =
            (response.data as { mixCardStatuses?: any[] } | undefined)?.mixCardStatuses ??
            (response.data as { premixStatuses?: any[] } | undefined)?.premixStatuses;
          if (Array.isArray(responseStatuses)) {
            responseStatuses.forEach((entry: any) => {
              const entryStage = String(entry?.stageType ?? "PREMIX")
                .trim()
                .toUpperCase() as MixCardStageType;
              const entryNo = String(entry?.premixNo ?? entry?.mixNo ?? "").trim();
              if (!entryNo) return;
              const id = buildMixCardId(
                entryStage === "FINAL_MIX" ? "FINAL_MIX" : "PREMIX",
                entryNo,
              );
              updated[id] = {
                ...updated[id],
                mixCardSubmissionType:
                  entry.mixCardSubmissionType ?? updated[id]?.mixCardSubmissionType,
                mixCardSubmissionStatus:
                  (String(entry.mixCardSubmissionStatus ?? entry.status ?? "")
                    .toUpperCase()
                    .replace(/\s+/g, "_") as MixCardSubmissionStatus) ||
                  updated[id]?.mixCardSubmissionStatus ||
                  "TO_BE_INITIATED",
              };
            });
          }

          return updated;
        });

        showAlert(
          intent === "draft"
            ? S.MIX_CARD_SAVE_DRAFT_SUCCESS(cardLabel)
            : S.MIX_CARD_SUBMIT_SUCCESS(cardLabel),
          "success",
          { autoCloseMs: 2200 },
        );
        return true;
      } finally {
        setActionLoading(false);
      }
    },
    [
      activeBatch,
      checkMixCardEditable,
      formData,
      getMixCardStatus,
      mixCardStatusById,
      showAlert,
      subDepartmentId,
    ],
  );

  const handleSaveMixCardDraft = useCallback(
    async (stageType: MixCardStageType, cardNo: string | number) =>
      submitMixCard(stageType, cardNo, "draft"),
    [submitMixCard],
  );

  const handleSubmitMixCard = useCallback(
    async (stageType: MixCardStageType, cardNo: string | number) =>
      submitMixCard(stageType, cardNo, "submit"),
    [submitMixCard],
  );

  const handleSubmitForFinalApproval = useCallback(async () => {
    const S = STRINGS.MANUFACTURING.MIXING;
    if (!activeBatch?.formId) {
      showAlert(S.FORM_ID_MISSING, "error");
      return false;
    }
    if (!subDepartmentId) {
      showAlert(S.SUB_DEPARTMENT_MISSING, "error");
      return false;
    }

    const cards = buildMixingApproverCards({
      premixCards: (formData.premixCards ?? []).map((card) => ({
        ...card,
        mixCardSubmissionStatus:
          mixCardStatusById[buildMixCardId("PREMIX", card.premixNo)]?.mixCardSubmissionStatus ??
          card.mixCardSubmissionStatus,
      })),
      finalMixCards: (formData.finalMixCards ?? []).map((card) => ({
        ...card,
        mixCardSubmissionStatus:
          mixCardStatusById[buildMixCardId("FINAL_MIX", card.mixNo)]?.mixCardSubmissionStatus ??
          card.mixCardSubmissionStatus,
      })),
    });

    const allApproved =
      cards.length > 0 &&
      cards.every(
        (card) => String(card.mixCardSubmissionStatus ?? "").toUpperCase() === "APPROVED",
      );
    if (!allApproved) {
      showAlert(S.FINAL_APPROVAL_NOT_READY, "warning");
      return false;
    }

    setActionLoading(true);
    try {
      const mixingDetails = mapMixingFormStateToPayload(formData, { mixCardStatusById });
      const response = await mixingController.updateForm({
        formId: activeBatch.formId,
        batchId: activeBatch.batchId,
        subDepartmentId,
        formSubmissionType: "SUBMIT",
        ...mixingDetails,
      });

      if (!response?.success) {
        showAlert(getErrorMessage(response, S.FINAL_APPROVAL_FAILED), "error");
        return false;
      }

      showAlert(S.FINAL_APPROVAL_SUCCESS, "success", { autoCloseMs: 2200 });
      await listParams.refreshUserBatches();
      bumpBatchRefresh();
      resetFormContext();
      return true;
    } finally {
      setActionLoading(false);
    }
  }, [
    activeBatch,
    bumpBatchRefresh,
    formData,
    listParams,
    mixCardStatusById,
    resetFormContext,
    showAlert,
    subDepartmentId,
  ]);

  return {
    ...listParams,
    loading: listParams.loading || loadingFormDetails,
    view,
    activeBatch,
    numberOfPremix: resolvePremixCount(activeBatch),
    motorStage: resolveMotorStage(activeBatch),
    isEditMode,
    formData,
    mixCardStatusById,
    getMixCardStatus,
    isMixCardEditable: checkMixCardEditable,
    isFormDirty,
    actionLoading,
    backConfirmOpen,
    setBackConfirmOpen,
    handleFillForm,
    handleEditForm,
    handleBack,
    handleDiscardAndBack,
    handleFormChange,
    handleSaveMixCardDraft,
    handleSubmitMixCard,
    handleSubmitForFinalApproval,
    detailsRow,
    detailsData,
    detailsLoading,
    handleViewMixingDetails,
    handleBackFromDetails,
  };
};

export default useMixingHook;
