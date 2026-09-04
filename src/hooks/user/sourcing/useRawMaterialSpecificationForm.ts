import {
  startTransition,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { STRINGS } from "../../../app/config/strings";
import { useAlertStore } from "../../../app/store/alertStore";
import { useThemeStore } from "../../../app/store/themeStore";
import getSourcingTheme from "../../../app/theme/custom_themes/user/sourcing/sourcing_theme";
import { operationsController } from "../../../controllers/user/operationsController";
import type {
  MaterialsListGrade,
  MaterialsListItem,
} from "../../../data/models/user/MaterialsListModel";
import {
  getMaterialGrades,
  isMaterialSelectionUsed,
  materialRequiresGradeSelection,
  materialSelectionKey,
} from "../../../data/models/user/MaterialsListModel";
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
  hasIncompleteCertificateUploads,
  serializeMaterialBlocks,
} from "../../../data/models/user/RawMaterialProcurementModel";
import {
  areAllAnalyzedResultsFilled,
  areBlocksMandatoryComplete,
  areBlocksUnitComplete,
  areMaterialGroupsMandatoryComplete,
  areMaterialGroupsUnitComplete,
  blockRowPath,
  isMaterialMetaComplete,
  validateRawMaterialSourcing,
} from "../../../data/validation/adapters/rawMaterialSourcing.validation";
import { fieldError, hasValidationErrors } from "../../../data/validation/validationErrors";
import type { ValidationErrors } from "../../../data/validation/submissionIntent";
import type { ValidationAttemptFlags } from "../../../ui/components/validation/useValidationDisplay";
import {
  rmCertDebug,
  summarizeBlocks,
  summarizeLotCerts,
  summarizeMaterialGroups,
} from "../../../utils/rawMaterialCertUploadDebug";

export type SpecificationRow = SpecRow;
export type SpecificationBlock = MaterialBlock;
export type SpecificationBlockUpdater =
  | SpecificationBlock
  | ((previous: SpecificationBlock) => SpecificationBlock);

type MaterialOption = MaterialsListItem;

type UseRawMaterialSpecificationFormParams = {
  initialBlocks?: SpecificationBlock[];
  isEditMode?: boolean;
  /** Raw material Sourcing: Create Lot flow — API-oriented copy and labels */
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
    acemQcResult: "",
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

function createBlock(
  material: string,
  targetSpecs: MaterialSpecificationItemModel[] = [],
): SpecificationBlock {
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

function createMaterialGroup(
  material: string,
  targetSpecs: MaterialSpecificationItemModel[] = [],
  grade?: MaterialsListGrade | null,
): MaterialFormGroup {
  return {
    material,
    gradeCode: grade?.gradeCode,
    gradeId: grade?.gradeId,
    gradeName: grade?.gradeName,
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
      acemQcResult: "",
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
  const [selectedGrade, setSelectedGrade] = useState("");
  const [submitConfirm, setSubmitConfirm] = useState(false);
  const [draftConfirm, setDraftConfirm] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [validationAttempt, setValidationAttempt] = useState<ValidationAttemptFlags>({
    format: false,
    unit: false,
    submit: false,
  });
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
  const headerSubtitle = createLotMode
    ? formStrings.CREATE_LOT_BUILDER_SUBTITLE
    : formStrings.SUBTITLE;

  const blocks = useMemo(
    () => (createLotMode ? flattenMaterialGroups(materialGroups) : flatBlocks),
    [createLotMode, flatBlocks, materialGroups],
  );

  const isMaterialLoading = useCallback(
    (materialCode: string) => Boolean(loadingByMaterial[materialCode]),
    [loadingByMaterial],
  );

  const fetchMaterialSpecifications = useCallback(
    async (
      materialCode: string,
      gradeCode?: string,
    ): Promise<MaterialSpecificationItemModel[]> => {
      const code = materialCode.trim();
      if (!code) return [];

      const cacheKey = materialSelectionKey(code, gradeCode);
      const cached = specificationCache[cacheKey];
      if (cached !== undefined) {
        if (!cached.length) {
          showAlert(STRINGS.SOURCING.SPECIFICATION_FORM.SPECIFICATIONS_UNAVAILABLE, "warning");
        }
        return cached;
      }

      setLoadingByMaterial((prev) => ({ ...prev, [cacheKey]: true }));

      try {
        const response = await operationsController.fetchMaterialSpecificationList({
          materialCode: code,
          gradeCode: gradeCode?.trim() || null,
        });

        if (!response?.success || !response.data) {
          const msg =
            response?.statusCode === 404
              ? STRINGS.SOURCING.SPECIFICATION_FORM.SPECIFICATIONS_NOT_FOUND
              : response?.message || STRINGS.SOURCING.SPECIFICATION_FORM.SPECIFICATIONS_FETCH_ERROR;
          showAlert(msg, "error");
          return [];
        }

        const specifications = response.data.specifications ?? [];
        setSpecificationCache((prev) => ({ ...prev, [cacheKey]: specifications }));

        if (!specifications.length) {
          showAlert(STRINGS.SOURCING.SPECIFICATION_FORM.SPECIFICATIONS_UNAVAILABLE, "warning");
        }

        return specifications;
      } catch (error) {
        showAlert(STRINGS.SOURCING.SPECIFICATION_FORM.SPECIFICATIONS_FETCH_ERROR, "error");
        return [];
      } finally {
        setLoadingByMaterial((prev) => ({ ...prev, [cacheKey]: false }));
      }
    },
    [showAlert, specificationCache],
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
          setAvailableMaterials(response.data);
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
    const localSig = blocksSignature(flatBlocks);
    if (localSig !== incomingSig && lastSyncedBlocksSigRef.current === localSig) {
      return;
    }
    lastSyncedBlocksSigRef.current = incomingSig;
    setFlatBlocks(initialBlocks);
    setValidationErrors({});
    setValidationAttempt({ format: false, unit: false, submit: false });
  }, [createLotMode, flatBlocks, initialBlocks]);

  const blocksRef = useRef<SpecificationBlock[]>([]);
  blocksRef.current = blocks;

  const syncBlocksToParent = useCallback((nextBlocks: SpecificationBlock[], source: string) => {
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
  }, []);

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
        typeof updater === "function" ? updater(previous) : updater,
      );
    },
    [],
  );

  const updateBlocks = useCallback(
    (
      updater: SpecificationBlock[] | ((previous: SpecificationBlock[]) => SpecificationBlock[]),
    ) => {
      setFlatBlocks((previous) => (typeof updater === "function" ? updater(previous) : updater));
    },
    [],
  );

  const usedMaterialKeys = useMemo(
    () =>
      new Set(
        materialGroups.map((group) => materialSelectionKey(group.material, group.gradeCode)),
      ),
    [materialGroups],
  );

  const selectableMaterials = useMemo(
    () =>
      createLotMode
        ? availableMaterials.filter(
            (material) => !isMaterialSelectionUsed(availableMaterials, material.materialCode, usedMaterialKeys),
          )
        : availableMaterials,
    [availableMaterials, createLotMode, usedMaterialKeys],
  );

  const showGradeSelect = Boolean(
    createLotMode && selectedMaterial && materialRequiresGradeSelection(availableMaterials, selectedMaterial),
  );

  const selectableGrades = useMemo(() => {
    if (!showGradeSelect || !selectedMaterial) return [];
    return getMaterialGrades(availableMaterials, selectedMaterial).filter(
      (grade) => !usedMaterialKeys.has(materialSelectionKey(selectedMaterial, grade.gradeCode)),
    );
  }, [availableMaterials, selectedMaterial, showGradeSelect, usedMaterialKeys]);

  const handleMaterialChange = useCallback((materialCode: string) => {
    setSelectedMaterial(materialCode);
    setSelectedGrade("");
  }, []);

  const materialCount = createLotMode ? materialGroups.length : blocks.length;
  const lotCount = createLotMode
    ? materialGroups.reduce((sum, g) => sum + g.lots.length, 0)
    : blocks.length;

  const totalRows = useMemo(() => blocks.flatMap((block) => block.rows).length, [blocks]);
  const filledRows = useMemo(
    () =>
      blocks.flatMap((block) => block.rows).filter((row) => row.analysedResult.trim() !== "")
        .length,
    [blocks],
  );
  const hasBlocks = createLotMode ? materialGroups.length > 0 : blocks.length > 0;

  const unitComplete = useMemo(
    () =>
      createLotMode
        ? areMaterialGroupsUnitComplete(materialGroups)
        : areBlocksUnitComplete(blocks),
    [blocks, createLotMode, materialGroups],
  );

  const mandatoryComplete = useMemo(
    () =>
      createLotMode
        ? areMaterialGroupsMandatoryComplete(materialGroups)
        : areBlocksMandatoryComplete(blocks),
    [blocks, createLotMode, materialGroups],
  );

  const allAnalyzedFilled = useMemo(() => areAllAnalyzedResultsFilled(blocks), [blocks]);

  const activeValidationTier = validationAttempt.submit
    ? "SUBMIT"
    : validationAttempt.unit
      ? "UNIT"
      : validationAttempt.format
        ? "FORMAT"
        : null;

  useEffect(() => {
    if (!activeValidationTier) return;
    setValidationErrors(validateRawMaterialSourcing(blocks, activeValidationTier));
  }, [activeValidationTier, blocks]);

  const formatErrors = useMemo(
    () => validateRawMaterialSourcing(blocks, "FORMAT"),
    [blocks],
  );

  const canSaveDraft = useMemo(
    () =>
      hasBlocks &&
      unitComplete &&
      !hasValidationErrors(formatErrors) &&
      !hasIncompleteCertificateUploads(blocks),
    [blocks, formatErrors, hasBlocks, unitComplete],
  );

  const canSubmit = useMemo(() => {
    const submitErrors = validateRawMaterialSourcing(blocks, "SUBMIT");
    return (
      hasBlocks &&
      mandatoryComplete &&
      allAnalyzedFilled &&
      !hasValidationErrors(submitErrors) &&
      !hasIncompleteCertificateUploads(blocks)
    );
  }, [allAnalyzedFilled, blocks, hasBlocks, mandatoryComplete]);
  const allMaterialsAdded =
    createLotMode &&
    !loadingMaterials &&
    selectableMaterials.length === 0 &&
    availableMaterials.length > 0;

  const canAddSelection =
    Boolean(selectedMaterial) &&
    (!showGradeSelect || Boolean(selectedGrade)) &&
    !addingMaterial &&
    !isMaterialLoading(materialSelectionKey(selectedMaterial, selectedGrade || undefined));

  const actionHelperText = useMemo(() => {
    if (!hasBlocks) {
      return formStrings.NOT_READY_TITLE;
    }
    if (!unitComplete) {
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
    unitComplete,
    materialCount,
    totalRows,
    formStrings.MANDATORY_FIELDS_PENDING,
  ]);

  const disableActionBar = actionLoading || !hasBlocks;

  const handleAdd = useCallback(async () => {
    if (!selectedMaterial || addingMaterial) return;
    if (showGradeSelect && !selectedGrade) return;

    setAddingMaterial(true);

    try {
      const grade = showGradeSelect
        ? selectableGrades.find((item) => item.gradeCode === selectedGrade) ??
          getMaterialGrades(availableMaterials, selectedMaterial).find(
            (item) => item.gradeCode === selectedGrade,
          )
        : null;
      const specifications = await fetchMaterialSpecifications(
        selectedMaterial,
        grade?.gradeCode,
      );
      if (!specifications.length) return;

      if (createLotMode) {
        updateMaterialGroups((previous) => [
          ...previous,
          createMaterialGroup(selectedMaterial, specifications, grade),
        ]);
      } else {
        updateBlocks((previous) => [...previous, createBlock(selectedMaterial, specifications)]);
      }
      setSelectedMaterial("");
      setSelectedGrade("");
    } finally {
      setAddingMaterial(false);
    }
  }, [
    addingMaterial,
    availableMaterials,
    createLotMode,
    fetchMaterialSpecifications,
    selectableGrades,
    selectedGrade,
    selectedMaterial,
    showGradeSelect,
    updateBlocks,
    updateMaterialGroups,
  ]);

  const handleAddLot = useCallback(
    (materialIndex: number) => {
      const group = materialGroups[materialIndex];
      if (!group || !isMaterialMetaComplete(group)) {
        setValidationAttempt((previous) => ({ ...previous, format: true, unit: true }));
        setValidationErrors(validateRawMaterialSourcing(blocks, "UNIT"));
        return;
      }
      updateMaterialGroups((previous) =>
        previous.map((item, idx) => {
          if (idx !== materialIndex) return item;
          const template = item.lots[0]?.rows ?? [];
          return { ...item, lots: [...item.lots, cloneLotTemplate(template)] };
        }),
      );
    },
    [blocks, materialGroups, updateMaterialGroups],
  );

  const handleUpdateMaterial = useCallback(
    (
      materialIndex: number,
      partial: Partial<
        Pick<MaterialFormGroup, "supplyOrderNo" | "receiptDate" | "manufacturerName">
      >,
    ) => {
      setValidationAttempt((previous) => ({ ...previous, format: true }));
      updateMaterialGroups((previous) =>
        previous.map((group, idx) => (idx === materialIndex ? { ...group, ...partial } : group)),
      );
    },
    [updateMaterialGroups],
  );

  const handleUpdateLot = useCallback(
    (materialIndex: number, lotIndex: number, updater: MaterialLotBlock | ((prev: MaterialLotBlock) => MaterialLotBlock)) => {
      setValidationAttempt((previous) => ({ ...previous, format: true }));
      updateMaterialGroups((previous) => {
        const nextGroups = previous.map((group, gIdx) => {
          if (gIdx !== materialIndex) return group;
          return {
            ...group,
            lots: group.lots.map((existing, lIdx) => {
              if (lIdx !== lotIndex) return existing;
              const updatedLot = typeof updater === "function" ? updater(existing) : updater;
              const rowsWithRange = updatedLot.rows.map((row) => {
                if (row.analysedResult === undefined) return row;
                return {
                  ...row,
                  isOutOfRange: computeIsOutOfRange(row.analysedResult, row.referenceRange),
                };
              });
              return { ...updatedLot, rows: rowsWithRange };
            }),
          };
        });
        rmCertDebug("4.handleUpdateLot.state", {
          groups: summarizeMaterialGroups(nextGroups),
        });
        if (createLotMode) {
          queueMicrotask(() =>
            syncBlocksToParent(flattenMaterialGroups(nextGroups), "microtask:handleUpdateLot"),
          );
        }
        return nextGroups;
      });
    },
    [createLotMode, syncBlocksToParent, updateMaterialGroups],
  );

  const handleRemoveMaterial = useCallback(
    (materialIndex: number) => {
      updateMaterialGroups((previous) => previous.filter((_, idx) => idx !== materialIndex));
    },
    [updateMaterialGroups],
  );

  const handleRemoveLot = useCallback(
    (materialIndex: number, lotIndex: number) => {
      updateMaterialGroups((previous) =>
        previous.map((group, gIdx) => {
          if (gIdx !== materialIndex || group.lots.length <= 1) return group;
          return { ...group, lots: group.lots.filter((_, lIdx) => lIdx !== lotIndex) };
        }),
      );
    },
    [updateMaterialGroups],
  );

  const handleUpdateBlock = useCallback(
    (index: number, updater: SpecificationBlockUpdater) => {
      setValidationAttempt((previous) => ({ ...previous, format: true }));
      updateBlocks((previous) =>
        previous.map((block, currentIndex) => {
          if (currentIndex !== index) return block;
          const updatedBlock = typeof updater === "function" ? updater(block) : updater;
          const rowsWithRange = updatedBlock.rows.map((row) => {
            if (row.analysedResult === undefined) return row;
            return {
              ...row,
              isOutOfRange: computeIsOutOfRange(row.analysedResult, row.referenceRange),
            };
          });
          return { ...updatedBlock, rows: rowsWithRange };
        }),
      );
    },
    [updateBlocks],
  );

  const getAnalysedResultError = useCallback(
    (blockIndex: number, rowIndex: number, touched: boolean) => {
      const path = blockRowPath(blockIndex, rowIndex, "analysedResult");
      if (validationAttempt.submit) {
        return fieldError(validateRawMaterialSourcing(blocks, "SUBMIT"), path);
      }
      if (validationAttempt.unit) {
        return fieldError(validateRawMaterialSourcing(blocks, "UNIT"), path);
      }
      if (touched) {
        return fieldError(validateRawMaterialSourcing(blocks, "FORMAT"), path);
      }
      return undefined;
    },
    [blocks, validationAttempt.submit, validationAttempt.unit],
  );

  const handleRemoveBlock = useCallback(
    (index: number) => {
      updateBlocks((previous) => previous.filter((_, currentIndex) => currentIndex !== index));
    },
    [updateBlocks],
  );

  const openDraftConfirm = useCallback(() => {
    if (actionLoading || !hasBlocks) return;
    setValidationAttempt((previous) => ({ ...previous, format: true, unit: true }));
    const unitErrors = validateRawMaterialSourcing(blocks, "UNIT");
    setValidationErrors(unitErrors);
    if (hasValidationErrors(unitErrors)) {
      return;
    }
    if (!canSaveDraft) {
      if (hasIncompleteCertificateUploads(blocks)) {
        showAlert(formStrings.CERT_UPLOAD_PENDING, "warning");
      }
      return;
    }
    setDraftConfirm(true);
  }, [actionLoading, blocks, canSaveDraft, formStrings.CERT_UPLOAD_PENDING, hasBlocks, showAlert]);

  const openSubmitConfirm = useCallback(() => {
    if (actionLoading) return;
    setValidationAttempt({ format: true, unit: true, submit: true });
    const submitErrors = validateRawMaterialSourcing(blocks, "SUBMIT");
    setValidationErrors(submitErrors);
    if (hasValidationErrors(submitErrors)) {
      return;
    }
    if (!canSubmit) {
      if (hasIncompleteCertificateUploads(blocks)) {
        showAlert(formStrings.CERT_UPLOAD_PENDING, "warning");
      }
      return;
    }
    setSubmitConfirm(true);
  }, [actionLoading, blocks, canSubmit, formStrings.CERT_UPLOAD_PENDING, showAlert]);

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
    validationErrors,
    validationAttempt,
    /** @deprecated Use validationAttempt.format */
    showTypeErrors: validationAttempt.format,
    /** @deprecated Use validationAttempt.submit */
    showFieldErrors: validationAttempt.submit,
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
    getAnalysedResultError,
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
    selectableGrades,
    showGradeSelect,
    canAddSelection,
    selectedMaterial,
    selectedGrade,
    setSelectedMaterial: handleMaterialChange,
    setSelectedGrade,
    specStyles,
    submitConfirm,
    theme,
    totalRows,
  };
};

/** @deprecated Prefer useRawMaterialSpecificationForm */
export const useSpecificationFormBuilderHook = useRawMaterialSpecificationForm;

export default useRawMaterialSpecificationForm;
