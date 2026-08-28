import { useCallback, useMemo, useRef, useState } from "react";
import { STRINGS } from "../../../app/config/strings";
import { useAlertStore } from "../../../app/store/alertStore";
import { useAuthStore } from "../../../app/store/authStore";
import { useUserBatchRefreshStore } from "../../../app/store/userBatchRefreshStore";
import { batchManagementController } from "../../../controllers/admin/BatchManagement/batchManagementController";
import { mixingController } from "../../../controllers/user/manufacturing/mixingController";
import type { IdentificationSheet } from "../../../data/models/admin/BatchManagement/BatchManagementModel";
import {
  buildMixCardId,
  buildMixCardStatusMapFromDetails,
  buildMixCardStatusMapFromForm,
  buildMixingApproverCards,
  createDefaultMixingFormState,
  createEmptyFinalMixEntry,
  createEmptyPremixEntry,
  hasMixCardValue,
  isMixCardEditable,
  mapMixingDetailsToFormState,
  mapMixingFormStateToPayload,
  mergeProcessParticularsWithOperations,
  resolveApiMixingCycleDisplayValue,
  resolveMixingCycleOperations,
  type FinalMixEntry,
  type MixCardStageType,
  type MixCardStatusMeta,
  type MixCardSubmissionStatus,
  type MixingFormState,
  type PremixEntry,
} from "../../../data/models/user/MixingFormModel";
import type { PremixSubmissionType } from "../../../data/models/user/RawMaterialPreparationModel";
import { isManufacturingContinueFillingStatus } from "../../operationStatus";
import { useSubdepartmentBatches } from "../useSubdepartmentBatches";
import {
  isPremixEnabledByPreviousStage,
  isPremixEnabledForWorkflow,
  resolvePreviousStageApprovedUnits,
  type PreviousStageApprovedUnits,
} from "../previousStageApproval";
import { useFileService } from "../../../hooks/useFileService";
import { discardWorkflowSnapshotForm } from "../../../utils/workflowDiscard";

type WorkflowView = "list" | "form" | "details";

type MixingBatch = {
  batchId: string;
  mxStatus?: string;
  formId?: string | null;
  [key: string]: any;
};

const resolveMixFormId = (batch: MixingBatch | null | undefined) =>
  String(batch?.formId ?? "").trim();

const mergeMixingFormPreservingLocalInput = (
  previous: MixingFormState,
  next: MixingFormState,
): MixingFormState => {
  const pickCard = <T extends PremixEntry | FinalMixEntry>(
    cardNo: string,
    stageType: MixCardStageType,
    localCards: T[],
    apiCards: T[],
    cardNoKey: keyof T,
  ): T | undefined => {
    const normalizedNo = cardNo.trim();
    const local = localCards.find((card) => String(card[cardNoKey] ?? "").trim() === normalizedNo);
    const api = apiCards.find((card) => String(card[cardNoKey] ?? "").trim() === normalizedNo);
    if (!local) return api;
    if (!api) return local;

    const apiForm: MixingFormState =
      stageType === "PREMIX"
        ? { premixCards: [api as PremixEntry], finalMixCards: [] }
        : { premixCards: [], finalMixCards: [api as FinalMixEntry] };
    const localForm: MixingFormState =
      stageType === "PREMIX"
        ? { premixCards: [local as PremixEntry], finalMixCards: [] }
        : { premixCards: [], finalMixCards: [local as FinalMixEntry] };

    if (hasMixCardValue(apiForm, stageType, normalizedNo)) return api;
    if (hasMixCardValue(localForm, stageType, normalizedNo)) return local;
    return api;
  };

  const premixNos = new Set([
    ...(previous.premixCards ?? []).map((card) => String(card.premixNo).trim()),
    ...(next.premixCards ?? []).map((card) => String(card.premixNo).trim()),
  ]);
  const finalMixNos = new Set([
    ...(previous.finalMixCards ?? []).map((card) => String(card.mixNo).trim()),
    ...(next.finalMixCards ?? []).map((card) => String(card.mixNo).trim()),
  ]);

  const premixCards = Array.from(premixNos)
    .sort((left, right) => Number(left) - Number(right))
    .map((premixNo) =>
      pickCard(
        premixNo,
        "PREMIX",
        previous.premixCards ?? [],
        next.premixCards ?? [],
        "premixNo",
      ),
    )
    .filter(Boolean) as PremixEntry[];

  const finalMixCards = Array.from(finalMixNos)
    .sort((left, right) => Number(left) - Number(right))
    .map((mixNo) =>
      pickCard(
        mixNo,
        "FINAL_MIX",
        previous.finalMixCards ?? [],
        next.finalMixCards ?? [],
        "mixNo",
      ),
    )
    .filter(Boolean) as FinalMixEntry[];

  return { premixCards, finalMixCards };
};

export const useMixingHook = () => {
  const listParams = useSubdepartmentBatches("mixing");
  const user = useAuthStore((s) => s.user);
  const showAlert = useAlertStore((state) => state.showAlert);
  const bumpBatchRefresh = useUserBatchRefreshStore((state) => state.bumpVersion);
  const { deleteTemp } = useFileService();

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
  const [formHydrationKey, setFormHydrationKey] = useState(0);
  const resolvePremixCount = (batch?: MixingBatch | null) =>
    Number(batch?.numberOfPremix ?? batch?.identificationSheet?.numberOfPremix ?? 1) || 1;
  const resolveMotorStage = (batch?: MixingBatch | null) => Number(batch?.motorStage);
  const loadBatchIdentificationSheet = useCallback(async (batchId: string) => {
    const details = await batchManagementController.getBatchById(batchId);
    const identificationSheet = (details?.identificationSheet ??
      null) as IdentificationSheet | null;
    const numberOfPremix = Number(identificationSheet?.numberOfPremix) || 1;
    const mixingCycle = (details as { mixingCycle?: unknown } | null | undefined)?.mixingCycle;
    const stageProgress = (details as { stageProgress?: unknown } | null | undefined)?.stageProgress;
    const currentStage = (details as { currentStage?: unknown } | null | undefined)?.currentStage;

    return { identificationSheet, numberOfPremix, mixingCycle, stageProgress, currentStage };
  }, []);

  const [formData, setFormData] = useState<MixingFormState>(() => createDefaultMixingFormState());
  const [initialSnapshot, setInitialSnapshot] = useState("{}");
  const [mixCardStatusById, setMixCardStatusById] = useState<Record<string, MixCardStatusMeta>>(
    {},
  );
  const [previousStageGate, setPreviousStageGate] = useState<PreviousStageApprovedUnits | null>(
    null,
  );

  const formSnapshot = useMemo(() => JSON.stringify(formData), [formData]);
  const isFormDirty = useMemo(
    () => view === "form" && formSnapshot !== initialSnapshot,
    [view, formSnapshot, initialSnapshot],
  );

  const snapshotStateRef = useRef(formData);
  snapshotStateRef.current = formData;
  const initialSnapshotRef = useRef(initialSnapshot);
  initialSnapshotRef.current = initialSnapshot;

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
    setPreviousStageGate(null);
  }, []);

  const getErrorMessage = (response: any, fallbackMessage: string) => {
    if (response?.error?.details) return response.error.details;
    if (response?.message) return response.message;
    return fallbackMessage;
  };

  const openFormWithResolvedData = useCallback(
    async (
      batch: MixingBatch,
      editMode: boolean,
      options?: { silent?: boolean; preserveLocalFormData?: MixingFormState },
    ) => {
      if (!batch.batchId) {
        showAlert(STRINGS.MANUFACTURING.MIXING.BATCH_ID_MISSING, "error");
        return;
      }

      const silent = Boolean(options?.silent);
      const preserveLocalFormData = options?.preserveLocalFormData;
      const status = batch.mxStatus ?? batch.status;
      // Silent refresh after save must always hit form/details (even if list status
      // is still TO_BE_INITIATED right after the first create).
      const shouldFetchDetails =
        silent ||
        editMode ||
        isManufacturingContinueFillingStatus(String(status ?? "")) ||
        Boolean(resolveMixFormId(batch));

      if (!silent) setLoadingFormDetails(true);

      try {
        const { identificationSheet, numberOfPremix, mixingCycle, stageProgress, currentStage } =
          await loadBatchIdentificationSheet(batch.batchId);

        const nextGate = resolvePreviousStageApprovedUnits({
          stageProgress: stageProgress ?? batch.stageProgress,
          currentStage: currentStage ?? batch.currentStage,
          currentSlug: "mixing",
          currentSubDepartmentId: subDepartmentId,
          subDepartments: user?.allSubDepartments,
        });
        setPreviousStageGate(nextGate);

        let nextBatch: MixingBatch = {
          ...batch,
          identificationSheet,
          numberOfPremix,
          mixingCycle,
          stageProgress: stageProgress ?? batch.stageProgress,
          currentStage: currentStage ?? batch.currentStage,
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
              finalMixNo: String(index + 1),
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
          const formId = resolveMixFormId(batch);
          if (!formId) {
            showAlert(STRINGS.MANUFACTURING.MIXING.FORM_ID_MISSING, "error");
            return;
          }

          const detailsResponse = await mixingController.fetchFormDetails({
            formId,
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
            formId: detailsResponse.data.formId || formId,
          };
          if (detailsResponse.data.status) {
            nextBatch.mxStatus = String(detailsResponse.data.status);
            nextBatch.status = String(detailsResponse.data.status);
          }
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

        if (silent && preserveLocalFormData) {
          nextFormData = mergeMixingFormPreservingLocalInput(preserveLocalFormData, nextFormData);
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
        if (silent) {
          setFormHydrationKey((value) => value + 1);
        }

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
        if (!silent) setLoadingFormDetails(false);
      }
    },
    [loadBatchIdentificationSheet, showAlert, subDepartmentId, user?.allSubDepartments],
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

  const handleDiscardAndBack = useCallback(async () => {
    setBackConfirmOpen(false);
    await discardWorkflowSnapshotForm({
      subDepartmentId,
      initialSnapshot: initialSnapshotRef.current,
      currentState: snapshotStateRef.current,
      deleteTemp,
      resetForm: () => {
        bumpBatchRefresh();
        resetFormContext();
      },
    });
  }, [bumpBatchRefresh, deleteTemp, resetFormContext, subDepartmentId]);

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

  const orderedPremixNos = useMemo(
    () => (formData.premixCards ?? []).map((card) => card.premixNo),
    [formData.premixCards],
  );

  const orderedFinalMixNos = useMemo(
    () => (formData.finalMixCards ?? []).map((card) => card.mixNo),
    [formData.finalMixCards],
  );

  const isMixCardWorkflowEnabled = useCallback(
    (stageType: MixCardStageType, cardNo: string | number) => {
      const cardNoStr = String(cardNo);
      if (stageType === "PREMIX") {
        return isPremixEnabledForWorkflow(
          cardNo,
          orderedPremixNos,
          previousStageGate,
          (premixNo) => getMixCardStatus(buildMixCardId("PREMIX", String(premixNo))),
        );
      }
      return isPremixEnabledForWorkflow(
        cardNo,
        orderedFinalMixNos,
        previousStageGate,
        (mixNo) => getMixCardStatus(buildMixCardId("FINAL_MIX", String(mixNo))),
      );
    },
    [getMixCardStatus, orderedFinalMixNos, orderedPremixNos, previousStageGate],
  );

  const checkMixCardEditable = useCallback(
    (mixCardId: string) => {
      const dashIdx = mixCardId.indexOf("-");
      if (dashIdx < 0) return false;
      const stageType = mixCardId.slice(0, dashIdx) as MixCardStageType;
      const cardNo = mixCardId.slice(dashIdx + 1);
      if (!isMixCardWorkflowEnabled(stageType, cardNo)) return false;
      return isMixCardEditable(getMixCardStatus(mixCardId));
    },
    [getMixCardStatus, isMixCardWorkflowEnabled],
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

      if (!isMixCardWorkflowEnabled(stageType, cardNo)) {
        showAlert(
          isPremixEnabledByPreviousStage(cardNo, previousStageGate)
            ? STRINGS.MANUFACTURING.SEQUENTIAL_UNIT_TAB_DISABLED
            : STRINGS.MANUFACTURING.PREVIOUS_STAGE_UNIT_DISABLED,
          "warning",
        );
        return false;
      }

      if (intent === "submit" && !hasMixCardValue(formData, stageType, cardNo)) {
        showAlert(S.MIX_CARD_EMPTY_ERROR, "warning");
        return false;
      }

      const premixSubmissionType: PremixSubmissionType = intent === "draft" ? "DRAFT" : "SUBMIT";
      const formSubmissionType = "DRAFT" as const;
      const isCreateFlow = !resolveMixFormId(activeBatch);
      const mixingDetails = mapMixingFormStateToPayload(formData, {
        targetMixCardId: mixCardId,
        premixSubmissionType,
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

        const nextFormId = String(response.data?.formId ?? activeBatch.formId ?? "").trim();
        const refreshedBatch: MixingBatch = {
          ...activeBatch,
          formId: nextFormId || activeBatch.formId,
          mxStatus: response.data?.status ?? activeBatch.mxStatus,
          status: response.data?.status ?? activeBatch.status,
        };

        setActiveBatch(refreshedBatch);
        if (intent === "draft") {
          setHasSavedDraft(true);
        }

        showAlert(
          intent === "draft"
            ? S.MIX_CARD_SAVE_DRAFT_SUCCESS(cardLabel)
            : S.MIX_CARD_SUBMIT_SUCCESS(cardLabel),
          "success",
          { autoCloseMs: 2200 },
        );

        if (nextFormId) {
          const statusForBanner = String(
            response.data?.status ?? activeBatch.mxStatus ?? activeBatch.status ?? "",
          )
            .trim()
            .toUpperCase()
            .replace(/\s+/g, "_");
          const stillRejectedEdit = statusForBanner === "REJECTED";

          await openFormWithResolvedData(refreshedBatch, stillRejectedEdit, {
            silent: true,
            preserveLocalFormData: formData,
          });
        } else {
          setInitialSnapshot(JSON.stringify(formData));
        }

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
      isMixCardWorkflowEnabled,
      mixCardStatusById,
      previousStageGate,
      showAlert,
      subDepartmentId,
      openFormWithResolvedData,
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
    loadingFormDetails,
    view,
    activeBatch,
    numberOfPremix: resolvePremixCount(activeBatch),
    motorStage: resolveMotorStage(activeBatch),
    isEditMode,
    formData,
    mixCardStatusById,
    previousStageGate,
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
    formHydrationKey,
  };
};

export default useMixingHook;
