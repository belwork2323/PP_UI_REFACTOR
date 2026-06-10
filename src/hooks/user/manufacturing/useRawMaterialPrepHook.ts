// src/hooks/user/manufacturing/useRawMaterialPrepHook.ts

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { operationsController } from "../../../controllers/user/operationsController";
import { useAlertStore } from "../../../app/store/alertStore";
import { useAuthStore } from "../../../app/store/authStore";
import { useUserBatchRefreshStore } from "../../../app/store/userBatchRefreshStore";
import { STRINGS } from "../../../app/config/strings";
import { MANUFACTURING_STATUS } from "./manufacturingWorkflowData";
import { ManufacturingBatch, WorkflowView } from "./useManufacturingWorkflow";
import { useSubdepartmentBatches } from "../useSubdepartmentBatches";
import rawMaterialPreparationController from "../../../controllers/user/manufacturing/rawMaterialPreparationController";
import {
  createEmptyPremixSchemaSession,
  createEmptyWeightmentSheet,
  mapPreparationDetailsFromApi,
  mapPreparationDetailsPayload,
  premixSessionHasData,
  type RawMaterialPrepPremixSession,
  type RawMaterialPrepPremixSelection,
  type RawMaterialPrepWeightmentSheet,
} from "../../../data/models/user/RawMaterialPreparationModel";
import type { MaterialsListItem } from "../../../data/models/user/MaterialsListModel";
import {
  DEFAULT_SELECTED_PROCESSES,
  PREMIX_OPTIONS,
  getPrepMaterialGrades,
  materialRequiresGradeSelection,
  findPrepMaterialByCode,
  normalizeMaterialsList,
  type RawMaterialPrepMaterialOption,
  type RawMaterialPrepProcessKey,
  type RawMaterialPrepSelectedProcesses,
} from "./rawMaterialPrepFlowConfig";
import { findGradeInMaterial } from "../../../schemaManagement/adapters/rawMaterialPreparation.adapter";

const RM_STATUS = MANUFACTURING_STATUS;

// ─── Helpers ──────────────────────────────────────────────────────────────────
export const deriveTypes = (material: any) => {
  const m = String(material ?? "").toLowerCase();
  return { solid: m === "solid" || m === "both", liquid: m === "liquid" || m === "both", linear: m === "linear" };
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

const createEmptyPremixSession = (): PremixSession => createEmptyPremixSchemaSession();

const createDefaultFormState = () => ({
  selectedPremix: "" as number | "",
  selectedProcesses: { ...DEFAULT_SELECTED_PROCESSES },
  solidMaterialCode: "",
  solidGradeCode: "",
  liquidMaterialCode: "",
});

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

const isSessionFilled = (session: PremixSession) => premixSessionHasData(normalizePremixSession(session));

const parseStatus = (status: string | undefined) => String(status ?? "").toLowerCase();

export const useRawMaterialPrepHook = () => {
  const listParams = useSubdepartmentBatches("raw-material-prep");
  const showAlert = useAlertStore((state) => state.showAlert);
  const user = useAuthStore((s) => s.user);
  const bumpBatchRefresh = useUserBatchRefreshStore((state) => state.bumpVersion);

  const subDepartmentId = useMemo(
    () =>
      user?.allSubDepartments.find((sd) => sd.slugs?.subDept === "raw-material-prep")
        ?.subDepartmentId,
    [user]
  );

  const [view, setView] = useState<WorkflowView>("list");
  const [activeBatch, setActiveBatch] = useState<RawMaterialPrepBatch | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [loadingFormDetails, setLoadingFormDetails] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [backConfirmOpen, setBackConfirmOpen] = useState(false);
  const [hasSavedDraft, setHasSavedDraft] = useState(false);

  const [selectedPremix, setSelectedPremix] = useState<number | "">("");
  const [selectedProcesses, setSelectedProcesses] = useState<RawMaterialPrepSelectedProcesses>(
    () => ({ ...DEFAULT_SELECTED_PROCESSES })
  );
  const [solidMaterialCode, setSolidMaterialCode] = useState("");
  const [solidGradeCode, setSolidGradeCode] = useState("");
  const [liquidMaterialCode, setLiquidMaterialCode] = useState("");
  const [availableSolidMaterials, setAvailableSolidMaterials] = useState<RawMaterialPrepMaterialOption[]>([]);
  const [availableLiquidMaterials, setAvailableLiquidMaterials] = useState<RawMaterialPrepMaterialOption[]>([]);
  const [solidMaterialsCacheByBatchKey, setSolidMaterialsCacheByBatchKey] = useState<
    Record<string, RawMaterialPrepMaterialOption[]>
  >({});
  const [liquidMaterialsCacheByBatchKey, setLiquidMaterialsCacheByBatchKey] = useState<
    Record<string, RawMaterialPrepMaterialOption[]>
  >({});
  const [loadingMaterials, setLoadingMaterials] = useState(false);
  const [completedPremixesByBatch, setCompletedPremixesByBatch] = useState<Record<string, number[]>>({});
  const [premixSessionsByBatch, setPremixSessionsByBatch] = useState<
    Record<string, Record<number, PremixSession>>
  >({});
  const [addedPremixSelectionsByBatch, setAddedPremixSelectionsByBatch] = useState<
    Record<string, AddedPremixSelection[]>
  >({});
  const [weightmentSheetByBatch, setWeightmentSheetByBatch] = useState<
    Record<string, RawMaterialPrepWeightmentSheet>
  >({});

  const [initialSnapshot, setInitialSnapshot] = useState("{}");

  const safeSelectedProcesses = useMemo(
    () => ({
      ...DEFAULT_SELECTED_PROCESSES,
      ...(selectedProcesses ?? {}),
    }),
    [selectedProcesses]
  );

  const selectedTypes = useMemo<MaterialTypes>(
    () => ({
      solid: safeSelectedProcesses.solid,
      liquid: safeSelectedProcesses.liquid,
      linear: false,
    }),
    [safeSelectedProcesses]
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
          "error"
        );
      }
      return [];
    },
    [showAlert]
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
    [addedPremixSelectionsByBatch, activeFormBatchKey]
  );

  const needsSolidMaterialsList = useMemo(
    () =>
      safeSelectedProcesses.solid ||
      activeAddedPremixSelections.some((entry) => entry.selectedProcesses.solid),
    [safeSelectedProcesses.solid, activeAddedPremixSelections]
  );

  const needsLiquidMaterialsList = useMemo(
    () =>
      safeSelectedProcesses.liquid ||
      activeAddedPremixSelections.some((entry) => entry.selectedProcesses.liquid),
    [safeSelectedProcesses.liquid, activeAddedPremixSelections]
  );

  const clearMaterialsCacheForKey = useCallback((batchKey: string) => {
    if (!batchKey) return;
    setSolidMaterialsCacheByBatchKey((prev) => {
      if (!(batchKey in prev)) return prev;
      const next = { ...prev };
      delete next[batchKey];
      return next;
    });
    setLiquidMaterialsCacheByBatchKey((prev) => {
      if (!(batchKey in prev)) return prev;
      const next = { ...prev };
      delete next[batchKey];
      return next;
    });
  }, []);

  useEffect(() => {
    if (view !== "form" || !needsSolidMaterialsList) {
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
          if (list.length === 0) {
            showAlert(STRINGS.SOURCING.SPECIFICATION_FORM.MATERIALS_LOAD_FAILED, "error");
          }
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
    needsSolidMaterialsList,
    loadMaterialsByType,
    showAlert,
    beginMaterialsLoad,
    endMaterialsLoad,
    solidMaterialsCacheByBatchKey,
    activeFormBatchKey,
  ]);

  useEffect(() => {
    if (view !== "form" || !needsLiquidMaterialsList) {
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
          if (list.length === 0) {
            showAlert(STRINGS.SOURCING.SPECIFICATION_FORM.MATERIALS_LOAD_FAILED, "error");
          }
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
    needsLiquidMaterialsList,
    loadMaterialsByType,
    showAlert,
    beginMaterialsLoad,
    endMaterialsLoad,
    liquidMaterialsCacheByBatchKey,
    activeFormBatchKey,
  ]);

  const materialTypesArray = useMemo(() => {
    const types: Array<"solid" | "liquid"> = [];
    if (selectedTypes.solid) types.push("solid");
    if (selectedTypes.liquid) types.push("liquid");
    return types;
  }, [selectedTypes]);

  const completedPremixes = useMemo(
    () => completedPremixesByBatch[activeBatchId] ?? [],
    [completedPremixesByBatch, activeBatchId]
  );

  const premixSessions = useMemo(
    () => premixSessionsByBatch[activeFormBatchKey] ?? {},
    [premixSessionsByBatch, activeFormBatchKey]
  );
  const addedPremixSelections = useMemo(
    () => addedPremixSelectionsByBatch[activeFormBatchKey] ?? [],
    [addedPremixSelectionsByBatch, activeFormBatchKey]
  );
  const weightmentSheet = useMemo(
    () => weightmentSheetByBatch[activeFormBatchKey] ?? createEmptyWeightmentSheet(),
    [weightmentSheetByBatch, activeFormBatchKey]
  );

  const availablePremixOptions = useMemo(() => {
    const used = new Set(addedPremixSelections.map((entry) => entry.premix));
    return PREMIX_OPTIONS.filter((n) => !used.has(n));
  }, [addedPremixSelections]);

  const applyPremixSession = useCallback((session?: Partial<PremixSession> | null) => {
    const normalized = normalizePremixSession(session);
    setSelectedProcesses(normalized.selectedProcesses);
    setSolidMaterialCode(normalized.solidMaterialCode);
    setSolidGradeCode(normalized.solidGradeCode);
    setLiquidMaterialCode(normalized.liquidMaterialCode);
  }, []);

  const markPremixComplete = useCallback(
    (batchId: string, premix: number) => {
      if (!batchId || !premix) return;
      setCompletedPremixesByBatch((prev) => {
        const existing = prev[batchId] ?? [];
        if (existing.includes(premix)) return prev;
        return { ...prev, [batchId]: [...existing, premix].sort((a, b) => a - b) };
      });
    },
    []
  );

  const formSnapshot = useMemo(
    () =>
      JSON.stringify({
        addedPremixSelections,
        premixSessions,
        weightmentSheet,
      }),
    [addedPremixSelections, premixSessions, weightmentSheet]
  );

  const premixCardsHaveData = useMemo(
    () =>
      addedPremixSelections.some((entry) => {
        const session = premixSessions[entry.premix];
        return session ? isSessionFilled(session) : false;
      }),
    [addedPremixSelections, premixSessions]
  );

  const allPremixSchemasReady = useMemo(
    () =>
      addedPremixSelections.length > 0 &&
      addedPremixSelections.every((entry) => {
        const session = premixSessions[entry.premix];
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
      }),
    [addedPremixSelections, premixSessions]
  );

  const isFormDirty = useMemo(
    () => view === "form" && formSnapshot !== initialSnapshot,
    [view, formSnapshot, initialSnapshot]
  );

  const resetFormContext = useCallback(() => {
    const defaults = createDefaultFormState();
    setView("list");
    setActiveBatch(null);
    setIsEditMode(false);
    setLoadingFormDetails(false);
    setActionLoading(false);
    setBackConfirmOpen(false);
    setHasSavedDraft(false);
    setSelectedPremix(defaults.selectedPremix);
    setSelectedProcesses(defaults.selectedProcesses);
    setSolidMaterialCode(defaults.solidMaterialCode);
    setSolidGradeCode(defaults.solidGradeCode);
    setLiquidMaterialCode(defaults.liquidMaterialCode);
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
    setInitialSnapshot(
      JSON.stringify({
        addedPremixSelections: [],
        premixSessions: {},
        weightmentSheet: createEmptyWeightmentSheet(),
      })
    );
  }, []);

  const getErrorMessage = (response: any, fallbackMessage: string) => {
    if (response?.error?.details) return response.error.details;
    if (response?.message) return response.message;
    return fallbackMessage;
  };

  const openFormWithResolvedData = useCallback(async (batch: RawMaterialPrepBatch, editMode: boolean) => {
    const shouldFetchDetails = Boolean(batch.formId);

    let nextBatch = batch;
    let nextAddedPremixSelections: AddedPremixSelection[] = [];
    let nextPremixSessions: Record<number, PremixSession> = {};
    let nextWeightmentSheet = createEmptyWeightmentSheet();

    if (shouldFetchDetails) {
      if (!batch.formId) {
        showAlert(STRINGS.MANUFACTURING.RAW_MATERIAL_PREP.FORM_ID_MISSING, "error");
        return;
      }

      setLoadingFormDetails(true);
      const detailsResponse = await rawMaterialPreparationController.fetchFormDetails({
        formId: batch.formId,
      });
      setLoadingFormDetails(false);

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
        ...batch,
        formId: details.formId || batch.formId,
      };
      const mapped = mapPreparationDetailsFromApi(details);
      nextAddedPremixSelections = mapped.addedPremixSelections;
      nextPremixSessions = mapped.premixSessions;
      nextWeightmentSheet = mapped.weightmentSheet;
    }

    const snapshot = JSON.stringify({
      addedPremixSelections: nextAddedPremixSelections,
      premixSessions: nextPremixSessions,
      weightmentSheet: nextWeightmentSheet,
    });

    setActiveBatch(nextBatch);
    setIsEditMode(editMode);
    setSelectedPremix("");
    setSelectedProcesses({ ...DEFAULT_SELECTED_PROCESSES });
    setSolidMaterialCode("");
    setSolidGradeCode("");
    setLiquidMaterialCode("");
    const batchKey = nextBatch.batchId || "__form__";
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
    setInitialSnapshot(snapshot);
    setView("form");
  }, [showAlert]);

  const handleFillForm = useCallback(
    async (batch: RawMaterialPrepBatch) => await openFormWithResolvedData(batch, false),
    [openFormWithResolvedData]
  );

  const handleEditForm = useCallback(
    async (batch: RawMaterialPrepBatch) => await openFormWithResolvedData(batch, true),
    [openFormWithResolvedData]
  );

  const handleBack = useCallback(() => {
    if (isFormDirty) {
      setBackConfirmOpen(true);
      return;
    }
    if (hasSavedDraft) bumpBatchRefresh();
    resetFormContext();
  }, [isFormDirty, resetFormContext, bumpBatchRefresh, hasSavedDraft]);

  const handleDiscardAndBack = useCallback(() => {
    if (hasSavedDraft) bumpBatchRefresh();
    resetFormContext();
  }, [resetFormContext, bumpBatchRefresh, hasSavedDraft]);

  const handlePremixChange = useCallback((premix: number | "") => {
    setSelectedPremix(premix);
    if (premix === "") {
      applyPremixSession(createEmptyPremixSession());
    }
  }, [applyPremixSession]);

  const handleProcessToggle = useCallback(
    (process: RawMaterialPrepProcessKey, checked: boolean) => {
      setSelectedProcesses((prev) => ({
        ...DEFAULT_SELECTED_PROCESSES,
        ...(prev ?? {}),
        [process]: checked,
      }));
      if (!checked) {
        if (process === "solid") {
          setSolidMaterialCode("");
          setSolidGradeCode("");
          setAvailableSolidMaterials([]);
        } else {
          setLiquidMaterialCode("");
          setAvailableLiquidMaterials([]);
        }
      }
    },
    []
  );

  const handleSolidMaterialChange = useCallback((materialCode: string) => {
    setSolidMaterialCode(materialCode);
    setSolidGradeCode("");
  }, []);

  const handleSolidGradeChange = useCallback((gradeCode: string) => {
    setSolidGradeCode(gradeCode);
  }, []);

  const handleLiquidMaterialChange = useCallback((materialCode: string) => {
    setLiquidMaterialCode(materialCode);
  }, []);

  const handleAddPremixSelection = useCallback(() => {
    if (selectedPremix === "") return;

    const hasSolid = Boolean(selectedProcesses.solid);
    const hasLiquid = Boolean(selectedProcesses.liquid);
    if (!hasSolid && !hasLiquid) return;
    if (hasSolid && !solidMaterialCode) return;
    if (
      hasSolid &&
      materialRequiresGradeSelection(availableSolidMaterials, solidMaterialCode) &&
      !solidGradeCode
    ) {
      return;
    }
    if (hasLiquid && !liquidMaterialCode) return;

    const solidMaterial = hasSolid
      ? findPrepMaterialByCode(availableSolidMaterials, solidMaterialCode)
      : undefined;
    const liquidMaterial = hasLiquid
      ? findPrepMaterialByCode(availableLiquidMaterials, liquidMaterialCode)
      : undefined;
    const solidGrade = solidMaterial
      ? findGradeInMaterial(solidMaterial, solidGradeCode)
      : undefined;

    const nextEntry: AddedPremixSelection = {
      premix: selectedPremix,
      selectedProcesses: {
        solid: hasSolid,
        liquid: hasLiquid,
      },
      solidMaterialCode,
      solidGradeCode: hasSolid ? solidGradeCode : "",
      solidMaterialId: solidMaterial?.materialId,
      solidGradeId: solidGrade?.gradeId,
      liquidMaterialCode,
      liquidMaterialId: liquidMaterial?.materialId,
    };
    const nextSession: PremixSession = {
      ...createEmptyPremixSchemaSession(),
      selectedProcesses: {
        solid: hasSolid,
        liquid: hasLiquid,
      },
      solidMaterialCode,
      solidGradeCode: hasSolid ? solidGradeCode : "",
      liquidMaterialCode,
    };

    setAddedPremixSelectionsByBatch((prev) => {
      const list = prev[activeFormBatchKey] ?? [];
      const withoutCurrent = list.filter((entry) => entry.premix !== selectedPremix);
      const nextList = [...withoutCurrent, nextEntry].sort((a, b) => a.premix - b.premix);
      return {
        ...prev,
        [activeFormBatchKey]: nextList,
      };
    });
    setPremixSessionsByBatch((prev) => ({
      ...prev,
      [activeFormBatchKey]: {
        ...(prev[activeFormBatchKey] ?? {}),
        [selectedPremix]: nextSession,
      },
    }));

    if (activeBatchId) {
      markPremixComplete(activeBatchId, selectedPremix);
    }

    setSelectedPremix("");
    setSelectedProcesses({ ...DEFAULT_SELECTED_PROCESSES });
    setSolidMaterialCode("");
    setSolidGradeCode("");
    setLiquidMaterialCode("");
  }, [
    selectedPremix,
    selectedProcesses,
    solidMaterialCode,
    solidGradeCode,
    liquidMaterialCode,
    activeFormBatchKey,
    activeBatchId,
    markPremixComplete,
    applyPremixSession,
    availableSolidMaterials,
  ]);

  const handlePremixSlotChange = useCallback(
    (premix: number, slot: "solid" | "liquid", nextSlot: PremixSession["solid"]) => {
      if (!premix) return;
      setPremixSessionsByBatch((prev) => {
        const batchSessions = prev[activeFormBatchKey] ?? {};
        const current = normalizePremixSession(batchSessions[premix]);
        return {
          ...prev,
          [activeFormBatchKey]: {
            ...batchSessions,
            [premix]: {
              ...current,
              [slot]: nextSlot,
            },
          },
        };
      });

      const session = premixSessions[premix];
      if (session && isSessionFilled({ ...session, [slot]: nextSlot })) {
        markPremixComplete(activeBatchId, premix);
      }
    },
    [activeFormBatchKey, activeBatchId, markPremixComplete, premixSessions]
  );

  const handleDeletePremixSelection = useCallback(
    (premix: number) => {
      if (!premix) return;

      setAddedPremixSelectionsByBatch((prev) => {
        const list = prev[activeFormBatchKey] ?? [];
        return {
          ...prev,
          [activeFormBatchKey]: list.filter((entry) => entry.premix !== premix),
        };
      });

      setPremixSessionsByBatch((prev) => {
        const batchSessions = { ...(prev[activeFormBatchKey] ?? {}) };
        delete batchSessions[premix];
        return { ...prev, [activeFormBatchKey]: batchSessions };
      });

      if (activeBatchId) {
        setCompletedPremixesByBatch((prev) => {
          const existing = prev[activeBatchId] ?? [];
          if (!existing.includes(premix)) return prev;
          return {
            ...prev,
            [activeBatchId]: existing.filter((n) => n !== premix),
          };
        });
      }

      if (selectedPremix === premix) {
        setSelectedPremix("");
      }
      setSelectedProcesses({ ...DEFAULT_SELECTED_PROCESSES });
      setSolidMaterialCode("");
      setSolidGradeCode("");
      setLiquidMaterialCode("");
    },
    [activeFormBatchKey, activeBatchId, selectedPremix]
  );

  const handleWeightmentSheetChange = useCallback(
    (nextSheet: RawMaterialPrepWeightmentSheet) => {
      setWeightmentSheetByBatch((prev) => ({
        ...prev,
        [activeFormBatchKey]: nextSheet,
      }));
    },
    [activeFormBatchKey]
  );

  const submitForm = useCallback(async (intent: "draft" | "submit") => {
    if (!activeBatch) return false;

    if (!subDepartmentId) {
      showAlert(STRINGS.MANUFACTURING.RAW_MATERIAL_PREP.SUB_DEPARTMENT_MISSING, "error");
      return false;
    }

    if (addedPremixSelections.length === 0) {
      showAlert(STRINGS.MANUFACTURING.RAW_MATERIAL_PREP.SELECT_AT_LEAST_ONE, "warning");
      return false;
    }

    if (!allPremixSchemasReady) {
      showAlert(STRINGS.MANUFACTURING.RAW_MATERIAL_PREP.SCHEMA_LOAD_REQUIRED, "warning");
      return false;
    }

    if (!premixCardsHaveData) {
      showAlert(STRINGS.MANUFACTURING.RAW_MATERIAL_PREP.EMPTY_FORM_ERROR, "warning");
      return false;
    }

    const isCreateFlow = !activeBatch.formId;

    const payloadBody = mapPreparationDetailsPayload({
      addedPremixSelections,
      premixSessions,
      solidMaterials: availableSolidMaterials as MaterialsListItem[],
      liquidMaterials: availableLiquidMaterials as MaterialsListItem[],
      weightmentSheet,
    });

    if (!payloadBody.preparationDetails.premixes.length) {
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
          formSubmissionType: intent === "draft" ? "DRAFT" : "SUBMIT",
          ...payloadBody,
        });
      } else {
        if (!activeBatch.formId) {
          showAlert(STRINGS.MANUFACTURING.RAW_MATERIAL_PREP.FORM_ID_MISSING, "error");
          return false;
        }

        response = await rawMaterialPreparationController.updateForm({
          formId: activeBatch.formId,
          subDepartmentId,
          formSubmissionType: intent === "draft" ? "DRAFT" : "SUBMIT",
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

      const nextFormId = response.data?.formId ?? activeBatch.formId ?? null;
      setActiveBatch((prev) => (prev ? { ...prev, formId: nextFormId } : prev));
      setInitialSnapshot(formSnapshot);

      if (intent === "draft") {
        showAlert(
          isCreateFlow
            ? STRINGS.MANUFACTURING.RAW_MATERIAL_PREP.CREATE_DRAFT_SUCCESS
            : STRINGS.MANUFACTURING.RAW_MATERIAL_PREP.UPDATE_DRAFT_SUCCESS,
          "success",
          { autoCloseMs: 2200 }
        );
        setHasSavedDraft(true);
        clearMaterialsCacheForKey(activeFormBatchKey);
        setAvailableSolidMaterials([]);
        setAvailableLiquidMaterials([]);
      } else {
        showAlert(
          isCreateFlow
            ? STRINGS.MANUFACTURING.RAW_MATERIAL_PREP.CREATE_SUBMIT_SUCCESS
            : STRINGS.MANUFACTURING.RAW_MATERIAL_PREP.UPDATE_SUBMIT_SUCCESS,
          "success",
          { autoCloseMs: 2200 }
        );

        await listParams.refreshUserBatches();
        resetFormContext();
      }

      return true;
    } finally {
      setActionLoading(false);
    }
  }, [
    activeBatch,
    subDepartmentId,
    addedPremixSelections,
    premixSessions,
    availableSolidMaterials,
    availableLiquidMaterials,
    allPremixSchemasReady,
    premixCardsHaveData,
    showAlert,
    formSnapshot,
    listParams,
    resetFormContext,
    weightmentSheet,
    clearMaterialsCacheForKey,
    activeFormBatchKey,
  ]);

  const handleSaveDraft = useCallback(async () => {
    return await submitForm("draft");
  }, [submitForm]);

  const handleSubmit = useCallback(async () => {
    return await submitForm("submit");
  }, [submitForm]);

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
    selectedTypes,
    selectedPremix,
    selectedProcesses: safeSelectedProcesses,
    solidMaterialCode,
    solidGradeCode,
    liquidMaterialCode,
    availableSolidMaterials: Array.isArray(availableSolidMaterials) ? availableSolidMaterials : [],
    availableLiquidMaterials: Array.isArray(availableLiquidMaterials) ? availableLiquidMaterials : [],
    loadingMaterials,
    availablePremixOptions,
    completedPremixes,
    materialTypesArray,
    subDepartmentId,
    premixCardsHaveData,
    allPremixSchemasReady,
    setBackConfirmOpen,
    handlePremixChange,
    handleProcessToggle,
    handleSolidMaterialChange,
    handleSolidGradeChange,
    handleLiquidMaterialChange,
    handleAddPremixSelection,
    handlePremixSlotChange,
    handleDeletePremixSelection,
    addedPremixSelections,
    premixSessions,
    weightmentSheet,
    handleWeightmentSheetChange,
    handleFillForm,
    handleEditForm,
    handleBack,
    handleDiscardAndBack,
    handleSaveDraft,
    handleSubmit,
  };
};

export default useRawMaterialPrepHook;
