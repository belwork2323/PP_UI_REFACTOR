// src/hooks/user/manufacturing/useRawMaterialPrepHook.ts

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { batchManagementController } from "../../../controllers/admin/BatchManagement/batchManagementController";
import { useAlertStore } from "../../../app/store/alertStore";
import { useAuthStore } from "../../../app/store/authStore";
import { useUserBatchRefreshStore } from "../../../app/store/userBatchRefreshStore";
import { STRINGS } from "../../../app/config/strings";
import type { IdentificationSheet } from "../../../data/models/admin/BatchManagement/BatchManagementModel";
import { isManufacturingContinueFillingStatus } from "../../operationStatus";
import { MANUFACTURING_STATUS } from "./manufacturingWorkflowData";
import { ManufacturingBatch, WorkflowView } from "./useManufacturingWorkflow";
import { useSubdepartmentBatches } from "../useSubdepartmentBatches";
import { useFileService } from "../../../hooks/useFileService";
import { discardWorkflowSnapshotForm } from "../../../utils/workflowDiscard";
import rawMaterialPreparationController from "../../../controllers/user/manufacturing/rawMaterialPreparationController";
import { cloneValue } from "@/data/models/shared/sectionFormTypes";
import {
  createEmptyPremixProcessSession,
  createEmptyWeightmentSheet,
  normalizeMaterialProcessSlot,
  isPremixEditable,
  mapPreparationDetailsFromApi,
  mapPreparationDetailsFromSavedForm,
  mapPreparationDetailsPayload,
  mapWeightmentSheetFromApi,
  premixSessionHasData,
  type PremixStatusMeta,
  type PremixSubmissionStatus,
  type PremixSubmissionType,
  type RawMaterialPrepPremixSession,
  type RawMaterialPrepPremixSelection,
  type RawMaterialPrepWeightmentSheet,
} from "../../../data/models/user/RawMaterialPreparationModel";
import type { MaterialsListItem } from "../../../data/models/user/MaterialsListModel";
import { isApRmpFormTemplate } from "../../../data/models/user/rmp/rmpMaterialUiRegistry";
import {
  buildPremixMaterialOptions,
  buildPremixMaterialSelectionsFromSheet,
  buildPremixMaterialSessionsFromSelections,
  buildSheetDerivedMaterialLists,
  normalizePremixSessionKeys,
  getPremixMaterialSessionKey,
  groupPremixSelectionsByPremix,
  materialRequiresGradeSelection,
  mergeMaterialsLists,
  mergePremixMaterialSelections,
  type PremixMaterialOption,
  type RawMaterialPrepMaterialOption,
} from "./rawMaterialPrepFlowConfig";
import { processFormHasUserData } from "../../../data/models/user/rmp/defaultSolidProcessForm";
import {
  firstRmpValidationErrorMessage,
  getWeightmentIdentificationError,
  isPremixSelectionProcessReady,
  resolveFirstRmpValidationFocus,
  type RmpValidationFocusTarget,
  validateRawMaterialPreparation,
  validateRmpApGradeCardsLive,
  validateRmpPremixSlotLive,
  validateWeightmentErrorsLive,
} from "@/data/validation/adapters/rawMaterialPreparation.validation";
import { hasValidationErrors } from "@/data/validation/validationErrors";
import type { ValidationAttemptFlags } from "@/ui/components/validation/useValidationDisplay";
import {
  isPremixEnabledForWorkflowWithBatch,
  resolvePreviousStageApprovedUnits,
  type PreviousStageApprovedUnits,
} from "../previousStageApproval";
import {
  fetchEnrichedBatchStageFields,
  findPremixUnit,
  getActiveStage,
  isPremixDisabled,
  mergeBatchStageFields,
  SUB_DEPT,
  usesParallelUnitLocks,
} from "../../../utils/batchStageUtils";
import { handleBatchInvalidState } from "../../../utils/batchInvalidStateHandler";

const RM_STATUS = MANUFACTURING_STATUS;

// ─── Helpers ──────────────────────────────────────────────────────────────────
export const deriveTypes = (material: any) => {
  const m = String(material ?? "").toLowerCase();
  return {
    solid: m === "solid" || m === "both",
    liquid: m === "liquid" || m === "both",
    linear: m === "linear",
  };
};

export const isMaterialUnset = (material: any) =>
  String(material ?? "").toLowerCase() === "type not selected yet";

export interface MaterialTypes {
  solid: boolean;
  liquid: boolean;
  linear: boolean;
}

type AddedPremixSelection = RawMaterialPrepPremixSelection;
type PremixSession = RawMaterialPrepPremixSession;

export type RawMaterialPrepBatch = ManufacturingBatch & {
  rmStatus?: string;
  material?: string;
  formId?: string | null;
};

const enrichRmpBatchFromDetails = (
  batch: RawMaterialPrepBatch,
  batchDetails: Awaited<ReturnType<typeof batchManagementController.getBatchById>>,
): RawMaterialPrepBatch | null => {
  if (!batchDetails) return null;

  return mergeBatchStageFields(
    {
      ...batch,
      batchType: batch.batchType ?? batchDetails.batchType ?? batch.batchType,
      material: batch.material ?? batchDetails.material ?? batch.material,
      identificationSheet: batchDetails.identificationSheet ?? batch.identificationSheet,
    },
    batchDetails as Record<string, unknown>,
  );
};

const normalizePremixSession = (session?: Partial<PremixSession> | null): PremixSession => {
  const base = createEmptyPremixProcessSession();
  if (!session) return base;

  const solidMaterialCode = String(session.solidMaterialCode ?? base.solidMaterialCode);
  const liquidMaterialCode = String(session.liquidMaterialCode ?? base.liquidMaterialCode);

  return {
    ...base,
    ...session,
    selectedProcesses: {
      solid: Boolean(session.selectedProcesses?.solid),
      liquid: Boolean(session.selectedProcesses?.liquid),
    },
    solidMaterialCode,
    solidGradeCode: String(session.solidGradeCode ?? base.solidGradeCode),
    liquidMaterialCode,
    solidRmpFormTemplate: session.solidRmpFormTemplate ?? base.solidRmpFormTemplate,
    liquidRmpFormTemplate: session.liquidRmpFormTemplate ?? base.liquidRmpFormTemplate,
    solid: normalizeMaterialProcessSlot(
      "solid",
      solidMaterialCode,
      session.solid,
      String(session.solidGradeCode ?? ""),
      session.solidRmpFormTemplate,
    ),
    liquid: normalizeMaterialProcessSlot(
      "liquid",
      liquidMaterialCode,
      session.liquid,
      "",
      session.liquidRmpFormTemplate,
    ),
    apGradeSlots: (() => {
      if (Array.isArray(session.apGradeSlots)) {
        return session.apGradeSlots.map((card) => ({
          gradeCode: card.gradeCode,
          slot: normalizeMaterialProcessSlot(
            "solid",
            solidMaterialCode,
            card.slot,
            card.gradeCode,
            session.solidRmpFormTemplate ?? "AP",
          ),
        }));
      }
      // Legacy AP sessions (before host-managed cards): seed once from sheet grade.
      // Never invent a card when solidGradeCode is empty (user deleted all grades).
      if (isApRmpFormTemplate(session.solidRmpFormTemplate)) {
        const grade = String(session.solidGradeCode ?? "").trim();
        if (!grade) return [];
        return [
          {
            gradeCode: grade,
            slot: normalizeMaterialProcessSlot(
              "solid",
              solidMaterialCode,
              session.solid,
              grade,
              session.solidRmpFormTemplate ?? "AP",
            ),
          },
        ];
      }
      return undefined;
    })(),
    pendingSolidProcess: session.pendingSolidProcess ?? base.pendingSolidProcess,
    pendingLiquidProcess: session.pendingLiquidProcess ?? base.pendingLiquidProcess,
    pendingSolidSections: session.pendingSolidSections ?? base.pendingSolidSections,
    pendingLiquidSections: session.pendingLiquidSections ?? base.pendingLiquidSections,
  };
};

const isSessionFilled = (session: PremixSession) =>
  premixSessionHasData(normalizePremixSession(session));

const parseStatus = (status: string | undefined) => String(status ?? "").toLowerCase();

const resolveRmpFormId = (batch: RawMaterialPrepBatch | null | undefined) =>
  String(batch?.formId ?? "").trim();

const mergePremixSessionsPreservingLocalInput = (
  previous: Record<string, PremixSession>,
  next: Record<string, PremixSession>,
): Record<string, PremixSession> => {
  const merged: Record<string, PremixSession> = {};

  Object.entries(next).forEach(([key, session]) => {
    const prev = previous[key];
    if (!prev) {
      merged[key] = session;
      return;
    }

    merged[key] = {
      ...session,
      pendingSolidProcess: session.pendingSolidProcess
        ? session.pendingSolidProcess
        : prev.pendingSolidProcess,
      pendingLiquidProcess: session.pendingLiquidProcess
        ? session.pendingLiquidProcess
        : prev.pendingLiquidProcess,
      pendingSolidSections: session.pendingSolidSections?.length
        ? session.pendingSolidSections
        : prev.pendingSolidSections,
      pendingLiquidSections: session.pendingLiquidSections?.length
        ? session.pendingLiquidSections
        : prev.pendingLiquidSections,
      // Prefer local AP grade cards (including intentional empty after delete-all).
      apGradeSlots: Array.isArray(prev.apGradeSlots)
        ? prev.apGradeSlots
        : session.apGradeSlots,
      solid: {
        uiKey: session.solid.uiKey ?? prev.solid.uiKey,
        processForm: cloneValue(
          processFormHasUserData(session.solid.processForm)
            ? session.solid.processForm
            : processFormHasUserData(prev.solid.processForm)
              ? prev.solid.processForm
              : session.solid.processForm,
        ),
      },
      liquid: {
        uiKey: session.liquid.uiKey ?? prev.liquid.uiKey,
        processForm: cloneValue(
          processFormHasUserData(session.liquid.processForm)
            ? session.liquid.processForm
            : processFormHasUserData(prev.liquid.processForm)
              ? prev.liquid.processForm
              : session.liquid.processForm,
        ),
      },
    };
  });

  Object.entries(previous).forEach(([key, prev]) => {
    if (merged[key] || !premixSessionHasData(prev)) return;
    merged[key] = prev;
  });

  return merged;
};

export const useRawMaterialPrepHook = () => {
  const listParams = useSubdepartmentBatches("raw-material-prep");
  const showAlert = useAlertStore((state) => state.showAlert);
  const showValidationAlert = useAlertStore((state) => state.showValidationAlert);
  const user = useAuthStore((s) => s.user);
  const bumpBatchRefresh = useUserBatchRefreshStore((state) => state.bumpVersion);
  const { deleteTemp } = useFileService();

  const subDepartmentId = useMemo(() => {
    const subDepartments = user?.allSubDepartments ?? [];
    const match =
      subDepartments.find((sd) => sd.slugs?.subDept === "raw-material-prep") ??
      subDepartments.find((sd) => sd.slugs?.subDept === "raw-material-preparation") ??
      subDepartments.find(
        (sd) => sd.slugs?.dept === "manufacturing" && sd.slugs?.subDept === "raw-material-prep",
      );
    return match?.subDepartmentId ?? null;
  }, [user]);

  const [view, setView] = useState<WorkflowView>("list");
  const [detailsRow, setDetailsRow] = useState<any>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsData, setDetailsData] = useState<any>(null);
  const [activeBatch, setActiveBatch] = useState<RawMaterialPrepBatch | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [loadingFormDetails, setLoadingFormDetails] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [backConfirmOpen, setBackConfirmOpen] = useState(false);
  const [hasSavedDraft, setHasSavedDraft] = useState(false);
  const [formHydrationKey, setFormHydrationKey] = useState(0);
  const skipSessionRebuildRef = useRef(false);
  /** Premix last validated on save/submit — scopes live weighment revalidation. */
  const validationContextPremixRef = useRef<number | null>(null);
  const [numberOfPremix, setNumberOfPremix] = useState(0);
  const [identificationSheet, setIdentificationSheet] = useState<IdentificationSheet | null>(null);

  const { solidMaterials: availableSolidMaterials, liquidMaterials: availableLiquidMaterials } =
    useMemo(
      () => buildSheetDerivedMaterialLists(identificationSheet?.materials ?? []),
      [identificationSheet],
    );
  const loadingMaterials = false;
  const [completedPremixesByBatch, setCompletedPremixesByBatch] = useState<
    Record<string, number[]>
  >({});
  const [premixSessionsByBatch, setPremixSessionsByBatch] = useState<
    Record<string, Record<string, PremixSession>>
  >({});
  const [addedPremixSelectionsByBatch, setAddedPremixSelectionsByBatch] = useState<
    Record<string, AddedPremixSelection[]>
  >({});
  const [weightmentSheetByBatch, setWeightmentSheetByBatch] = useState<
    Record<string, RawMaterialPrepWeightmentSheet>
  >({});
  const [premixStatusByNoByBatch, setPremixStatusByNoByBatch] = useState<
    Record<string, Record<number, PremixStatusMeta>>
  >({});
  /** sessionKey:slot → field path errors (red under process fields). */
  const [premixFieldErrorsByBatch, setPremixFieldErrorsByBatch] = useState<
    Record<string, Record<string, Record<string, string>>>
  >({});
  const [weightmentErrorsByBatch, setWeightmentErrorsByBatch] = useState<
    Record<string, Record<string, string>>
  >({});
  const [validationAttempt, setValidationAttempt] = useState<ValidationAttemptFlags>({
    format: false,
    unit: false,
    submit: false,
  });
  const [validationFocusRequest, setValidationFocusRequest] = useState<{
    id: number;
    target: RmpValidationFocusTarget | null;
  } | null>(null);
  const [previousStageGate, setPreviousStageGate] =
    useState<PreviousStageApprovedUnits | null>(null);

  const notifyRmpValidationErrors = useCallback(
    (
      premixFieldErrors: Record<string, Record<string, string>>,
      weightmentErrors: Record<string, string>,
    ) => {
      const firstError = firstRmpValidationErrorMessage(premixFieldErrors, weightmentErrors);
      const base = STRINGS.MANUFACTURING.RAW_MATERIAL_PREP.VALIDATION.validationFailedSnackbar;
      showValidationAlert(firstError ? `${base} (${firstError})` : base);
    },
    [showValidationAlert],
  );

  const [initialSnapshot, setInitialSnapshot] = useState("{}");

  const premixMaterialOptions = useMemo<PremixMaterialOption[]>(
    () => buildPremixMaterialOptions(identificationSheet?.materials ?? []),
    [identificationSheet],
  );

  const allMaterials = useMemo(
    () => mergeMaterialsLists(availableSolidMaterials, availableLiquidMaterials),
    [availableSolidMaterials, availableLiquidMaterials],
  );

  const activeBatchId = activeBatch?.batchId ?? "";
  const activeFormBatchKey = activeBatchId || "__form__";
  const activeAddedPremixSelections = useMemo(
    () => addedPremixSelectionsByBatch[activeFormBatchKey] ?? [],
    [addedPremixSelectionsByBatch, activeFormBatchKey],
  );

  useEffect(() => {
    if (view !== "form" || !identificationSheet || numberOfPremix < 1) return;

    setAddedPremixSelectionsByBatch((prev) => {
      const current = prev[activeFormBatchKey] ?? [];
      const next = mergePremixMaterialSelections(
        current,
        identificationSheet,
        numberOfPremix,
        availableSolidMaterials,
        availableLiquidMaterials,
      );
      if (JSON.stringify(current) === JSON.stringify(next)) return prev;
      return { ...prev, [activeFormBatchKey]: next };
    });
  }, [
    view,
    activeFormBatchKey,
    identificationSheet,
    numberOfPremix,
    availableSolidMaterials,
    availableLiquidMaterials,
  ]);

  useEffect(() => {
    if (view !== "form" || skipSessionRebuildRef.current) return;

    const selections = addedPremixSelectionsByBatch[activeFormBatchKey] ?? [];
    if (selections.length === 0) return;

    setPremixSessionsByBatch((prev) => {
      const current = normalizePremixSessionKeys(prev[activeFormBatchKey] ?? {});
      const next = normalizePremixSessionKeys(
        buildPremixMaterialSessionsFromSelections(
          selections,
          availableSolidMaterials,
          current,
          availableLiquidMaterials,
        ),
      );
      if (JSON.stringify(current) === JSON.stringify(next)) return prev;
      return { ...prev, [activeFormBatchKey]: next };
    });
  }, [
    view,
    activeFormBatchKey,
    addedPremixSelectionsByBatch,
    availableSolidMaterials,
    availableLiquidMaterials,
  ]);

  const completedPremixes = useMemo(
    () => completedPremixesByBatch[activeBatchId] ?? [],
    [completedPremixesByBatch, activeBatchId],
  );

  const premixSessions = useMemo(
    () => premixSessionsByBatch[activeFormBatchKey] ?? {},
    [premixSessionsByBatch, activeFormBatchKey],
  );
  const addedPremixSelections = useMemo(
    () => addedPremixSelectionsByBatch[activeFormBatchKey] ?? [],
    [addedPremixSelectionsByBatch, activeFormBatchKey],
  );
  const weightmentSheet = useMemo(
    () => weightmentSheetByBatch[activeFormBatchKey] ?? createEmptyWeightmentSheet(),
    [weightmentSheetByBatch, activeFormBatchKey],
  );
  const premixStatusByNo = useMemo(
    () => premixStatusByNoByBatch[activeFormBatchKey] ?? {},
    [premixStatusByNoByBatch, activeFormBatchKey],
  );
  const premixFieldErrors = useMemo(
    () => premixFieldErrorsByBatch[activeFormBatchKey] ?? {},
    [premixFieldErrorsByBatch, activeFormBatchKey],
  );
  const weightmentErrors = useMemo(
    () => weightmentErrorsByBatch[activeFormBatchKey] ?? {},
    [weightmentErrorsByBatch, activeFormBatchKey],
  );

  const getPremixStatus = useCallback(
    (premixNo: number): PremixSubmissionStatus =>
      premixStatusByNo[premixNo]?.premixSubmissionStatus ?? "TO_BE_INITIATED",
    [premixStatusByNo],
  );

  const orderedPremixNos = useMemo(
    () => Array.from({ length: numberOfPremix }, (_, index) => index + 1),
    [numberOfPremix],
  );

  const checkPremixEditable = useCallback(
    (premixNo: number): boolean => {
      if (!isPremixEditable(getPremixStatus(premixNo))) return false;
      if (activeBatch && usesParallelUnitLocks(activeBatch)) {
        const unit = findPremixUnit(
          getActiveStage(activeBatch, subDepartmentId ?? SUB_DEPT.RMP),
          premixNo,
        );
        if (isPremixDisabled(unit)) return false;
      }
      return true;
    },
    [activeBatch, getPremixStatus, subDepartmentId],
  );

  const premixGroups = useMemo(
    () => groupPremixSelectionsByPremix(addedPremixSelections),
    [addedPremixSelections],
  );

  const allPremixesHaveMaterial = useMemo(
    () =>
      addedPremixSelections.length > 0 &&
      addedPremixSelections.every((entry) => {
        const hasMaterial = Boolean(entry.solidMaterialCode) || Boolean(entry.liquidMaterialCode);
        if (!hasMaterial) return false;

        // AP grades are managed via apGradeSlots — top-level solidGradeCode is optional.
        if (isApRmpFormTemplate(entry.solidRmpFormTemplate)) return true;

        if (
          entry.solidMaterialCode &&
          materialRequiresGradeSelection(availableSolidMaterials, entry.solidMaterialCode)
        ) {
          return Boolean(entry.solidGradeCode);
        }

        return true;
      }),
    [addedPremixSelections, availableSolidMaterials],
  );

  const markPremixComplete = useCallback((batchId: string, premix: number) => {
    if (!batchId || !premix) return;
    setCompletedPremixesByBatch((prev) => {
      const existing = prev[batchId] ?? [];
      if (existing.includes(premix)) return prev;
      return { ...prev, [batchId]: [...existing, premix].sort((a, b) => a - b) };
    });
  }, []);

  const formSnapshot = useMemo(
    () =>
      JSON.stringify({
        addedPremixSelections,
        premixSessions,
        weightmentSheet,
      }),
    [addedPremixSelections, premixSessions, weightmentSheet],
  );

  const premixCardsHaveData = useMemo(
    () =>
      addedPremixSelections.some((entry) => {
        const session =
          premixSessions[getPremixMaterialSessionKey(entry.premix, entry.materialKey)];
        return session ? isSessionFilled(session) : false;
      }),
    [addedPremixSelections, premixSessions],
  );

  const allPremixProcessReady = useMemo(
    () =>
      addedPremixSelections.length > 0 &&
      addedPremixSelections.every((entry) => {
        const hasMaterial = Boolean(entry.solidMaterialCode) || Boolean(entry.liquidMaterialCode);
        if (!hasMaterial) return false;

        const session =
          premixSessions[getPremixMaterialSessionKey(entry.premix, entry.materialKey)];
        if (!session) return false;
        return isPremixSelectionProcessReady(entry, session, weightmentSheet);
      }),
    [addedPremixSelections, premixSessions, weightmentSheet],
  );

  const isFormDirty = useMemo(
    () => view === "form" && formSnapshot !== initialSnapshot,
    [view, formSnapshot, initialSnapshot],
  );

  const snapshotStateRef = useRef({ addedPremixSelections, premixSessions, weightmentSheet });
  snapshotStateRef.current = { addedPremixSelections, premixSessions, weightmentSheet };
  const initialSnapshotRef = useRef(initialSnapshot);
  initialSnapshotRef.current = initialSnapshot;

  const resetFormContext = useCallback(() => {
    setView("list");
    setActiveBatch(null);
    setIsEditMode(false);
    setLoadingFormDetails(false);
    setActionLoading(false);
    setBackConfirmOpen(false);
    setHasSavedDraft(false);
    setNumberOfPremix(0);
    setIdentificationSheet(null);
    setAddedPremixSelectionsByBatch({});
    setPremixSessionsByBatch({});
    setCompletedPremixesByBatch({});
    setWeightmentSheetByBatch({});
    setPremixStatusByNoByBatch({});
    setPremixFieldErrorsByBatch({});
    setWeightmentErrorsByBatch({});
    setValidationAttempt({ format: false, unit: false, submit: false });
    setPreviousStageGate(null);
    setInitialSnapshot(
      JSON.stringify({
        addedPremixSelections: [],
        premixSessions: {},
        weightmentSheet: createEmptyWeightmentSheet(),
      }),
    );
  }, []);

  const getErrorMessage = (response: any, fallbackMessage: string) => {
    if (response?.error?.details) return response.error.details;
    if (response?.message) return response.message;
    return fallbackMessage;
  };

  const mergePremixSelectionsWithSheet = (
    selections: AddedPremixSelection[],
    sheet: IdentificationSheet,
    premixCount: number,
    solidMaterials: RawMaterialPrepMaterialOption[],
    liquidMaterials: RawMaterialPrepMaterialOption[],
  ) =>
    mergePremixMaterialSelections(selections, sheet, premixCount, solidMaterials, liquidMaterials);

  const openFormWithResolvedData = useCallback(
    async (
      batch: RawMaterialPrepBatch,
      editMode: boolean,
      options?: { silent?: boolean; preserveLocalSessions?: Record<string, PremixSession> },
    ) => {
      if (!batch.batchId) {
        showAlert(STRINGS.MANUFACTURING.RAW_MATERIAL_PREP.BATCH_ID_MISSING, "error");
        return;
      }

      const silent = Boolean(options?.silent);
      const preserveLocalSessions = options?.preserveLocalSessions ?? {};
      if (!silent) setLoadingFormDetails(true);

      try {
        const batchDetails = await batchManagementController.getBatchById(batch.batchId);
        const enrichedBatch = enrichRmpBatchFromDetails(batch, batchDetails);
        if (!enrichedBatch) {
          showAlert(STRINGS.MANUFACTURING.RAW_MATERIAL_PREP.DETAILS_FETCH_ERROR, "error");
          return;
        }

        setPreviousStageGate(
          resolvePreviousStageApprovedUnits({
            stageProgress: enrichedBatch.stageProgress,
            currentStage: enrichedBatch.currentStage,
            currentSlug: "raw-material-prep",
            currentSubDepartmentId: subDepartmentId,
            subDepartments: user?.allSubDepartments,
          }),
        );

        const sheet = (batchDetails?.identificationSheet ?? null) as IdentificationSheet | null;
        const premixCount = Number(sheet?.numberOfPremix) || 0;

        if (!sheet || premixCount < 1) {
          showAlert(
            "Identification sheet is missing or has no premix count for this batch.",
            "error",
          );
          return;
        }

        const batchKey = batch.batchId || "__form__";
        const { solidMaterials: resolvedSolidMaterials, liquidMaterials: resolvedLiquidMaterials } =
          buildSheetDerivedMaterialLists(sheet.materials ?? []);

        let nextBatch = enrichedBatch;
        let nextAddedPremixSelections: AddedPremixSelection[] = [];
        let nextPremixSessions: Record<string, PremixSession> = {};
        let nextWeightmentSheet = createEmptyWeightmentSheet();
        let nextPremixStatusByNo: Record<number, PremixStatusMeta> = {};
        for (let i = 1; i <= premixCount; i++) {
          nextPremixStatusByNo[i] = { premixSubmissionStatus: "TO_BE_INITIATED" };
        }

        const status = batch.rmStatus ?? batch.status;
        // Silent refresh after save must always hit form/details (even if list status
        // is still TO_BE_INITIATED right after the first create).
        const shouldFetchFormDetails =
          silent ||
          editMode ||
          isManufacturingContinueFillingStatus(String(status ?? "")) ||
          Boolean(resolveRmpFormId(batch));

        if (shouldFetchFormDetails) {
          const formId = resolveRmpFormId(batch);
          if (!formId) {
            showAlert(STRINGS.MANUFACTURING.RAW_MATERIAL_PREP.FORM_ID_MISSING, "error");
            return;
          }

          const detailsResponse = await rawMaterialPreparationController.fetchFormDetails({
            formId,
          });

          if (!detailsResponse?.success || !detailsResponse?.data) {
            const fallback =
              detailsResponse?.statusCode === 404
                ? STRINGS.MANUFACTURING.RAW_MATERIAL_PREP.DETAILS_NOT_FOUND
                : STRINGS.MANUFACTURING.RAW_MATERIAL_PREP.DETAILS_FETCH_ERROR;
            showAlert(getErrorMessage(detailsResponse, fallback), "error");
            return;
          }

          const details = detailsResponse.data;
          nextBatch = {
            ...enrichedBatch,
            formId: details.formId || formId,
            batchType: batch.batchType ?? details.batchType ?? enrichedBatch.batchType,
          };
          if (details.status) {
            nextBatch.rmStatus = String(details.status);
            nextBatch.status = String(details.status);
          }
          const mapped = mapPreparationDetailsFromApi(
            details,
            sheet,
            premixCount,
            resolvedSolidMaterials as MaterialsListItem[],
            resolvedLiquidMaterials as MaterialsListItem[],
          );
          nextAddedPremixSelections = mergePremixSelectionsWithSheet(
            mapped.addedPremixSelections,
            sheet,
            premixCount,
            resolvedSolidMaterials,
            resolvedLiquidMaterials,
          );
          nextPremixSessions = mapped.premixSessions;
          nextWeightmentSheet = mapped.weightmentSheet;
          nextPremixStatusByNo = mapped.premixStatusByNo;
        } else {
          nextAddedPremixSelections = buildPremixMaterialSelectionsFromSheet(
            sheet,
            premixCount,
            resolvedSolidMaterials,
            resolvedLiquidMaterials,
          );
          const weightmentFromBatch = sheet.metadata?.rawMaterialPreparation?.weightmentSheet;
          if (weightmentFromBatch) {
            // New form: seed rows from batch metadata, but never auto-enable compare.
            nextWeightmentSheet = {
              ...mapWeightmentSheetFromApi(weightmentFromBatch),
              validation: {
                ...createEmptyWeightmentSheet().validation,
              },
            };
          }
        }

        nextPremixSessions = normalizePremixSessionKeys(
          buildPremixMaterialSessionsFromSelections(
            nextAddedPremixSelections,
            resolvedSolidMaterials,
            normalizePremixSessionKeys(nextPremixSessions),
            resolvedLiquidMaterials,
          ),
        );

        if (silent && Object.keys(preserveLocalSessions).length > 0) {
          nextPremixSessions = mergePremixSessionsPreservingLocalInput(
            preserveLocalSessions,
            nextPremixSessions,
          );
        }

        const snapshot = JSON.stringify({
          addedPremixSelections: nextAddedPremixSelections,
          premixSessions: nextPremixSessions,
          weightmentSheet: nextWeightmentSheet,
        });

        skipSessionRebuildRef.current = true;
        setActiveBatch(nextBatch);
        setIsEditMode(editMode);
        setNumberOfPremix(premixCount);
        setIdentificationSheet(sheet);
        setAddedPremixSelectionsByBatch((prev) => ({
          ...prev,
          [batchKey]: nextAddedPremixSelections,
        }));
        setPremixSessionsByBatch((prev) => ({
          ...prev,
          [batchKey]: nextPremixSessions,
        }));
        setWeightmentSheetByBatch((prev) => ({
          ...prev,
          [batchKey]: nextWeightmentSheet,
        }));
        setPremixStatusByNoByBatch((prev) => ({
          ...prev,
          [batchKey]: nextPremixStatusByNo,
        }));
        setInitialSnapshot(snapshot);
        setView("form");
        if (silent) {
          setFormHydrationKey((value) => value + 1);
        }
        window.setTimeout(() => {
          skipSessionRebuildRef.current = false;
        }, 0);
      } finally {
        if (!silent) setLoadingFormDetails(false);
      }
    },
    [showAlert, subDepartmentId, user?.allSubDepartments],
  );

  const handleFillForm = useCallback(
    async (batch: RawMaterialPrepBatch) => await openFormWithResolvedData(batch, false),
    [openFormWithResolvedData],
  );

  const handleEditForm = useCallback(
    async (batch: RawMaterialPrepBatch) => await openFormWithResolvedData(batch, true),
    [openFormWithResolvedData],
  );

  const handleViewDetails = useCallback(
    async (row: RawMaterialPrepBatch) => {
      if (!row.formId) {
        showAlert("Form ID missing", "error");
        return;
      }

      setDetailsLoading(true);

      const response = await rawMaterialPreparationController.fetchFormDetails({
        formId: row.formId,
      });

      setDetailsLoading(false);

      if (!response?.success || !response?.data) {
        showAlert(
          response?.message || STRINGS.MANUFACTURING.RAW_MATERIAL_PREP.DETAILS_FETCH_ERROR,
          "error",
        );
        return;
      }

      setDetailsRow(row);
      setDetailsData(response.data);
      setView("details");
    },
    [showAlert],
  );

  const handleBackFromDetails = useCallback(() => {
    setDetailsRow(null);
    setDetailsData(null);
    setView("list");
    bumpBatchRefresh();
  }, [bumpBatchRefresh]);

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

  const handlePremixSlotChange = useCallback(
    (
      premix: number,
      materialKey: string,
      slot: "solid" | "liquid",
      nextSlot: PremixSession["solid"],
    ) => {
      if (!premix || !materialKey) return;
      const sessionKey = getPremixMaterialSessionKey(premix, materialKey);
      const errorKey = `${sessionKey}:${slot}`;
      const isolatedSlot: PremixSession["solid"] = {
        ...nextSlot,
        processForm: cloneValue(nextSlot.processForm),
      };

      setPremixSessionsByBatch((prev) => {
        const batchSessions = prev[activeFormBatchKey] ?? {};
        const current = normalizePremixSession(batchSessions[sessionKey]);
        return {
          ...prev,
          [activeFormBatchKey]: {
            ...batchSessions,
            [sessionKey]: {
              ...current,
              [slot]: isolatedSlot,
            },
          },
        };
      });

      if (checkPremixEditable(premix)) {
        setValidationAttempt((prev) => ({ ...prev, format: true }));
        const selection = addedPremixSelections.find(
          (entry) => entry.premix === premix && entry.materialKey === materialKey,
        );
        if (selection) {
          const errs = validateRmpPremixSlotLive({
            selection,
            slot,
            processForm: isolatedSlot.processForm,
            attempt: validationAttempt,
          });
          setPremixFieldErrorsByBatch((prev) => {
            const batchErrors = { ...(prev[activeFormBatchKey] ?? {}) };
            if (Object.keys(errs).length === 0) {
              delete batchErrors[errorKey];
            } else {
              batchErrors[errorKey] = errs;
            }
            return { ...prev, [activeFormBatchKey]: batchErrors };
          });
        }
      }

      if (!checkPremixEditable(premix)) return;
      const session = premixSessions[sessionKey];
      if (session && isSessionFilled({ ...session, [slot]: isolatedSlot })) {
        markPremixComplete(activeBatchId, premix);
      }
    },
    [
      activeFormBatchKey,
      activeBatchId,
      addedPremixSelections,
      checkPremixEditable,
      markPremixComplete,
      premixSessions,
      validationAttempt,
    ],
  );

  const handleApGradeSlotsChange = useCallback(
    (
      premix: number,
      materialKey: string,
      cards: Array<{ gradeCode: string; slot: PremixSession["solid"] }>,
    ) => {
      if (!premix || !materialKey) return;
      const sessionKey = getPremixMaterialSessionKey(premix, materialKey);
      const errorKey = `${sessionKey}:solid`;
      setPremixSessionsByBatch((prev) => {
        const batchSessions = prev[activeFormBatchKey] ?? {};
        const current = normalizePremixSession(batchSessions[sessionKey]);
        const first = cards[0];
        return {
          ...prev,
          [activeFormBatchKey]: {
            ...batchSessions,
            [sessionKey]: {
              ...current,
              // Always set (including []) so the host does not re-seed from solidGradeCode.
              apGradeSlots: cards.map((card) => ({
                gradeCode: card.gradeCode,
                slot: {
                  ...card.slot,
                  processForm: cloneValue(card.slot.processForm),
                },
              })),
              solid: first
                ? {
                    ...first.slot,
                    processForm: cloneValue(first.slot.processForm),
                  }
                : normalizeMaterialProcessSlot(
                    "solid",
                    current.solidMaterialCode,
                    null,
                    "",
                    current.solidRmpFormTemplate,
                  ),
              solidGradeCode: first?.gradeCode ?? "",
            },
          },
        };
      });

      if (checkPremixEditable(premix)) {
        setValidationAttempt((prev) => ({ ...prev, format: true }));
        const selection = addedPremixSelections.find(
          (entry) => entry.premix === premix && entry.materialKey === materialKey,
        );
        if (selection) {
          const errs = validateRmpApGradeCardsLive({
            selection,
            cards,
            attempt: validationAttempt,
          });
          setPremixFieldErrorsByBatch((prev) => {
            const batchErrors = { ...(prev[activeFormBatchKey] ?? {}) };
            if (Object.keys(errs).length === 0) {
              delete batchErrors[errorKey];
            } else {
              batchErrors[errorKey] = errs;
            }
            return { ...prev, [activeFormBatchKey]: batchErrors };
          });
        }
      }
    },
    [
      activeFormBatchKey,
      addedPremixSelections,
      checkPremixEditable,
      validationAttempt,
    ],
  );

  const handleWeightmentSheetChange = useCallback(
    (
      nextSheet:
        | RawMaterialPrepWeightmentSheet
        | ((prev: RawMaterialPrepWeightmentSheet) => RawMaterialPrepWeightmentSheet),
    ) => {
      const current = weightmentSheet;
      const next = typeof nextSheet === "function" ? nextSheet(current) : nextSheet;
      setWeightmentSheetByBatch((prev) => ({
        ...prev,
        [activeFormBatchKey]: next,
      }));
      setValidationAttempt((flags) => ({ ...flags, format: true }));
      const premixNo = validationContextPremixRef.current;
      const selections =
        premixNo != null
          ? addedPremixSelections.filter((entry) => entry.premix === premixNo)
          : addedPremixSelections;
      setWeightmentErrorsByBatch((prev) => ({
        ...prev,
        [activeFormBatchKey]: validateWeightmentErrorsLive(
          next,
          selections,
          identificationSheet?.materials ?? [],
          validationAttempt,
        ),
      }));
    },
    [
      activeFormBatchKey,
      addedPremixSelections,
      identificationSheet?.materials,
      validationAttempt,
      weightmentSheet,
    ],
  );

  const submitPremix = useCallback(
    async (premixNo: number, intent: "draft" | "submit") => {
      if (!activeBatch) return false;

      if (!subDepartmentId) {
        showAlert(STRINGS.MANUFACTURING.RAW_MATERIAL_PREP.SUB_DEPARTMENT_MISSING, "error");
        return false;
      }

      if (
        !isPremixEnabledForWorkflowWithBatch(
          activeBatch,
          subDepartmentId ?? SUB_DEPT.RMP,
          premixNo,
          orderedPremixNos,
          previousStageGate,
          (no) => getPremixStatus(Number(no)),
        )
      ) {
        showAlert(STRINGS.MANUFACTURING.NOT_YET_UNLOCKED, "warning");
        return false;
      }

      if (!checkPremixEditable(premixNo)) {
        return false;
      }

      const isDraft = intent === "draft";
      const sessionsForPayload = premixSessions;
      validationContextPremixRef.current = premixNo;

      const emitValidationFocus = (
        premixFieldErrors: Record<string, Record<string, string>>,
        weightmentErrors: Record<string, string>,
      ) => {
        const focus = resolveFirstRmpValidationFocus(
          premixNo,
          addedPremixSelections,
          premixFieldErrors,
          weightmentErrors,
          weightmentSheet,
        );
        setValidationFocusRequest((prev) => ({
          id: (prev?.id ?? 0) + 1,
          target: focus,
        }));
        requestAnimationFrame(() => {
          notifyRmpValidationErrors(premixFieldErrors, weightmentErrors);
        });
      };

      setValidationAttempt({
        format: true,
        unit: isDraft,
        submit: !isDraft,
      });

      // Draft save: no required-field validation (lots / weighment / process optional).
      if (isDraft) {
        setPremixFieldErrorsByBatch((prev) => ({
          ...prev,
          [activeFormBatchKey]: {},
        }));
        setWeightmentErrorsByBatch((prev) => ({
          ...prev,
          [activeFormBatchKey]: {},
        }));
      }

      if (!isDraft) {
        const premixSelections = addedPremixSelections.filter((entry) => entry.premix === premixNo);

        if (premixSelections.length === 0) {
          showAlert(STRINGS.MANUFACTURING.RAW_MATERIAL_PREP.SELECT_AT_LEAST_ONE, "warning");
          return false;
        }

        const premixHasMaterial = premixSelections.every((entry) => {
          const hasMaterial = Boolean(entry.solidMaterialCode) || Boolean(entry.liquidMaterialCode);
          if (!hasMaterial) return false;
          // AP grades live on apGradeSlots; do not block submit on empty solidGradeCode.
          if (isApRmpFormTemplate(entry.solidRmpFormTemplate)) return true;
          if (
            entry.solidMaterialCode &&
            materialRequiresGradeSelection(availableSolidMaterials, entry.solidMaterialCode)
          ) {
            return Boolean(entry.solidGradeCode);
          }
          return true;
        });

        if (!premixHasMaterial) {
          showAlert(STRINGS.MANUFACTURING.RAW_MATERIAL_PREP.MATERIAL_GRADE_REQUIRED, "warning");
          return false;
        }

        // Lots + weighment — snackbar + focus
        {
          const validationResult = validateRawMaterialPreparation(
            {
              premixNo,
              addedPremixSelections,
              premixSessions: sessionsForPayload,
              weightmentSheet,
              identificationSheetMaterials: identificationSheet?.materials ?? [],
            },
            "SUBMIT",
          );
          setPremixFieldErrorsByBatch((prev) => ({
            ...prev,
            [activeFormBatchKey]: validationResult.premixFieldErrors,
          }));
          setWeightmentErrorsByBatch((prev) => ({
            ...prev,
            [activeFormBatchKey]: validationResult.weightmentErrors,
          }));

          const hasPremixFieldErrors =
            Object.keys(validationResult.premixFieldErrors).length > 0;
          const hasWeightmentFieldErrors = hasValidationErrors(validationResult.weightmentErrors);

          if (hasPremixFieldErrors || hasWeightmentFieldErrors) {
            emitValidationFocus(
              validationResult.premixFieldErrors,
              validationResult.weightmentErrors,
            );
            return false;
          }
        }

        const identificationError = getWeightmentIdentificationError(
          weightmentSheet,
          identificationSheet?.materials ?? [],
        );

        if (identificationError) {
          showAlert(identificationError, "warning");
          return false;
        }
      }

      const isCreateFlow = !resolveRmpFormId(activeBatch);
      // Premix type follows Save Draft / Submit Premix.
      // Form stays DRAFT until "Proceed for Approval" (final approval).
      const premixSubmissionType = isDraft ? "DRAFT" : "SUBMIT";
      const formSubmissionType = "DRAFT" as const;

      let payloadBody: ReturnType<typeof mapPreparationDetailsPayload>;
      try {
        payloadBody = mapPreparationDetailsPayload({
          addedPremixSelections,
          premixSessions: sessionsForPayload,
          solidMaterials: availableSolidMaterials as MaterialsListItem[],
          liquidMaterials: availableLiquidMaterials as MaterialsListItem[],
          weightmentSheet,
          targetPremixNos: [premixNo],
          premixSubmissionType,
          includeEmptyPremixes: true,
        });
      } catch (error) {
        showAlert(
          error instanceof Error
            ? error.message
            : STRINGS.MANUFACTURING.RAW_MATERIAL_PREP.VALIDATION.validationFailedSnackbar,
          "warning",
        );
        return false;
      }

      setActionLoading(true);
      try {
        let response: any;

        if (isCreateFlow) {
          if (!activeBatch.batchId) {
            showAlert(STRINGS.MANUFACTURING.RAW_MATERIAL_PREP.BATCH_ID_MISSING, "error");
            return false;
          }

          response = await rawMaterialPreparationController.createForm({
            batchId: activeBatch.batchId,
            subDepartmentId,
            formSubmissionType,
            ...payloadBody,
          });
        } else {
          if (!activeBatch.formId) {
            showAlert(STRINGS.MANUFACTURING.RAW_MATERIAL_PREP.FORM_ID_MISSING, "error");
            return false;
          }

          response = await rawMaterialPreparationController.updateForm({
            formId: activeBatch.formId,
            formSubmissionType,
            ...payloadBody,
          });
        }

        if (!response?.success) {
          const fallback = isCreateFlow
            ? STRINGS.MANUFACTURING.RAW_MATERIAL_PREP.CREATE_FAILED
            : STRINGS.MANUFACTURING.RAW_MATERIAL_PREP.UPDATE_FAILED;
          showAlert(getErrorMessage(response, fallback), "error");
          return false;
        }

        const nextFormId = String(response.data?.formId ?? activeBatch.formId ?? "").trim();
        const refreshedBatch: RawMaterialPrepBatch = {
          ...activeBatch,
          formId: nextFormId || activeBatch.formId,
          rmStatus: response.data?.status ?? activeBatch.rmStatus,
          status: response.data?.status ?? activeBatch.status,
        };

        setActiveBatch(refreshedBatch);
        if (isDraft) {
          setHasSavedDraft(true);
        }

        showAlert(
          isDraft
            ? STRINGS.MANUFACTURING.RAW_MATERIAL_PREP.PREMIX_SAVE_DRAFT_SUCCESS(premixNo)
            : STRINGS.MANUFACTURING.RAW_MATERIAL_PREP.PREMIX_SUBMIT_SUCCESS(premixNo),
          "success",
          { autoCloseMs: 2200 },
        );

        await listParams.refreshUserBatches();
        let batchForRefresh = refreshedBatch;
        if (activeBatch.batchId) {
          const stageFields = await fetchEnrichedBatchStageFields(activeBatch.batchId);
          if (stageFields) {
            batchForRefresh = mergeBatchStageFields(refreshedBatch, stageFields);
            setActiveBatch((prev) => (prev ? mergeBatchStageFields(prev, stageFields) : prev));
            setPreviousStageGate(
              resolvePreviousStageApprovedUnits({
                stageProgress: stageFields.stageProgress ?? activeBatch.stageProgress,
                currentStage: stageFields.currentStage ?? activeBatch.currentStage,
                currentSlug: "raw-material-prep",
                currentSubDepartmentId: subDepartmentId,
                subDepartments: user?.allSubDepartments,
              }),
            );
          }
        }
        bumpBatchRefresh();

        if (nextFormId) {
          const statusForBanner = String(
            response.data?.status ?? activeBatch.rmStatus ?? activeBatch.status ?? "",
          )
            .trim()
            .toUpperCase()
            .replace(/\s+/g, "_");
          const stillRejectedEdit = statusForBanner === "REJECTED";

          await openFormWithResolvedData(batchForRefresh, stillRejectedEdit, {
            silent: true,
            preserveLocalSessions: premixSessionsByBatch[activeFormBatchKey] ?? {},
          });
        } else {
          setInitialSnapshot(formSnapshot);
        }

        return true;
      } catch (error) {
        const handled = await handleBatchInvalidState(
          error,
          async () => {
            await listParams.refreshUserBatches();
            const batchSnapshot = activeBatch;
            if (batchSnapshot?.batchId) {
              const stageFields = await fetchEnrichedBatchStageFields(batchSnapshot.batchId);
              if (stageFields) {
                setActiveBatch((prev) => (prev ? mergeBatchStageFields(prev, stageFields) : prev));
                setPreviousStageGate(
                  resolvePreviousStageApprovedUnits({
                    stageProgress: stageFields.stageProgress ?? batchSnapshot.stageProgress,
                    currentStage: stageFields.currentStage ?? batchSnapshot.currentStage,
                    currentSlug: "raw-material-prep",
                    currentSubDepartmentId: subDepartmentId,
                    subDepartments: user?.allSubDepartments,
                  }),
                );
              }
            }
            if (batchSnapshot) {
              await openFormWithResolvedData(batchSnapshot, isEditMode, {
                silent: true,
                preserveLocalSessions: premixSessionsByBatch[activeFormBatchKey] ?? {},
              });
            }
            bumpBatchRefresh();
          },
          showAlert,
        );
        if (handled) return false;
        showAlert(
          getErrorMessage(error, STRINGS.MANUFACTURING.RAW_MATERIAL_PREP.UPDATE_FAILED),
          "error",
        );
        return false;
      } finally {
        setActionLoading(false);
      }
    },
    [
      activeBatch,
      activeFormBatchKey,
      addedPremixSelections,
      availableLiquidMaterials,
      availableSolidMaterials,
      bumpBatchRefresh,
      checkPremixEditable,
      formSnapshot,
      getPremixStatus,
      identificationSheet,
      isEditMode,
      listParams,
      notifyRmpValidationErrors,
      openFormWithResolvedData,
      orderedPremixNos,
      premixSessions,
      premixSessionsByBatch,
      previousStageGate,
      showAlert,
      subDepartmentId,
      user?.allSubDepartments,
      weightmentSheet,
    ],
  );

  const handleSavePremixDraft = useCallback(
    async (premixNo: number) => submitPremix(premixNo, "draft"),
    [submitPremix],
  );

  const handleSubmitPremix = useCallback(
    async (premixNo: number) => submitPremix(premixNo, "submit"),
    [submitPremix],
  );

  const handleSubmitForFinalApproval = useCallback(async () => {
    if (!activeBatch?.formId) {
      showAlert(STRINGS.MANUFACTURING.RAW_MATERIAL_PREP.FORM_ID_MISSING, "error");
      return false;
    }

    const statuses = premixStatusByNoByBatch[activeFormBatchKey] ?? {};
    const total = Math.max(numberOfPremix, Object.keys(statuses).length);
    const allApproved =
      total > 0 &&
      Array.from({ length: total }, (_, index) => index + 1).every(
        (premixNo) =>
          String(statuses[premixNo]?.premixSubmissionStatus ?? "").toUpperCase() === "APPROVED",
      );

    if (!allApproved) {
      showAlert(STRINGS.MANUFACTURING.RAW_MATERIAL_PREP.FINAL_APPROVAL_NOT_READY, "warning");
      return false;
    }

    setActionLoading(true);
    try {
      // Rebuild from saved form details so solid/liquid processes are not dropped
      // when local sessions never hydrated schemas for locked/unvisited materials.
      const detailsResponse = await rawMaterialPreparationController.fetchFormDetails({
        formId: activeBatch.formId,
      });

      if (!detailsResponse?.success || !detailsResponse?.data) {
        showAlert(
          getErrorMessage(
            detailsResponse,
            STRINGS.MANUFACTURING.RAW_MATERIAL_PREP.DETAILS_FETCH_ERROR,
          ),
          "error",
        );
        return false;
      }

      const payloadBody = mapPreparationDetailsFromSavedForm(detailsResponse.data, {
        premixStatusByNo: statuses,
      });

      const response = await rawMaterialPreparationController.updateForm({
        formId: activeBatch.formId,
        formSubmissionType: "SUBMIT",
        ...payloadBody,
      });

      if (!response?.success) {
        showAlert(
          getErrorMessage(response, STRINGS.MANUFACTURING.RAW_MATERIAL_PREP.FINAL_APPROVAL_FAILED),
          "error",
        );
        return false;
      }

      showAlert(STRINGS.MANUFACTURING.RAW_MATERIAL_PREP.FINAL_APPROVAL_SUCCESS, "success", {
        autoCloseMs: 2200,
      });
      bumpBatchRefresh();
      resetFormContext();
      return true;
    } finally {
      setActionLoading(false);
    }
  }, [
    activeBatch,
    activeFormBatchKey,
    premixStatusByNoByBatch,
    numberOfPremix,
    showAlert,
    bumpBatchRefresh,
    resetFormContext,
  ]);

  const canSubmitPremix = useCallback(
    (premixNo: number): boolean => {
      if (!checkPremixEditable(premixNo)) return false;

      const premixSelections = addedPremixSelections.filter((entry) => entry.premix === premixNo);
      if (premixSelections.length === 0) return false;

      const premixHasMaterial = premixSelections.every((entry) => {
        const hasMaterial = Boolean(entry.solidMaterialCode) || Boolean(entry.liquidMaterialCode);
        if (!hasMaterial) return false;
        if (isApRmpFormTemplate(entry.solidRmpFormTemplate)) return true;
        if (
          entry.solidMaterialCode &&
          materialRequiresGradeSelection(availableSolidMaterials, entry.solidMaterialCode)
        ) {
          return Boolean(entry.solidGradeCode);
        }
        return true;
      });
      if (!premixHasMaterial) return false;

      const validationResult = validateRawMaterialPreparation(
        {
          premixNo,
          addedPremixSelections,
          premixSessions,
          weightmentSheet,
          identificationSheetMaterials: identificationSheet?.materials ?? [],
        },
        "SUBMIT",
      );

      const hasProcessFieldErrors = Object.values(validationResult.premixFieldErrors).some(
        (errs) => Object.keys(errs).length > 0,
      );
      if (hasProcessFieldErrors) return false;
      if (hasValidationErrors(validationResult.weightmentErrors)) return false;
      if (getWeightmentIdentificationError(weightmentSheet, identificationSheet?.materials ?? [])) {
        return false;
      }

      return true;
    },
    [
      checkPremixEditable,
      addedPremixSelections,
      availableSolidMaterials,
      premixSessions,
      weightmentSheet,
      identificationSheet,
    ],
  );

  return {
    ...listParams,
    loading: listParams.loading || loadingFormDetails,
    view,
    activeBatch,
    isEditMode,
    backConfirmOpen,
    isFormDirty,
    loadingFormDetails,
    actionLoading,
    numberOfPremix,
    identificationSheet,
    premixGroups,
    availableSolidMaterials: Array.isArray(availableSolidMaterials) ? availableSolidMaterials : [],
    availableLiquidMaterials: Array.isArray(availableLiquidMaterials)
      ? availableLiquidMaterials
      : [],
    allMaterials,
    loadingMaterials,
    completedPremixes,
    subDepartmentId,
    premixCardsHaveData,
    allPremixProcessReady,
    /** @deprecated Use allPremixProcessReady */
    allPremixSchemasReady: allPremixProcessReady,
    allPremixesHaveMaterial,
    setBackConfirmOpen,
    handlePremixSlotChange,
    handleApGradeSlotsChange,
    addedPremixSelections,
    premixSessions,
    weightmentSheet,
    handleWeightmentSheetChange,
    premixStatusByNo,
    isPremixEditable: checkPremixEditable,
    previousStageGate,
    handleFillForm,
    handleEditForm,
    handleBack,
    handleDiscardAndBack,
    handleSavePremixDraft,
    handleSubmitPremix,
    premixFieldErrors,
    validationAttempt,
    validationFocusRequest,
    weightmentErrors,
    canSubmitPremix,
    handleSubmitForFinalApproval,
    detailsRow,
    detailsData,
    detailsLoading,
    handleViewDetails,
    handleViewPreparationDetails: handleViewDetails,
    handleBackFromDetails,
    formHydrationKey,
  };
};

export default useRawMaterialPrepHook;
