import { useCallback, useMemo, useRef, useState } from "react";
import { STRINGS } from "../../../app/config/strings";
import { useAlertStore } from "../../../app/store/alertStore";
import { useAuthStore } from "../../../app/store/authStore";
import { useUserBatchRefreshStore } from "../../../app/store/userBatchRefreshStore";
import { batchManagementController } from "../../../controllers/admin/BatchManagement/batchManagementController";
import { mixingController } from "../../../controllers/user/manufacturing/mixingController";
import type { IdentificationSheet } from "../../../data/models/admin/BatchManagement/BatchManagementModel";
import { resolveMasterDataName } from "../../../data/models/admin/BatchManagement/BatchManagementModel";
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
  isMixCardLocked,
  mapMixingDetailsToFormState,
  mapMixingFormStateToPayload,
  mapBackendQualityChecksToRows,
  mergeProcessParticularsWithOperations,
  resolveMixingCycleOperations,
  resolveMixingCycleQualityChecks,
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
  getPremixNavTabDisabledReasonWithBatch,
  isPremixEnabledForWorkflowWithBatch,
  resolvePreviousStageApprovedUnits,
  type BatchStageContext,
  type PreviousStageApprovedUnits,
} from "../previousStageApproval";
import { handleBatchInvalidState } from "../../../utils/batchInvalidStateHandler";
import {
  fetchEnrichedBatchStageFields,
  normalizeStageProgressArray,
  parseParallelFlowEnabled,
  SUB_DEPT,
} from "../../../utils/batchStageUtils";
import { useFileService } from "../../../hooks/useFileService";
import { discardWorkflowSnapshotForm } from "../../../utils/workflowDiscard";

type WorkflowView = "list" | "form" | "details";

type MixingBatch = BatchStageContext & {
  batchId: string;
  projectId?: string | null;
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
      pickCard(premixNo, "PREMIX", previous.premixCards ?? [], next.premixCards ?? [], "premixNo"),
    )
    .filter(Boolean) as PremixEntry[];

  const finalMixCards = Array.from(finalMixNos)
    .sort((left, right) => Number(left) - Number(right))
    .map((mixNo) =>
      pickCard(mixNo, "FINAL_MIX", previous.finalMixCards ?? [], next.finalMixCards ?? [], "mixNo"),
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
    const parallelFlowEnabled = parseParallelFlowEnabled(details?.parallelFlowEnabled);
    const stageProgress = normalizeStageProgressArray(details?.stageProgress);
    const currentStage = normalizeStageProgressArray(details?.currentStage);

    return {
      identificationSheet,
      numberOfPremix,
      parallelFlowEnabled,
      stageProgress,
      currentStage,
    };
  }, []);

  const [formData, setFormData] = useState<MixingFormState>(() => createDefaultMixingFormState());
  const [initialSnapshot, setInitialSnapshot] = useState("{}");
  const [mixCardStatusById, setMixCardStatusById] = useState<Record<string, MixCardStatusMeta>>({});
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
        const {
          identificationSheet,
          numberOfPremix,
          parallelFlowEnabled,
          stageProgress,
          currentStage,
        } = await loadBatchIdentificationSheet(batch.batchId);

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
          parallelFlowEnabled,
          stageProgress: stageProgress ?? batch.stageProgress,
          currentStage: currentStage ?? batch.currentStage,
        };

        const buildPrefilledFormData = () => {
          const premixCards = Array.from(
            { length: Math.max(1, Number(numberOfPremix) || 1) },
            (_, index) => ({
              ...createEmptyPremixEntry(index + 1),
              mixerType: resolveMasterDataName(identificationSheet?.mixerType),
              bldgNo: "",
              premixDate: String(identificationSheet?.date ?? ""),
              premixQuantity: String(identificationSheet?.batchSize ?? ""),
              mixingCycle: "",
              mixingCycleCode: "",
              mixingCycleId: "",
              mixingCycleName: "",
            }),
          );

          const finalMixCards = Array.from(
            { length: Math.max(1, Number(numberOfPremix) || 1) },
            (_, index) => ({
              ...createEmptyFinalMixEntry(index + 1),
              finalMixNo: String(index + 1),
              mixerType: resolveMasterDataName(identificationSheet?.mixerType),
              bldgNo: "",
              mixingCycle: "",
              mixingCycleCode: "",
              mixingCycleId: "",
              mixingCycleName: "",
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
              mixerType: card.mixerType || resolveMasterDataName(identificationSheet?.mixerType),
              bldgNo: card.bldgNo || "",
              premixDate: card.premixDate || String(identificationSheet?.date ?? ""),
              premixQuantity: card.premixQuantity || String(identificationSheet?.batchSize ?? ""),
              // Keep cycle from saved Mixing form details only — do not fall back to batch.
              mixingCycle: card.mixingCycle || "",
              mixingCycleCode: card.mixingCycleCode || "",
              mixingCycleId: card.mixingCycleId || "",
              mixingCycleName: card.mixingCycleName || "",
            })),
            finalMixCards: (nextFormData.finalMixCards ?? []).map((card) => ({
              ...card,
              mixerType: card.mixerType || resolveMasterDataName(identificationSheet?.mixerType),
              bldgNo: card.bldgNo || "",
              mixingCycle: card.mixingCycle || "",
              mixingCycleCode: card.mixingCycleCode || "",
              mixingCycleId: card.mixingCycleId || "",
              mixingCycleName: card.mixingCycleName || "",
            })),
          };
        }

        if (silent && preserveLocalFormData) {
          nextFormData = mergeMixingFormPreservingLocalInput(preserveLocalFormData, nextFormData);
        }

        setActiveBatch(nextBatch);
        setIsEditMode(editMode);
        snapshotStateRef.current = nextFormData;
        setFormData(nextFormData);
        setInitialSnapshot(JSON.stringify(nextFormData));
        const mixCardStatusMap = detailsPayload
          ? buildMixCardStatusMapFromDetails(detailsPayload)
          : buildMixCardStatusMapFromForm(nextFormData);
        setMixCardStatusById(mixCardStatusMap);
        setView("form");
        // Remount MixingForm so local card state hydrates from this load (not a stale echo).
        setFormHydrationKey((value) => value + 1);

        // Enrich process particulars per card from that card's mixing cycle (not Premix 1 only).
        try {
          const uniqueCycleCodes = [
            ...new Set(
              [
                ...(nextFormData.premixCards ?? []).map((card) =>
                  String(card.mixingCycleCode ?? "").trim(),
                ),
                ...(nextFormData.finalMixCards ?? []).map((card) =>
                  String(card.mixingCycleCode ?? "").trim(),
                ),
              ].filter(Boolean),
            ),
          ];

          if (uniqueCycleCodes.length) {
            const cycleDetailsByCode = new Map<string, Record<string, unknown>>();
            await Promise.all(
              uniqueCycleCodes.map(async (code) => {
                try {
                  const res = await mixingController.fetchMixingCycleDetails(code);
                  if (res?.success && res?.data) {
                    cycleDetailsByCode.set(code, res.data as Record<string, unknown>);
                  }
                } catch (err) {
                  console.warn(`Failed to fetch mixing cycle details for ${code}`, err);
                }
              }),
            );

            const mergeQcRows = (
              template: ReturnType<typeof mapBackendQualityChecksToRows>,
              current: PremixEntry["qualityChecks"] | FinalMixEntry["qualityChecks"],
            ) => {
              if (!template.length) return current;
              return template.map((row) => {
                const paramKey = String(row.parameterId ?? "").trim();
                const existing = current.find(
                  (item) => String(item.parameterId ?? "").trim() === paramKey,
                );
                if (!existing) return { ...row, parameterId: paramKey };
                const sampleCount = Math.max(
                  1,
                  Number(row.noOfSamples) || 1,
                  Number(existing.noOfSamples) || 0,
                  Array.isArray(existing.observedValues) ? existing.observedValues.length : 0,
                );
                const prior = Array.isArray(existing.observedValues)
                  ? existing.observedValues
                  : [];
                return {
                  ...row,
                  parameterId: paramKey,
                  noOfSamples: sampleCount,
                  observedValues: Array.from({ length: sampleCount }, (_, i) => {
                    const value = prior[i];
                    return value == null ? "" : String(value);
                  }),
                };
              });
            };

            const updated: MixingFormState = {
              ...nextFormData,
              premixCards: nextFormData.premixCards.map((card) => {
                const cardStatus =
                  card.mixCardSubmissionStatus ??
                  mixCardStatusMap[buildMixCardId("PREMIX", card.premixNo)]
                    ?.mixCardSubmissionStatus;
                if (isMixCardLocked(cardStatus)) return card;
                const code = String(card.mixingCycleCode ?? "").trim();
                const details = code ? cycleDetailsByCode.get(code) : undefined;
                if (!details) return card;
                const { premixOperations } = resolveMixingCycleOperations(details);
                const { premixQualityChecks } = resolveMixingCycleQualityChecks(details);
                const premixQcRows = mapBackendQualityChecksToRows(premixQualityChecks);
                return {
                  ...card,
                  processParticulars: premixOperations.length
                    ? mergeProcessParticularsWithOperations(
                        premixOperations,
                        card.processParticulars,
                      )
                    : card.processParticulars,
                  qualityChecks: mergeQcRows(premixQcRows, card.qualityChecks),
                };
              }),
              finalMixCards: nextFormData.finalMixCards.map((card) => {
                const cardStatus =
                  card.mixCardSubmissionStatus ??
                  mixCardStatusMap[buildMixCardId("FINAL_MIX", card.mixNo)]
                    ?.mixCardSubmissionStatus;
                if (isMixCardLocked(cardStatus)) return card;
                const code = String(card.mixingCycleCode ?? "").trim();
                const details = code ? cycleDetailsByCode.get(code) : undefined;
                if (!details) return card;
                const { finalMixOperations } = resolveMixingCycleOperations(details);
                const { finalMixQualityChecks } = resolveMixingCycleQualityChecks(details);
                const finalQcRows = mapBackendQualityChecksToRows(finalMixQualityChecks);
                return {
                  ...card,
                  processParticulars: finalMixOperations.length
                    ? mergeProcessParticularsWithOperations(
                        finalMixOperations,
                        card.processParticulars,
                      )
                    : card.processParticulars,
                  qualityChecks: mergeQcRows(finalQcRows, card.qualityChecks),
                };
              }),
            };

            snapshotStateRef.current = updated;
            setFormData(updated);
            setInitialSnapshot(JSON.stringify(updated));
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

  const handleFormChange = useCallback((payload: MixingFormState) => {
    // Keep ref in sync immediately so save/submit never reads a stale render snapshot
    // (QC observed values were saving prior keystrokes, e.g. 100 → 9).
    snapshotStateRef.current = payload;
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
      const mixingSubDeptId = subDepartmentId ?? SUB_DEPT.MIXING;
      if (stageType === "PREMIX") {
        return isPremixEnabledForWorkflowWithBatch(
          activeBatch,
          mixingSubDeptId,
          cardNo,
          orderedPremixNos,
          previousStageGate,
          (premixNo) => getMixCardStatus(buildMixCardId("PREMIX", String(premixNo))),
          "PREMIX",
        );
      }
      return isPremixEnabledForWorkflowWithBatch(
        activeBatch,
        mixingSubDeptId,
        cardNo,
        orderedFinalMixNos,
        previousStageGate,
        (mixNo) => getMixCardStatus(buildMixCardId("FINAL_MIX", String(mixNo))),
        "FINAL_MIX",
      );
    },
    [
      activeBatch,
      getMixCardStatus,
      orderedFinalMixNos,
      orderedPremixNos,
      previousStageGate,
      subDepartmentId,
    ],
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
        const orderedNos = stageType === "PREMIX" ? orderedPremixNos : orderedFinalMixNos;
        const cardIndex = orderedNos.findIndex((entry) => String(entry) === String(cardNo));
        const disabledReason = getPremixNavTabDisabledReasonWithBatch(
          activeBatch,
          subDepartmentId ?? SUB_DEPT.MIXING,
          cardNo,
          cardIndex,
          orderedNos,
          previousStageGate,
          (unitNo) => getMixCardStatus(buildMixCardId(stageType, String(unitNo))),
          {
            previousStage:
              stageType === "PREMIX"
                ? STRINGS.MANUFACTURING.PREVIOUS_STAGE_PREMIX_TAB_DISABLED
                : STRINGS.MANUFACTURING.PREVIOUS_STAGE_UNIT_DISABLED,
            sequential: STRINGS.MANUFACTURING.SEQUENTIAL_UNIT_TAB_DISABLED,
            notYetUnlocked: STRINGS.MANUFACTURING.NOT_YET_UNLOCKED,
          },
          stageType,
        );
        showAlert(disabledReason ?? STRINGS.MANUFACTURING.PREVIOUS_STAGE_UNIT_DISABLED, "warning");
        return false;
      }

      // Prefer the live ref (updated synchronously from the form) over possibly stale state.
      const latestFormData = snapshotStateRef.current ?? formData;

      if (intent === "submit" && !hasMixCardValue(latestFormData, stageType, cardNo)) {
        showAlert(S.MIX_CARD_EMPTY_ERROR, "warning");
        return false;
      }

      const premixSubmissionType: PremixSubmissionType = intent === "draft" ? "DRAFT" : "SUBMIT";
      const formSubmissionType = "DRAFT" as const;
      const isCreateFlow = !resolveMixFormId(activeBatch);
      const mixingDetails = mapMixingFormStateToPayload(latestFormData, {
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
        let refreshedBatch: MixingBatch = {
          ...activeBatch,
          formId: nextFormId || activeBatch.formId,
          mxStatus: response.data?.status ?? activeBatch.mxStatus,
          status: response.data?.status ?? activeBatch.status,
        };

        if (intent === "submit" && activeBatch.batchId) {
          await listParams.refreshUserBatches();
          const enrichedStageFields = await fetchEnrichedBatchStageFields(activeBatch.batchId);
          if (enrichedStageFields) {
            refreshedBatch = { ...refreshedBatch, ...enrichedStageFields };
            setPreviousStageGate(
              resolvePreviousStageApprovedUnits({
                stageProgress: enrichedStageFields.stageProgress ?? refreshedBatch.stageProgress,
                currentStage: enrichedStageFields.currentStage ?? refreshedBatch.currentStage,
                currentSlug: "mixing",
                currentSubDepartmentId: subDepartmentId,
                subDepartments: user?.allSubDepartments,
              }),
            );
          }
          bumpBatchRefresh();
        }

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
            preserveLocalFormData: latestFormData,
          });
        } else {
          setInitialSnapshot(JSON.stringify(latestFormData));
        }

        return true;
      } catch (error) {
        if (
          await handleBatchInvalidState(
            error,
            async () => {
              if (!activeBatch.batchId) return;
              await listParams.refreshUserBatches();
              const enrichedStageFields = await fetchEnrichedBatchStageFields(activeBatch.batchId);
              const batchToReopen: MixingBatch = enrichedStageFields
                ? { ...activeBatch, ...enrichedStageFields }
                : activeBatch;
              if (enrichedStageFields) {
                setActiveBatch(batchToReopen);
                setPreviousStageGate(
                  resolvePreviousStageApprovedUnits({
                    stageProgress: enrichedStageFields.stageProgress ?? batchToReopen.stageProgress,
                    currentStage: enrichedStageFields.currentStage ?? batchToReopen.currentStage,
                    currentSlug: "mixing",
                    currentSubDepartmentId: subDepartmentId,
                    subDepartments: user?.allSubDepartments,
                  }),
                );
              }
              bumpBatchRefresh();
              await openFormWithResolvedData(batchToReopen, isEditMode, {
                silent: true,
                preserveLocalFormData: snapshotStateRef.current ?? formData,
              });
            },
            showAlert,
          )
        ) {
          return false;
        }
        throw error;
      } finally {
        setActionLoading(false);
      }
    },
    [
      activeBatch,
      bumpBatchRefresh,
      checkMixCardEditable,
      formData,
      getMixCardStatus,
      isEditMode,
      isMixCardWorkflowEnabled,
      listParams,
      mixCardStatusById,
      orderedFinalMixNos,
      orderedPremixNos,
      previousStageGate,
      showAlert,
      subDepartmentId,
      user?.allSubDepartments,
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
