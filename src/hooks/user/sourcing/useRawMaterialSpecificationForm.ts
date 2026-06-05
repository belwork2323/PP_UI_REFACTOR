import { startTransition, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { STRINGS } from "../../../app/config/strings";
import { useAlertStore } from "../../../app/store/alertStore";
import { useThemeStore } from "../../../app/store/themeStore";
import getSourcingTheme from "../../../app/theme/custom_themes/user/sourcing/sourcing_theme";
import { operationsController } from "../../../controllers/user/operationsController";
import type { MaterialsListItem } from "../../../data/models/user/MaterialsListModel";
import { MaterialSpecificationItemModel } from "../../../data/models/user/MaterialSpecificationModel";
import type {
  MaterialBlock,
  MaterialFormGroup,
  MaterialLotBlock,
  SpecRow,
} from "../../../data/models/user/RawMaterialProcurementModel";
import {
  computeIsOutOfRange,
  flattenMaterialGroups,
  serializeMaterialBlocks,
} from "../../../data/models/user/RawMaterialProcurementModel";
import {
  areAllAnalyzedResultsFilled,
  areBlocksMandatoryComplete,
  areMaterialGroupsMandatoryComplete,
} from "../../../data/models/user/rawMaterialProcurementValidation";
import {
  rmCertDebug,
  summarizeBlocks,
  summarizeLotCerts,
  summarizeMaterialGroups,
} from "../../../utils/rawMaterialCertUploadDebug";

export type SpecificationRow = SpecRow;
export type SpecificationBlock = MaterialBlock;

type MaterialOption = Pick<MaterialsListItem, "materialCode" | "materialName" | "specCount">;

type UseRawMaterialSpecificationFormParams = {
  initialBlocks?: SpecificationBlock[];
  isEditMode?: boolean;
  /** Raw material procurement: Create Lot flow — API-oriented copy and labels */
  createLotMode?: boolean;
  onSaveDraft?: (blocks: SpecificationBlock[]) => Promise<boolean | void> | boolean | void;
  onSubmit?: (blocks: SpecificationBlock[]) => Promise<boolean | void> | boolean | void;
  onBlocksChange?: (blocks: SpecificationBlock[]) => void;
  actionLoading?: boolean;
  pdfMeta?: unknown;
};

function specRowsFromApi(targetSpecs: MaterialSpecificationItemModel[] = []): SpecRow[] {
  return targetSpecs.map((specification) => ({
    specificationCode: specification.specificationCode,
    specification: specification.specificationName,
    specificationName: specification.specificationName,
    refRange: specification.formattedReferenceRange,
    analysedResult: "",
    remarks: "",
    isOutOfRange: false,
    referenceRange: {
      minValue: specification.referenceRange.minValue,
      maxValue: specification.referenceRange.maxValue,
      unit: specification.referenceRange.unit,
    },
  }));
}

function createLotFromSpecs(targetSpecs: MaterialSpecificationItemModel[] = []): MaterialLotBlock {
  return {
    lotNo: "",
    certificates: [],
    rows: specRowsFromApi(targetSpecs),
  };
}

function createBlock(material: string, targetSpecs: MaterialSpecificationItemModel[] = []): SpecificationBlock {
  const lot = createLotFromSpecs(targetSpecs);
  return {
    material,
    lotNo: lot.lotNo,
    supplyOrderNo: "",
    receiptDate: "",
    manufacturerName: "",
    certificates: lot.certificates,
    rows: lot.rows,
  };
}

function createMaterialGroup(material: string, targetSpecs: MaterialSpecificationItemModel[] = []): MaterialFormGroup {
  return {
    material,
    supplyOrderNo: "",
    receiptDate: "",
    manufacturerName: "",
    lots: [createLotFromSpecs(targetSpecs)],
  };
}

function cloneLotTemplate(templateRows: SpecRow[]): MaterialLotBlock {
  return {
    lotNo: "",
    certificates: [],
    rows: templateRows.map((row) => ({
      ...row,
      analysedResult: "",
      remarks: "",
      status: null,
      isOutOfRange: false,
    })),
  };
}


type SpecificationCacheMap = Record<string, MaterialSpecificationItemModel[]>;
type LoadingMap = Record<string, boolean>;

function blocksSignature(blocks: SpecificationBlock[]): string {
  return serializeMaterialBlocks(blocks);
}

export const useRawMaterialSpecificationForm = ({
  initialBlocks = [],
  isEditMode = false,
  createLotMode = false,
  onSaveDraft,
  onSubmit,
  onBlocksChange,
  actionLoading = false,
}: UseRawMaterialSpecificationFormParams) => {
  const [flatBlocks, setFlatBlocks] = useState<SpecificationBlock[]>([]);
  const [materialGroups, setMaterialGroups] = useState<MaterialFormGroup[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState("");
  const [submitConfirm, setSubmitConfirm] = useState(false);
  const [draftConfirm, setDraftConfirm] = useState(false);
  const [showFieldErrors, setShowFieldErrors] = useState(false);
  const [availableMaterials, setAvailableMaterials] = useState<MaterialOption[]>([]);
  const [loadingMaterials, setLoadingMaterials] = useState(true);
  const [addingMaterial, setAddingMaterial] = useState(false);
  const [specificationCache, setSpecificationCache] = useState<SpecificationCacheMap>({});
  const [loadingByMaterial, setLoadingByMaterial] = useState<LoadingMap>({});

  const showAlert = useAlertStore((state) => state.showAlert);
  const mode = useThemeStore((state) => state.mode);
  const theme = useMemo(() => getSourcingTheme(mode), [mode]);
  const formStrings = STRINGS.SOURCING.SPECIFICATION_FORM;
  const specStyles = theme.sourcing.rawMaterial.specificationForm;
  const onBlocksChangeRef = useRef(onBlocksChange);
  const lastSyncedBlocksSigRef = useRef("");

  const headerTitle = createLotMode ? formStrings.CREATE_LOT_BUILDER_TITLE : formStrings.TITLE;
  const headerSubtitle = createLotMode ? formStrings.CREATE_LOT_BUILDER_SUBTITLE : formStrings.SUBTITLE;

  const blocks = useMemo(
    () => (createLotMode ? flattenMaterialGroups(materialGroups) : flatBlocks),
    [createLotMode, flatBlocks, materialGroups]
  );

  const isMaterialLoading = useCallback(
    (materialCode: string) => Boolean(loadingByMaterial[materialCode]),
    [loadingByMaterial]
  );

  const fetchMaterialSpecifications = useCallback(
    async (materialCode: string): Promise<MaterialSpecificationItemModel[]> => {
      const code = materialCode.trim();
      if (!code) return [];

      const cached = specificationCache[code];
      if (cached) return cached;

      setLoadingByMaterial((prev) => ({ ...prev, [code]: true }));

      try {
        const response = await operationsController.fetchMaterialSpecificationList({ materialCode: code });

        if (!response?.success || !response.data) {
          const msg =
            response?.statusCode === 404
              ? STRINGS.SOURCING.SPECIFICATION_FORM.SPECIFICATIONS_NOT_FOUND
              : response?.message || STRINGS.SOURCING.SPECIFICATION_FORM.SPECIFICATIONS_FETCH_ERROR;
          showAlert(msg, "error");
          return [];
        }

        const specifications = response.data.specifications ?? [];
        setSpecificationCache((prev) => ({ ...prev, [code]: specifications }));
        return specifications;
      } catch (error) {
        showAlert(STRINGS.SOURCING.SPECIFICATION_FORM.SPECIFICATIONS_FETCH_ERROR, "error");
        return [];
      } finally {
        setLoadingByMaterial((prev) => ({ ...prev, [code]: false }));
      }
    },
    [showAlert, specificationCache]
  );

  useEffect(() => {
    onBlocksChangeRef.current = onBlocksChange;
  }, [onBlocksChange]);

  useEffect(() => {
    let isActive = true;

    const loadMaterials = async () => {
      setLoadingMaterials(true);

      try {
        const response = await operationsController.fetchAllMaterialsList();

        if (!isActive) return;

        if (response?.success && response?.data) {
          setAvailableMaterials(
            response.data.map(({ materialCode, materialName, specCount }) => ({
              materialCode,
              materialName,
              specCount,
            }))
          );
          return;
        }

        setAvailableMaterials([]);
        showAlert(response?.message || formStrings.MATERIALS_LOAD_FAILED, "error");
      } catch (error) {
        if (!isActive) return;
        setAvailableMaterials([]);
        showAlert(formStrings.MATERIALS_FETCH_ERROR, "error");
      } finally {
        if (isActive) {
          setLoadingMaterials(false);
        }
      }
    };

    void loadMaterials();

    return () => {
      isActive = false;
    };
  }, [formStrings.MATERIALS_FETCH_ERROR, formStrings.MATERIALS_LOAD_FAILED, showAlert]);

  /**
   * Hydrate from parent only for fill/edit. Create Lot keeps local state (casing-aligned);
   * echoing parent formBlocks here was resetting certificates after upload on remote clients.
   */
  useLayoutEffect(() => {
    if (createLotMode) {
      rmCertDebug("4.layoutEffect.skip", { reason: "createLotMode" });
      return;
    }
    if (initialBlocks.length === 0) return;

    const incomingSig = blocksSignature(initialBlocks);
    rmCertDebug("4.layoutEffect.run", {
      incomingSigLen: incomingSig.length,
      lastSyncedLen: lastSyncedBlocksSigRef.current.length,
      skip: incomingSig === lastSyncedBlocksSigRef.current,
      blocks: summarizeBlocks(initialBlocks),
    });
    if (incomingSig === lastSyncedBlocksSigRef.current) return;
    lastSyncedBlocksSigRef.current = incomingSig;
    setFlatBlocks(initialBlocks);
  }, [createLotMode, initialBlocks]);

  const blocksRef = useRef<SpecificationBlock[]>([]);
  blocksRef.current = blocks;

  const syncBlocksToParent = useCallback(
    (nextBlocks: SpecificationBlock[], source: string) => {
      const sig = blocksSignature(nextBlocks);
      const skip = sig === lastSyncedBlocksSigRef.current;
      rmCertDebug("5.syncBlocksToParent", {
        source,
        createLotMode,
        skip,
        sigLen: sig.length,
        blocks: summarizeBlocks(nextBlocks),
      });
      if (skip) return;
      lastSyncedBlocksSigRef.current = sig;
      startTransition(() => {
        rmCertDebug("6.onBlocksChange.invoke", { source, blockCount: nextBlocks.length });
        onBlocksChangeRef.current?.(nextBlocks);
      });
    },
    []
  );

  useEffect(() => {
    if (!onBlocksChangeRef.current) return;
    syncBlocksToParent(blocks, "effect:blocks");
  }, [blocks, syncBlocksToParent]);

  /** Create Lot: also sync when material groups change (cert upload updates lots before flatten memo). */
  useEffect(() => {
    if (!createLotMode || !onBlocksChangeRef.current) return;
    syncBlocksToParent(flattenMaterialGroups(materialGroups), "effect:materialGroups");
  }, [createLotMode, materialGroups, syncBlocksToParent]);

  const updateMaterialGroups = useCallback(
    (updater: MaterialFormGroup[] | ((previous: MaterialFormGroup[]) => MaterialFormGroup[])) => {
      setMaterialGroups((previous) =>
        typeof updater === "function" ? updater(previous) : updater
      );
    },
    []
  );

  const updateBlocks = useCallback(
    (updater: SpecificationBlock[] | ((previous: SpecificationBlock[]) => SpecificationBlock[])) => {
      setFlatBlocks((previous) =>
        typeof updater === "function" ? updater(previous) : updater
      );
    },
    []
  );

  const usedMaterialCodes = useMemo(
    () => new Set(materialGroups.map((g) => g.material)),
    [materialGroups]
  );

  const selectableMaterials = useMemo(
    () =>
      createLotMode
        ? availableMaterials.filter((m) => !usedMaterialCodes.has(m.materialCode))
        : availableMaterials,
    [availableMaterials, createLotMode, usedMaterialCodes]
  );

  const materialCount = createLotMode ? materialGroups.length : blocks.length;
  const lotCount = createLotMode
    ? materialGroups.reduce((sum, g) => sum + g.lots.length, 0)
    : blocks.length;

  const totalRows = useMemo(() => blocks.flatMap((block) => block.rows).length, [blocks]);
  const filledRows = useMemo(
    () => blocks.flatMap((block) => block.rows).filter((row) => row.analysedResult.trim() !== "").length,
    [blocks]
  );
  const hasBlocks = createLotMode ? materialGroups.length > 0 : blocks.length > 0;

  const mandatoryComplete = useMemo(
    () =>
      createLotMode ? areMaterialGroupsMandatoryComplete(materialGroups) : areBlocksMandatoryComplete(blocks),
    [blocks, createLotMode, materialGroups]
  );

  const allAnalyzedFilled = useMemo(() => areAllAnalyzedResultsFilled(blocks), [blocks]);

  const canSaveDraft = useMemo(
    () => hasBlocks && mandatoryComplete && allAnalyzedFilled,
    [allAnalyzedFilled, hasBlocks, mandatoryComplete]
  );

  const canSubmit = canSaveDraft;
  const allMaterialsAdded = createLotMode && !loadingMaterials && selectableMaterials.length === 0 && availableMaterials.length > 0;

  const actionHelperText = useMemo(() => {
    if (!hasBlocks) {
      return formStrings.NOT_READY_TITLE;
    }
    if (!mandatoryComplete || !allAnalyzedFilled) {
      return formStrings.MANDATORY_FIELDS_PENDING;
    }

    if (createLotMode) {
      return `${materialCount} ${materialCount > 1 ? formStrings.MATERIAL_SUFFIX_PLURAL : formStrings.MATERIAL_SUFFIX} · ${lotCount} ${lotCount > 1 ? formStrings.LOT_SUFFIX_PLURAL : formStrings.LOT_SUFFIX} · ${filledRows}/${totalRows} ${formStrings.RESULTS_ENTERED_SUFFIX}`;
    }

    return `${blocks.length} ${blocks.length > 1 ? formStrings.MATERIAL_SUFFIX_PLURAL : formStrings.MATERIAL_SUFFIX} · ${filledRows}/${totalRows} ${formStrings.RESULTS_ENTERED_SUFFIX}`;
  }, [
    blocks.length,
    createLotMode,
    filledRows,
    formStrings.LOT_SUFFIX,
    formStrings.LOT_SUFFIX_PLURAL,
    formStrings.MATERIAL_SUFFIX,
    formStrings.MATERIAL_SUFFIX_PLURAL,
    formStrings.NOT_READY_TITLE,
    formStrings.RESULTS_ENTERED_SUFFIX,
    hasBlocks,
    lotCount,
    allAnalyzedFilled,
    mandatoryComplete,
    materialCount,
    totalRows,
    formStrings.MANDATORY_FIELDS_PENDING,
  ]);

  const disableActionBar = actionLoading || !hasBlocks;

  const handleAdd = useCallback(async () => {
    if (!selectedMaterial || addingMaterial) return;

    setAddingMaterial(true);

    try {
      const specifications = await fetchMaterialSpecifications(selectedMaterial);
      if (!specifications.length) return;

      if (createLotMode) {
        updateMaterialGroups((previous) => [...previous, createMaterialGroup(selectedMaterial, specifications)]);
      } else {
        updateBlocks((previous) => [...previous, createBlock(selectedMaterial, specifications)]);
      }
      setSelectedMaterial("");
    } finally {
      setAddingMaterial(false);
    }
  }, [addingMaterial, createLotMode, fetchMaterialSpecifications, selectedMaterial, updateBlocks, updateMaterialGroups]);

  const handleAddLot = useCallback(
    (materialIndex: number) => {
      updateMaterialGroups((previous) =>
        previous.map((group, idx) => {
          if (idx !== materialIndex) return group;
          const template = group.lots[0]?.rows ?? [];
          return { ...group, lots: [...group.lots, cloneLotTemplate(template)] };
        })
      );
    },
    [updateMaterialGroups]
  );

  const handleUpdateMaterial = useCallback(
    (materialIndex: number, partial: Partial<Pick<MaterialFormGroup, "supplyOrderNo" | "receiptDate" | "manufacturerName">>) => {
      updateMaterialGroups((previous) =>
        previous.map((group, idx) => (idx === materialIndex ? { ...group, ...partial } : group))
      );
    },
    [updateMaterialGroups]
  );

  const handleUpdateLot = useCallback(
    (materialIndex: number, lotIndex: number, lot: MaterialLotBlock) => {
      rmCertDebug("4.handleUpdateLot", {
        materialIndex,
        lotIndex,
        createLotMode,
        lot: summarizeLotCerts(lot),
      });
      updateMaterialGroups((previous) => {
        const nextGroups = previous.map((group, gIdx) => {
          if (gIdx !== materialIndex) return group;
          return {
            ...group,
            lots: group.lots.map((existing, lIdx) => (lIdx === lotIndex ? lot : existing)),
          };
        });
        rmCertDebug("4.handleUpdateLot.state", {
          groups: summarizeMaterialGroups(nextGroups),
        });
        if (createLotMode) {
          queueMicrotask(() =>
            syncBlocksToParent(flattenMaterialGroups(nextGroups), "microtask:handleUpdateLot")
          );
        }
        return nextGroups;
      });
    },
    [createLotMode, syncBlocksToParent, updateMaterialGroups]
  );

  const handleRemoveMaterial = useCallback(
    (materialIndex: number) => {
      updateMaterialGroups((previous) => previous.filter((_, idx) => idx !== materialIndex));
    },
    [updateMaterialGroups]
  );

  const handleRemoveLot = useCallback(
    (materialIndex: number, lotIndex: number) => {
      updateMaterialGroups((previous) =>
        previous.map((group, gIdx) => {
          if (gIdx !== materialIndex || group.lots.length <= 1) return group;
          return { ...group, lots: group.lots.filter((_, lIdx) => lIdx !== lotIndex) };
        })
      );
    },
    [updateMaterialGroups]
  );

  const handleUpdateBlock = useCallback(
    (index: number, updatedBlock: SpecificationBlock) => {
      const rowsWithRange = updatedBlock.rows.map((row) => {
        if (row.analysedResult === undefined) return row;
        return {
          ...row,
          isOutOfRange: computeIsOutOfRange(row.analysedResult, row.referenceRange),
        };
      });
      updateBlocks((previous) =>
        previous.map((block, currentIndex) =>
          currentIndex === index ? { ...updatedBlock, rows: rowsWithRange } : block
        )
      );
    },
    [updateBlocks]
  );

  const handleRemoveBlock = useCallback(
    (index: number) => {
      updateBlocks((previous) => previous.filter((_, currentIndex) => currentIndex !== index));
    },
    [updateBlocks]
  );

  const openDraftConfirm = useCallback(() => {
    if (actionLoading || !hasBlocks) return;
    if (!canSaveDraft) {
      setShowFieldErrors(true);
      return;
    }
    setDraftConfirm(true);
  }, [actionLoading, canSaveDraft, hasBlocks]);

  const openSubmitConfirm = useCallback(() => {
    if (actionLoading) return;
    if (!canSubmit) {
      setShowFieldErrors(true);
      return;
    }
    setSubmitConfirm(true);
  }, [actionLoading, canSubmit]);

  const closeDraftConfirm = useCallback(() => {
    setDraftConfirm(false);
  }, []);

  const closeSubmitConfirm = useCallback(() => {
    setSubmitConfirm(false);
  }, []);

  const handleConfirmDraft = useCallback(async () => {
    setDraftConfirm(false);
    rmCertDebug("7.saveDraft.blocksRef", { blocks: summarizeBlocks(blocksRef.current) });
    await onSaveDraft?.(blocksRef.current);
  }, [onSaveDraft]);

  const handleConfirmSubmit = useCallback(async () => {
    setSubmitConfirm(false);
    rmCertDebug("7.submit.blocksRef", { blocks: summarizeBlocks(blocksRef.current) });
    await onSubmit?.(blocksRef.current);
  }, [onSubmit]);

  return {
    actionHelperText,
    addingMaterial,
    allMaterialsAdded,
    availableMaterials,
    blocks,
    canSubmit,
    canSaveDraft,
    showFieldErrors,
    mandatoryComplete,
    closeDraftConfirm,
    closeSubmitConfirm,
    createLotMode,
    disableActionBar,
    draftConfirm,
    filledRows,
    formStrings,
    handleAdd,
    handleAddLot,
    handleConfirmDraft,
    handleConfirmSubmit,
    handleRemoveBlock,
    handleRemoveLot,
    handleRemoveMaterial,
    handleUpdateBlock,
    handleUpdateLot,
    handleUpdateMaterial,
    hasBlocks,
    headerSubtitle,
    headerTitle,
    isEditMode,
    isMaterialLoading,
    loadingMaterials,
    lotCount,
    materialCount,
    materialGroups,
    mode,
    openDraftConfirm,
    openSubmitConfirm,
    selectableMaterials,
    selectedMaterial,
    setSelectedMaterial,
    specStyles,
    submitConfirm,
    theme,
    totalRows,
  };
};

/** @deprecated Prefer useRawMaterialSpecificationForm */
export const useSpecificationFormBuilderHook = useRawMaterialSpecificationForm;

export default useRawMaterialSpecificationForm;
