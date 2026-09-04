// src/hooks/user/manufacturing/useRawMaterialPrepHook.ts

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { batchManagementController } from "../../../controllers/admin/BatchManagement/batchManagementController";
import { operationsController } from "../../../controllers/user/operationsController";
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
import { cloneValue, schemaValuesHaveUserData } from "../../../schema-engine/state/formState";
import {
  createEmptyPremixSchemaSession,
  createEmptyWeightmentSheet,
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
import {
  buildPremixMaterialOptions,
  buildPremixMaterialSelectionsFromSheet,
  buildPremixMaterialSessionsFromSelections,
  normalizePremixSessionKeys,
  getPremixMaterialSessionKey,
  groupPremixSelectionsByPremix,
  materialRequiresGradeSelection,
  mergeMaterialsLists,
  mergePremixMaterialSelections,
  normalizeMaterialsList,
  type PremixMaterialOption,
  type RawMaterialPrepMaterialOption,
} from "./rawMaterialPrepFlowConfig";
import schemaEngineController from "../../../schema-engine/controller/schemaEngineController";
import {
  buildRawMaterialSchemaRequest,
  buildRawMaterialSchemaRequestFromCodes,
  findGradeInMaterial,
  findMaterialInList,
  rawMaterialPrepSchemaFetchConfig,
} from "../../../schema-engine/adapters/rawMaterialPreparation.adapter";
import type { SchemaDocumentV2 } from "../../../schema-engine";
import { isSchemaDocumentReady } from "../../../schema-engine/utils/schemaMessages";
import { validateSchemaFormValues } from "@/data/models/user/schemaFormValidation";
import {
  getWeightmentIdentificationError,
  validateRawMaterialPreparation,
} from "@/data/validation/adapters/rawMaterialPreparation.validation";
import { hasValidationErrors } from "@/data/validation/validationErrors";
import type { ValidationAttemptFlags } from "@/ui/components/validation/useValidationDisplay";

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

  return {
    ...batch,
    batchType: batch.batchType ?? batchDetails.batchType ?? batch.batchType,
    material: batch.material ?? batchDetails.material ?? batch.material,
    identificationSheet: batchDetails.identificationSheet ?? batch.identificationSheet,
    stageProgress:
      (batchDetails as { stageProgress?: unknown }).stageProgress ?? batch.stageProgress,
    currentStage: (batchDetails as { currentStage?: unknown }).currentStage ?? batch.currentStage,
  };
};

const normalizePremixSession = (session?: Partial<PremixSession> | null): PremixSession => {
  const base = createEmptyPremixSchemaSession();
  if (!session) return base;

  return {
    ...base,
    ...session,
    selectedProcesses: {
      solid: Boolean(session.selectedProcesses?.solid),
      liquid: Boolean(session.selectedProcesses?.liquid),
    },
    solid: { ...base.solid, ...(session.solid ?? {}) },
    liquid: { ...base.liquid, ...(session.liquid ?? {}) },
  };
};

const isSessionFilled = (session: PremixSession) =>
  premixSessionHasData(normalizePremixSession(session));

const fetchPremixSlotSchema = async (
  entry: RawMaterialPrepPremixSelection,
  slot: "solid" | "liquid",
  materials: MaterialsListItem[],
  subDepartmentId: number,
): Promise<SchemaDocumentV2 | null> => {
  const materialCode = slot === "solid" ? entry.solidMaterialCode : entry.liquidMaterialCode;
  if (!materialCode) return null;

  const material = findMaterialInList(materials, materialCode);
  const materialId =
    material?.materialId ?? (slot === "solid" ? entry.solidMaterialId : entry.liquidMaterialId);
  if (!materialId || subDepartmentId <= 0) return null;

  const requestBody = material
    ? buildRawMaterialSchemaRequest({
        subDepartmentId,
        material,
        grade: slot === "solid" ? findGradeInMaterial(material, entry.solidGradeCode) : null,
      })
    : buildRawMaterialSchemaRequestFromCodes({
        subDepartmentId,
        materialId,
        materialCode,
        gradeId: slot === "solid" ? entry.solidGradeId : null,
        gradeCode: slot === "solid" ? entry.solidGradeCode || null : null,
      });

  const response = await schemaEngineController.fetchSchema(
    rawMaterialPrepSchemaFetchConfig,
    requestBody,
  );
  if (!response?.success || !isSchemaDocumentReady(response.data)) return null;
  return response.data;
};

const ensurePremixSchemasLoaded = async (
  premixNo: number,
  selections: RawMaterialPrepPremixSelection[],
  sessions: Record<string, PremixSession>,
  solidMaterials: MaterialsListItem[],
  liquidMaterials: MaterialsListItem[],
  subDepartmentId: number,
): Promise<Record<string, PremixSession>> => {
  const premixSelections = selections.filter((entry) => entry.premix === premixNo);
  if (premixSelections.length === 0) return sessions;

  const nextSessions = { ...sessions };
  const allMaterials = mergeMaterialsLists(solidMaterials, liquidMaterials) as MaterialsListItem[];

  for (const entry of premixSelections) {
    const sessionKey = getPremixMaterialSessionKey(entry.premix, entry.materialKey);
    const current = normalizePremixSession(nextSessions[sessionKey]);
    let nextSession = current;

    if (entry.selectedProcesses.solid && entry.solidMaterialCode && !current.solid.schema) {
      const schema = await fetchPremixSlotSchema(entry, "solid", allMaterials, subDepartmentId);
      if (schema) {
        nextSession = {
          ...nextSession,
          solid: {
            ...current.solid,
            schema,
            schemaLoading: false,
            schemaError: null,
          },
        };
      }
    }

    if (entry.selectedProcesses.liquid && entry.liquidMaterialCode && !nextSession.liquid.schema) {
      const schema = await fetchPremixSlotSchema(entry, "liquid", allMaterials, subDepartmentId);
      if (schema) {
        nextSession = {
          ...nextSession,
          liquid: {
            ...nextSession.liquid,
            schema,
            schemaLoading: false,
            schemaError: null,
          },
        };
      }
    }

    nextSessions[sessionKey] = nextSession;
  }

  return nextSessions;
};

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
      pendingSolidSections: session.pendingSolidSections?.length
        ? session.pendingSolidSections
        : prev.pendingSolidSections,
      pendingLiquidSections: session.pendingLiquidSections?.length
        ? session.pendingLiquidSections
        : prev.pendingLiquidSections,
      solid: {
        ...session.solid,
        schema: session.solid.schema ?? prev.solid.schema,
        schemaLoading:
          session.solid.schema || prev.solid.schema ? false : session.solid.schemaLoading,
        schemaError: session.solid.schemaError ?? prev.solid.schemaError,
        formValues: cloneValue(
          schemaValuesHaveUserData(session.solid.formValues)
            ? session.solid.formValues
            : prev.solid.formValues,
        ),
      },
      liquid: {
        ...session.liquid,
        schema: session.liquid.schema ?? prev.liquid.schema,
        schemaLoading:
          session.liquid.schema || prev.liquid.schema ? false : session.liquid.schemaLoading,
        schemaError: session.liquid.schemaError ?? prev.liquid.schemaError,
        formValues: cloneValue(
          schemaValuesHaveUserData(session.liquid.formValues)
            ? session.liquid.formValues
            : prev.liquid.formValues,
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
  const [numberOfPremix, setNumberOfPremix] = useState(0);
  const [identificationSheet, setIdentificationSheet] = useState<IdentificationSheet | null>(null);

  const [availableSolidMaterials, setAvailableSolidMaterials] = useState<
    RawMaterialPrepMaterialOption[]
  >([]);
  const [availableLiquidMaterials, setAvailableLiquidMaterials] = useState<
    RawMaterialPrepMaterialOption[]
  >([]);
  const [solidMaterialsCacheByBatchKey, setSolidMaterialsCacheByBatchKey] = useState<
    Record<string, RawMaterialPrepMaterialOption[]>
  >({});
  const [liquidMaterialsCacheByBatchKey, setLiquidMaterialsCacheByBatchKey] = useState<
    Record<string, RawMaterialPrepMaterialOption[]>
  >({});
  const [loadingMaterials, setLoadingMaterials] = useState(false);
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
  /** sessionKey:slot → field path errors (red under SchemaUI fields). */
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

  const [initialSnapshot, setInitialSnapshot] = useState("{}");

  const premixMaterialOptions = useMemo<PremixMaterialOption[]>(
    () =>
      buildPremixMaterialOptions(
        identificationSheet?.materials ?? [],
        availableSolidMaterials,
        availableLiquidMaterials,
      ),
    [identificationSheet, availableSolidMaterials, availableLiquidMaterials],
  );

  const allMaterials = useMemo(
    () => mergeMaterialsLists(availableSolidMaterials, availableLiquidMaterials),
    [availableSolidMaterials, availableLiquidMaterials],
  );

  const loadMaterialsByType = useCallback(
    async (materialType: "SOLID" | "LIQUID", options?: { silent?: boolean }) => {
      const response = await operationsController.fetchMaterialsList({ materialType });
      if (response?.success && response?.data) {
        return normalizeMaterialsList(response.data);
      }
      if (!options?.silent) {
        showAlert(
          response?.message || STRINGS.SOURCING.SPECIFICATION_FORM.MATERIALS_LOAD_FAILED,
          "error",
        );
      }
      return [];
    },
    [showAlert],
  );

  const materialsLoadCountRef = useRef(0);

  const beginMaterialsLoad = useCallback(() => {
    materialsLoadCountRef.current += 1;
    setLoadingMaterials(true);
  }, []);

  const endMaterialsLoad = useCallback(() => {
    materialsLoadCountRef.current = Math.max(0, materialsLoadCountRef.current - 1);
    if (materialsLoadCountRef.current === 0) {
      setLoadingMaterials(false);
    }
  }, []);

  const activeBatchId = activeBatch?.batchId ?? "";
  const activeFormBatchKey = activeBatchId || "__form__";
  const activeAddedPremixSelections = useMemo(
    () => addedPremixSelectionsByBatch[activeFormBatchKey] ?? [],
    [addedPremixSelectionsByBatch, activeFormBatchKey],
  );

  useEffect(() => {
    if (view !== "form") {
      setAvailableSolidMaterials([]);
      return;
    }

    if (Object.prototype.hasOwnProperty.call(solidMaterialsCacheByBatchKey, activeFormBatchKey)) {
      setAvailableSolidMaterials(solidMaterialsCacheByBatchKey[activeFormBatchKey] ?? []);
      return;
    }

    let cancelled = false;
    const run = async () => {
      beginMaterialsLoad();
      try {
        const list = await loadMaterialsByType("SOLID", { silent: true });
        if (!cancelled) {
          setAvailableSolidMaterials(list);
          setSolidMaterialsCacheByBatchKey((prev) => ({ ...prev, [activeFormBatchKey]: list }));
        }
      } catch {
        if (!cancelled) {
          setAvailableSolidMaterials([]);
          showAlert(STRINGS.SOURCING.SPECIFICATION_FORM.MATERIALS_FETCH_ERROR, "error");
        }
      } finally {
        if (!cancelled) endMaterialsLoad();
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [
    view,
    loadMaterialsByType,
    showAlert,
    beginMaterialsLoad,
    endMaterialsLoad,
    solidMaterialsCacheByBatchKey,
    activeFormBatchKey,
  ]);

  useEffect(() => {
    if (view !== "form") {
      setAvailableLiquidMaterials([]);
      return;
    }

    if (Object.prototype.hasOwnProperty.call(liquidMaterialsCacheByBatchKey, activeFormBatchKey)) {
      setAvailableLiquidMaterials(liquidMaterialsCacheByBatchKey[activeFormBatchKey] ?? []);
      return;
    }

    let cancelled = false;
    const run = async () => {
      beginMaterialsLoad();
      try {
        const list = await loadMaterialsByType("LIQUID", { silent: true });
        if (!cancelled) {
          setAvailableLiquidMaterials(list);
          setLiquidMaterialsCacheByBatchKey((prev) => ({ ...prev, [activeFormBatchKey]: list }));
        }
      } catch {
        if (!cancelled) {
          setAvailableLiquidMaterials([]);
          showAlert(STRINGS.SOURCING.SPECIFICATION_FORM.MATERIALS_FETCH_ERROR, "error");
        }
      } finally {
        if (!cancelled) endMaterialsLoad();
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [
    view,
    loadMaterialsByType,
    showAlert,
    beginMaterialsLoad,
    endMaterialsLoad,
    liquidMaterialsCacheByBatchKey,
    activeFormBatchKey,
  ]);

  useEffect(() => {
    if (view !== "form" || !identificationSheet || numberOfPremix < 1) return;
    if (availableSolidMaterials.length === 0 && availableLiquidMaterials.length === 0) return;

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
        buildPremixMaterialSessionsFromSelections(selections, availableSolidMaterials, current),
      );
      if (JSON.stringify(current) === JSON.stringify(next)) return prev;
      return { ...prev, [activeFormBatchKey]: next };
    });
  }, [view, activeFormBatchKey, addedPremixSelectionsByBatch, availableSolidMaterials]);

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

  const checkPremixEditable = useCallback(
    (premixNo: number): boolean => isPremixEditable(getPremixStatus(premixNo)),
    [getPremixStatus],
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

  const allPremixSchemasReady = useMemo(
    () =>
      addedPremixSelections.length > 0 &&
      addedPremixSelections.every((entry) => {
        const hasMaterial = Boolean(entry.solidMaterialCode) || Boolean(entry.liquidMaterialCode);
        if (!hasMaterial) return false;

        const session =
          premixSessions[getPremixMaterialSessionKey(entry.premix, entry.materialKey)];
        if (!session) return false;
        if (entry.selectedProcesses.solid) {
          if (session.solid.schemaLoading || session.solid.schemaError || !session.solid.schema) {
            return false;
          }
        }
        if (entry.selectedProcesses.liquid) {
          if (
            session.liquid.schemaLoading ||
            session.liquid.schemaError ||
            !session.liquid.schema
          ) {
            return false;
          }
        }
        return true;
      }),
    [addedPremixSelections, premixSessions],
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
    setAvailableSolidMaterials([]);
    setAvailableLiquidMaterials([]);
    setSolidMaterialsCacheByBatchKey({});
    setLiquidMaterialsCacheByBatchKey({});
    materialsLoadCountRef.current = 0;
    setLoadingMaterials(false);
    setAddedPremixSelectionsByBatch({});
    setPremixSessionsByBatch({});
    setCompletedPremixesByBatch({});
    setWeightmentSheetByBatch({});
    setPremixStatusByNoByBatch({});
    setPremixFieldErrorsByBatch({});
    setWeightmentErrorsByBatch({});
    setValidationAttempt({ format: false, unit: false, submit: false });
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
        const [resolvedSolidMaterials, resolvedLiquidMaterials] = await Promise.all([
          loadMaterialsByType("SOLID", { silent: true }),
          loadMaterialsByType("LIQUID", { silent: true }),
        ]);

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
        setAvailableSolidMaterials(resolvedSolidMaterials);
        setAvailableLiquidMaterials(resolvedLiquidMaterials);
        setSolidMaterialsCacheByBatchKey((prev) => ({
          ...prev,
          [batchKey]: resolvedSolidMaterials,
        }));
        setLiquidMaterialsCacheByBatchKey((prev) => ({
          ...prev,
          [batchKey]: resolvedLiquidMaterials,
        }));
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
    [loadMaterialsByType, showAlert],
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

  const handlePremixDateChange = useCallback(
    (premix: number, premixDate: string) => {
      if (!premix) return;
      if (!checkPremixEditable(premix)) return;

      setAddedPremixSelectionsByBatch((prev) => {
        const list = prev[activeFormBatchKey] ?? [];
        const nextList = list.map((entry) =>
          entry.premix === premix ? { ...entry, premixDate } : entry,
        );
        return {
          ...prev,
          [activeFormBatchKey]: nextList,
        };
      });
    },
    [activeFormBatchKey, checkPremixEditable],
  );

  const handlePremixSlotChange = useCallback(
    (
      premix: number,
      materialKey: string,
      slot: "solid" | "liquid",
      nextSlot: PremixSession["solid"],
    ) => {
      if (!premix || !materialKey) return;
      // Always allow slot updates (schema load + hydrate from API).
      // User edits are blocked in SchemaPanel via readOnly when premix is locked.
      const sessionKey = getPremixMaterialSessionKey(premix, materialKey);
      const errorKey = `${sessionKey}:${slot}`;
      // Deep-clone form values so Premix 1 / Premix 2 never share the same object
      // when the same material (e.g. TDI) appears on multiple premixes.
      const isolatedSlot: PremixSession["solid"] = {
        ...nextSlot,
        formValues: cloneValue(nextSlot.formValues ?? {}),
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

      // Live type/format validation only (DRAFT) → red under fields, no toast
      if (checkPremixEditable(premix) && isolatedSlot.schema && !isolatedSlot.schemaLoading) {
        setValidationAttempt((prev) => ({ ...prev, format: true }));
        const selection = addedPremixSelections.find(
          (entry) => entry.premix === premix && entry.materialKey === materialKey,
        );
        const materialContext =
          slot === "solid"
            ? {
                materialCode: selection?.solidMaterialCode,
                gradeCode: selection?.solidGradeCode,
              }
            : {
                materialCode: selection?.liquidMaterialCode,
                gradeCode: selection?.liquidGradeCode,
              };
        const liveErrors = validateSchemaFormValues(
          isolatedSlot.schema,
          isolatedSlot.formValues ?? {},
          "DRAFT",
          materialContext,
        );
        setPremixFieldErrorsByBatch((prev) => {
          const batchErrors = { ...(prev[activeFormBatchKey] ?? {}) };
          if (Object.keys(liveErrors).length === 0) {
            if (!batchErrors[errorKey]) return prev;
            delete batchErrors[errorKey];
          } else {
            batchErrors[errorKey] = liveErrors;
          }
          return { ...prev, [activeFormBatchKey]: batchErrors };
        });
      }

      if (!checkPremixEditable(premix)) return;

      const session = premixSessions[sessionKey];
      if (session && isSessionFilled({ ...session, [slot]: isolatedSlot })) {
        markPremixComplete(activeBatchId, premix);
      }
    },
    [activeFormBatchKey, activeBatchId, markPremixComplete, premixSessions, checkPremixEditable, addedPremixSelections],
  );

  const handleWeightmentSheetChange = useCallback(
    (
      nextSheet:
        | RawMaterialPrepWeightmentSheet
        | ((prev: RawMaterialPrepWeightmentSheet) => RawMaterialPrepWeightmentSheet),
    ) => {
      setWeightmentSheetByBatch((prev) => {
        const current = prev[activeFormBatchKey] ?? createEmptyWeightmentSheet();
        const next = typeof nextSheet === "function" ? nextSheet(current) : nextSheet;
        return {
          ...prev,
          [activeFormBatchKey]: next,
        };
      });
    },
    [activeFormBatchKey],
  );

  const submitPremix = useCallback(
    async (premixNo: number, intent: "draft" | "submit") => {
      if (!activeBatch) return false;

      if (!subDepartmentId) {
        showAlert(STRINGS.MANUFACTURING.RAW_MATERIAL_PREP.SUB_DEPARTMENT_MISSING, "error");
        return false;
      }

      if (!checkPremixEditable(premixNo)) {
        return false;
      }

      const isDraft = intent === "draft";
      let sessionsForPayload = premixSessions;

      setActionLoading(true);
      try {
        sessionsForPayload = await ensurePremixSchemasLoaded(
          premixNo,
          addedPremixSelections,
          premixSessions,
          availableSolidMaterials as MaterialsListItem[],
          availableLiquidMaterials as MaterialsListItem[],
          subDepartmentId,
        );
        setPremixSessionsByBatch((prev) => ({
          ...prev,
          [activeFormBatchKey]: sessionsForPayload,
        }));
      } finally {
        setActionLoading(false);
      }

      setValidationAttempt({
        format: true,
        unit: false,
        submit: !isDraft,
      });

      if (isDraft) {
        const formatResult = validateRawMaterialPreparation(
          {
            premixNo,
            addedPremixSelections,
            premixSessions: sessionsForPayload,
            weightmentSheet,
            identificationSheetMaterials: identificationSheet?.materials ?? [],
          },
          "FORMAT",
        );
        setPremixFieldErrorsByBatch((prev) => ({
          ...prev,
          [activeFormBatchKey]: formatResult.premixFieldErrors,
        }));
        if (
          Object.values(formatResult.premixFieldErrors).some((errs) => Object.keys(errs).length > 0)
        ) {
          return false;
        }
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
          if (
            entry.solidMaterialCode &&
            materialRequiresGradeSelection(availableSolidMaterials, entry.solidMaterialCode)
          ) {
            return Boolean(entry.solidGradeCode);
          }
          return true;
        });

        if (!premixHasMaterial) {
          showAlert(STRINGS.MANUFACTURING.RAW_MATERIAL_PREP.SELECT_AT_LEAST_ONE, "warning");
          return false;
        }

        const premixSchemasReady = premixSelections.every((entry) => {
          const session =
            sessionsForPayload[getPremixMaterialSessionKey(entry.premix, entry.materialKey)];
          if (!session) return false;
          if (entry.selectedProcesses.solid) {
            if (session.solid.schemaLoading || session.solid.schemaError || !session.solid.schema) {
              return false;
            }
          }
          if (entry.selectedProcesses.liquid) {
            if (
              session.liquid.schemaLoading ||
              session.liquid.schemaError ||
              !session.liquid.schema
            ) {
              return false;
            }
          }
          return true;
        });

        if (!premixSchemasReady) {
          showAlert(STRINGS.MANUFACTURING.RAW_MATERIAL_PREP.SCHEMA_LOAD_REQUIRED, "warning");
          return false;
        }

        const premixHasData = premixSelections.some((entry) => {
          const session =
            sessionsForPayload[getPremixMaterialSessionKey(entry.premix, entry.materialKey)];
          return session ? isSessionFilled(session) : false;
        });

        if (!premixHasData) {
          showAlert(STRINGS.MANUFACTURING.RAW_MATERIAL_PREP.EMPTY_FORM_ERROR, "warning");
          return false;
        }

        // Schema + weightment validation — red under fields, no toast
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

          const hasSchemaFieldErrors =
            Object.keys(validationResult.premixFieldErrors).length > 0;
          const hasWeightmentFieldErrors = hasValidationErrors(validationResult.weightmentErrors);

          if (hasSchemaFieldErrors || hasWeightmentFieldErrors) {
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

      const payloadBody = mapPreparationDetailsPayload({
        addedPremixSelections,
        premixSessions: sessionsForPayload,
        solidMaterials: availableSolidMaterials as MaterialsListItem[],
        liquidMaterials: availableLiquidMaterials as MaterialsListItem[],
        weightmentSheet,
        targetPremixNos: [premixNo],
        premixSubmissionType,
        includeEmptyPremixes: isDraft,
        allowPartialProcesses: isDraft,
      });

      if (!isDraft && !payloadBody.preparationDetails.premixes.length) {
        showAlert(STRINGS.MANUFACTURING.RAW_MATERIAL_PREP.EMPTY_FORM_ERROR, "warning");
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

        if (nextFormId) {
          const statusForBanner = String(
            response.data?.status ?? activeBatch.rmStatus ?? activeBatch.status ?? "",
          )
            .trim()
            .toUpperCase()
            .replace(/\s+/g, "_");
          const stillRejectedEdit = statusForBanner === "REJECTED";

          await openFormWithResolvedData(refreshedBatch, stillRejectedEdit, {
            silent: true,
            preserveLocalSessions: premixSessionsByBatch[activeFormBatchKey] ?? {},
          });
        } else {
          setInitialSnapshot(formSnapshot);
        }

        return true;
      } finally {
        setActionLoading(false);
      }
    },
    [
      activeBatch,
      subDepartmentId,
      addedPremixSelections,
      premixSessions,
      availableSolidMaterials,
      availableLiquidMaterials,
      showAlert,
      formSnapshot,
      weightmentSheet,
      activeFormBatchKey,
      premixSessionsByBatch,
      identificationSheet,
      checkPremixEditable,
      openFormWithResolvedData,
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

      if (!payloadBody.preparationDetails.premixes.length) {
        showAlert(STRINGS.MANUFACTURING.RAW_MATERIAL_PREP.EMPTY_FORM_ERROR, "warning");
        return false;
      }

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
        if (
          entry.solidMaterialCode &&
          materialRequiresGradeSelection(availableSolidMaterials, entry.solidMaterialCode)
        ) {
          return Boolean(entry.solidGradeCode);
        }
        return true;
      });
      if (!premixHasMaterial) return false;

      const premixSchemasReady = premixSelections.every((entry) => {
        const session = premixSessions[getPremixMaterialSessionKey(entry.premix, entry.materialKey)];
        if (!session) return false;
        if (entry.selectedProcesses.solid) {
          if (session.solid.schemaLoading || session.solid.schemaError || !session.solid.schema) {
            return false;
          }
        }
        if (entry.selectedProcesses.liquid) {
          if (session.liquid.schemaLoading || session.liquid.schemaError || !session.liquid.schema) {
            return false;
          }
        }
        return true;
      });
      if (!premixSchemasReady) return false;

      const premixHasData = premixSelections.some((entry) => {
        const session = premixSessions[getPremixMaterialSessionKey(entry.premix, entry.materialKey)];
        return session ? isSessionFilled(session) : false;
      });
      if (!premixHasData) return false;

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

      const hasSchemaFieldErrors = Object.values(validationResult.premixFieldErrors).some(
        (errs) => Object.keys(errs).length > 0,
      );
      if (hasSchemaFieldErrors) return false;
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
    allPremixSchemasReady,
    allPremixesHaveMaterial,
    setBackConfirmOpen,
    handlePremixDateChange,
    handlePremixSlotChange,
    addedPremixSelections,
    premixSessions,
    weightmentSheet,
    handleWeightmentSheetChange,
    premixStatusByNo,
    isPremixEditable: checkPremixEditable,
    handleFillForm,
    handleEditForm,
    handleBack,
    handleDiscardAndBack,
    handleSavePremixDraft,
    handleSubmitPremix,
    premixFieldErrors,
    validationAttempt,
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
