import { useEffect, useMemo, useRef, useState } from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import { STRINGS } from "../../../../../app/config/strings";
import { QC_DIVISION_BRAND } from "../../../../../app/theme/custom_themes/user/qualityControl/tokens";
import getManufacturingTheme from "../../../../../app/theme/custom_themes/user/manufacturing/manufacturing_theme";
import { useThemeStore } from "../../../../../app/store/themeStore";
import type {
  QcDivisionEntry,
  QcDivisionEntryValues,
} from "../../../../../data/models/user/QualityControlFormModel";
import { getSchemaForDivisionEntry } from "../../../../../hooks/user/qualityControl/qcDivisionEntries";
import {
  ensureWeightmentRowsForPremixMaterials,
  filterWeightmentSheetForPremix,
  hydrateProcessingMaterialValues,
  mergeWeightmentSheetForPremix,
  resolveQcProcessingWeightmentSheet,
} from "../../../../../hooks/user/qualityControl/qcProcessingMaterials";
import { normalizeSheetMaterialsForWeightmentCompare } from "../../../../../data/models/user/rawMaterialWeightmentValidation";
import type { QualityControlFormState } from "../../../../../data/models/user/QualityControlFormModel";
import type {
  RawMaterialPrepMaterialProcessSlot,
  RawMaterialPrepWeightmentSheet,
} from "../../../../../data/models/user/RawMaterialPreparationModel";
import { hydratePremixProcessSlot } from "../../../../../data/models/user/RawMaterialPreparationModel";
import type { IdentificationSheet } from "../../../../../data/models/admin/BatchManagement/BatchManagementModel";
import type { SchemaFormValues } from "@/data/models/shared/sectionFormTypes";
import {
  UserWorkflowTabNav,
  type UserWorkflowNavTab,
} from "../../../../components/custom/UserWorkflowStepPager";
import SubmitForApprovalButton from "../../../../components/common/SubmitForApprovalButton";
import RawMaterialWeightmentSheetPanel from "../../manufacturing/RawMaterial/RawMaterialWeightmentSheetPanel";
import QCSchemaBufferingLoader from "./QCSchemaBufferingLoader";
import QCDivisionSavedSectionsDisplay from "./components/QCDivisionSavedSectionsDisplay";
import type { QCDivisionEntryUnitActions } from "./QCDivisionEntryPanel";
import { rmpUiKeyShowsProcessPanel } from "../../../../../data/models/user/rmp/rmpMaterialUiRegistry";
import RawMaterialMaterialProcessPanel from "../../manufacturing/RawMaterial/materialProcess/RawMaterialMaterialProcessPanel";
import type { ValidationAttemptFlags } from "../../../../components/validation/useValidationDisplay";
import type { ValidationErrors } from "../../../../../data/validation/submissionIntent";
import { focusRmpField } from "../../../../../data/validation/adapters/rawMaterialPreparation.validation";
import {
  lotOptionsForMaterial,
  quantityPerPremixForMaterial,
} from "../../../../../hooks/user/qualityControl/qcProcessing.validation";

const S = STRINGS.QUALITY_CONTROL.QC_DIVISION;

type QCProcessingMaterialsPanelProps = {
  formData: QualityControlFormState;
  entries: QcDivisionEntry[];
  entryValuesById: Record<string, QcDivisionEntryValues>;
  subDepartmentId?: number;
  batchId?: string;
  batchPayload?: unknown;
  divisionAutoPopulateData?: Record<string, unknown> | null;
  readOnly?: boolean;
  fieldsDisabled?: boolean;
  schemaLoading?: boolean;
  schemaError?: string | null;
  onEntryValuesChange: (
    entryId: string,
    values: SchemaFormValues | ((prev: SchemaFormValues) => SchemaFormValues),
  ) => void;
  onProcessingWeightmentSheetChange?: (
    next:
      | RawMaterialPrepWeightmentSheet
      | ((prev: RawMaterialPrepWeightmentSheet) => RawMaterialPrepWeightmentSheet),
  ) => void;
  onProcessingProcessChange?: (
    entryId: string,
    slotState: RawMaterialPrepMaterialProcessSlot,
  ) => void;
  weightmentErrors?: ValidationErrors;
  validationAttempt?: ValidationAttemptFlags;
  processingFieldErrors?: Record<string, ValidationErrors>;
  processingValidationFocusRequest?: {
    id: number;
    entryId: string;
    fieldPath: string;
  } | null;
  unitActions?: QCDivisionEntryUnitActions | null;
};

const QCProcessingMaterialsPanel = ({
  formData,
  entries,
  entryValuesById,
  subDepartmentId,
  batchId,
  batchPayload = null,
  divisionAutoPopulateData = null,
  readOnly = false,
  fieldsDisabled = false,
  schemaLoading = false,
  schemaError: _schemaError = null,
  onEntryValuesChange,
  onProcessingWeightmentSheetChange,
  onProcessingProcessChange,
  weightmentErrors = {},
  validationAttempt = { format: false, unit: false, submit: false },
  processingFieldErrors = {},
  processingValidationFocusRequest = null,
  unitActions = null,
}: QCProcessingMaterialsPanelProps) => {
  const BRAND = QC_DIVISION_BRAND;
  const mode = useThemeStore((state) => state.mode);
  const manufacturingTheme = useMemo(() => getManufacturingTheme(mode), [mode]);
  const [activeMaterialIndex, setActiveMaterialIndex] = useState(0);
  const [mappingValues, setMappingValues] = useState(false);
  const appliedSectionsByEntryRef = useRef<Record<string, string>>({});

  const materialEntries = useMemo(
    () => entries.filter((entry) => entry.kind === "PROCESSING_MATERIAL"),
    [entries],
  );

  useEffect(() => {
    if (materialEntries.length === 0) {
      setActiveMaterialIndex(0);
      return;
    }
    setActiveMaterialIndex((prev) => Math.min(prev, materialEntries.length - 1));
  }, [materialEntries.length]);

  // RMP parity: switch material tab then focus the first invalid lot field.
  useEffect(() => {
    if (!processingValidationFocusRequest?.entryId) return;
    const idx = materialEntries.findIndex(
      (entry) => entry.entryId === processingValidationFocusRequest.entryId,
    );
    if (idx >= 0) setActiveMaterialIndex(idx);
    const fieldPath = processingValidationFocusRequest.fieldPath;
    let tries = 0;
    const tryFocus = () => {
      tries += 1;
      if (focusRmpField(fieldPath)) return;
      if (tries < 8) window.setTimeout(tryFocus, 50);
    };
    const timer = window.setTimeout(tryFocus, 80);
    return () => clearTimeout(timer);
  }, [processingValidationFocusRequest, materialEntries]);

  const activeEntry = materialEntries[activeMaterialIndex] ?? null;
  const activeValues = activeEntry ? entryValuesById[activeEntry.entryId] : null;
  const activeSchema = activeEntry ? getSchemaForDivisionEntry(formData, activeEntry) : null;
  const schemaUnavailable = Boolean(activeEntry?.schemaUnavailable);

  const showWeightment = Boolean(
    schemaUnavailable || materialEntries.some((entry) => entry.schemaUnavailable),
  );

  const activePremixNoForWeightment = useMemo(() => {
    const fromActive = Number(activeEntry?.premixNo);
    if (Number.isFinite(fromActive) && fromActive > 0) return fromActive;
    const fromPanel = Number(materialEntries[0]?.premixNo);
    return Number.isFinite(fromPanel) && fromPanel > 0 ? fromPanel : 0;
  }, [activeEntry?.premixNo, materialEntries]);

  const fullWeightmentSheet = useMemo(() => {
    if (!showWeightment) return null;
    const manufacturing =
      (divisionAutoPopulateData as { __manufacturingDivisionData?: unknown } | null)
        ?.__manufacturingDivisionData ?? divisionAutoPopulateData;
    return resolveQcProcessingWeightmentSheet(
      formData.processingWeightmentSheet,
      manufacturing,
      batchPayload,
    );
  }, [
    batchPayload,
    divisionAutoPopulateData,
    formData.processingWeightmentSheet,
    showWeightment,
  ]);

  const identificationSheet = useMemo((): IdentificationSheet | null => {
    const root =
      (batchPayload && typeof batchPayload === "object"
        ? (batchPayload as Record<string, unknown>)
        : null) ??
      (divisionAutoPopulateData && typeof divisionAutoPopulateData === "object"
        ? (divisionAutoPopulateData as Record<string, unknown>)
        : null);
    if (!root) return null;
    const nestedBatch =
      root.batch && typeof root.batch === "object"
        ? (root.batch as Record<string, unknown>)
        : null;
    const sheetRaw =
      root.identificationSheet ??
      nestedBatch?.identificationSheet ??
      null;
    if (!sheetRaw || typeof sheetRaw !== "object") return null;
    const materials = normalizeSheetMaterialsForWeightmentCompare(
      (sheetRaw as IdentificationSheet).materials,
    );
    if (!materials.length) return null;
    return {
      ...(sheetRaw as IdentificationSheet),
      materials,
    };
  }, [batchPayload, divisionAutoPopulateData]);

  // Seed QC-owned weighment from autopopulate/batch once — table shows API rows first;
  // compare stays off until the user checks it (no auto rewrite of entered values).
  useEffect(() => {
    if (!showWeightment || !onProcessingWeightmentSheetChange) return;
    if (formData.processingWeightmentSheet != null) return;
    if (!fullWeightmentSheet) return;
    const stampedDetails = (fullWeightmentSheet.weightmentDetails ?? []).map((row) => ({
      ...row,
      scopeMaterialCode:
        String(row.scopeMaterialCode ?? "").trim() ||
        String(row.materialCode ?? "").trim() ||
        null,
    }));
    onProcessingWeightmentSheetChange((prev) => {
      if ((prev.weightmentDetails?.length ?? 0) > 0) return prev;
      return {
        ...fullWeightmentSheet,
        weightmentDetails: stampedDetails,
        validation: {
          ...fullWeightmentSheet.validation,
          compareWithIdentificationSheet: false,
          deviationFound: false,
          deviationMessage: "",
        },
      };
    });
  }, [
    formData.processingWeightmentSheet,
    fullWeightmentSheet,
    onProcessingWeightmentSheetChange,
    showWeightment,
  ]);

  // RMP parity: ensure one row per identification-sheet material for the active premix.
  useEffect(() => {
    if (!showWeightment || !onProcessingWeightmentSheetChange) return;
    if (!activePremixNoForWeightment || !fullWeightmentSheet) return;
    const materials =
      identificationSheet?.materials?.length
        ? identificationSheet.materials
        : normalizeSheetMaterialsForWeightmentCompare(
            materialEntries
              .filter((entry) => Number(entry.premixNo) === activePremixNoForWeightment)
              .map((entry, index) => ({
                srNo: index + 1,
                materialCode: String(entry.materialCode ?? "").trim(),
                materialName: String(entry.materialName ?? entry.materialCode ?? "").trim(),
                lotIds: [],
                make: "",
                requiredComposition: 0,
                quantityPerPremix: 0,
              })),
          );
    if (!materials.length) return;

    const base = formData.processingWeightmentSheet ?? fullWeightmentSheet;
    const ensured = ensureWeightmentRowsForPremixMaterials(base, {
      premixNo: activePremixNoForWeightment,
      materials,
    });
    // Match RMP: do not call onChange when details are unchanged (avoids max update depth).
    if (
      JSON.stringify(ensured.weightmentDetails) ===
      JSON.stringify(base.weightmentDetails)
    ) {
      return;
    }
    onProcessingWeightmentSheetChange(ensured);
  }, [
    activePremixNoForWeightment,
    formData.processingWeightmentSheet,
    fullWeightmentSheet,
    identificationSheet?.materials,
    materialEntries,
    onProcessingWeightmentSheetChange,
    showWeightment,
  ]);

  const { weightmentSheet, weightmentRowSourceIndices } = useMemo(() => {
    if (!activePremixNoForWeightment || !fullWeightmentSheet) {
      return {
        weightmentSheet: null as RawMaterialPrepWeightmentSheet | null,
        weightmentRowSourceIndices: undefined as number[] | undefined,
      };
    }
    const scoped = filterWeightmentSheetForPremix(
      fullWeightmentSheet,
      activePremixNoForWeightment,
    );
    const rowSourceIndices: number[] = [];
    (fullWeightmentSheet.weightmentDetails ?? []).forEach((row, idx) => {
      const rowPremix =
        row.premixNo == null || !Number.isFinite(Number(row.premixNo))
          ? null
          : Number(row.premixNo);
      if (rowPremix === activePremixNoForWeightment) {
        rowSourceIndices.push(idx);
      }
    });
    return {
      weightmentSheet: scoped,
      weightmentRowSourceIndices: rowSourceIndices.length ? rowSourceIndices : undefined,
    };
  }, [activePremixNoForWeightment, fullWeightmentSheet]);

  const handleWeightmentChange = (
    next:
      | RawMaterialPrepWeightmentSheet
      | ((prev: RawMaterialPrepWeightmentSheet) => RawMaterialPrepWeightmentSheet),
  ) => {
    if (!onProcessingWeightmentSheetChange || !activePremixNoForWeightment || !fullWeightmentSheet) {
      return;
    }
    onProcessingWeightmentSheetChange((prevFull) => {
      const prevHasRows = (prevFull?.weightmentDetails?.length ?? 0) > 0;
      const base = prevHasRows ? (prevFull as RawMaterialPrepWeightmentSheet) : fullWeightmentSheet;
      const currentFiltered = filterWeightmentSheetForPremix(
        base,
        activePremixNoForWeightment,
      );
      const resolvedFiltered = typeof next === "function" ? next(currentFiltered) : next;
      return mergeWeightmentSheetForPremix(
        base,
        {
          ...resolvedFiltered,
          weightmentDetails: (resolvedFiltered.weightmentDetails ?? []).map((row) => ({
            ...row,
            premixNo: row.premixNo ?? activePremixNoForWeightment,
            scopeMaterialCode:
              String(row.scopeMaterialCode ?? "").trim() ||
              String(row.materialCode ?? "").trim() ||
              null,
          })),
        },
        activePremixNoForWeightment,
      );
    });
  };

  /** Compare / deviation — validation flags only; never touch weighment detail values. */
  const handleWeightmentValidationChange = (
    patch: Partial<RawMaterialPrepWeightmentSheet["validation"]>,
  ) => {
    if (!onProcessingWeightmentSheetChange || !fullWeightmentSheet || !activePremixNoForWeightment) {
      return;
    }
    onProcessingWeightmentSheetChange((prevFull) => {
      const prevHasRows = (prevFull?.weightmentDetails?.length ?? 0) > 0;
      const base = prevHasRows ? (prevFull as RawMaterialPrepWeightmentSheet) : fullWeightmentSheet;
      const currentFiltered = filterWeightmentSheetForPremix(
        base,
        activePremixNoForWeightment,
      );
      return mergeWeightmentSheetForPremix(
        base,
        {
          ...currentFiltered,
          validation: {
            ...currentFiltered.validation,
            ...patch,
          },
        },
        activePremixNoForWeightment,
      );
    });
  };

  // Always resolve from material master template (RMP parity) — do not hide Lot/Drying/Sieving
  // when the user saved an empty draft.
  const activeProcessSlot = useMemo(() => {
    if (!activeEntry) return null;
    const materialCode = String(
      activeEntry.savedProcess?.materialCode ?? activeEntry.materialCode ?? "",
    ).trim();
    if (!materialCode) return null;
    const slot = activeEntry.processSlot === "liquid" ? "liquid" : "solid";
    const gradeCode =
      String(activeEntry.savedProcess?.gradeCode ?? activeEntry.gradeCode ?? "").trim() || undefined;
    const rmpFormTemplate =
      String(activeEntry.rmpFormTemplate ?? "").trim().toUpperCase() || "DEFAULT";
    const fallbackProcess = {
      materialId: Number(activeEntry.savedProcess?.materialId ?? activeEntry.materialId ?? 0),
      materialCode,
      materialName:
        String(
          activeEntry.savedProcess?.materialName ?? activeEntry.materialName ?? materialCode,
        ).trim() || materialCode,
      gradeId: activeEntry.savedProcess?.gradeId ?? activeEntry.gradeId ?? null,
      gradeCode: gradeCode ?? null,
      lotDetails: activeEntry.savedProcess?.lotDetails ?? [],
      drying: activeEntry.savedProcess?.drying ?? null,
      sieving: activeEntry.savedProcess?.sieving ?? null,
      apCoarse: activeEntry.savedProcess?.apCoarse ?? null,
      apFine: activeEntry.savedProcess?.apFine ?? null,
      apUltraFine: activeEntry.savedProcess?.apUltraFine ?? null,
      aluminum: activeEntry.savedProcess?.aluminum ?? null,
      doa: activeEntry.savedProcess?.doa ?? null,
      processType: activeEntry.savedProcess?.processType,
      sections: activeEntry.savedProcess?.sections?.length
        ? activeEntry.savedProcess.sections
        : activeEntry.savedSections,
    };
    return hydratePremixProcessSlot(
      slot,
      materialCode,
      activeEntry.savedProcess ?? fallbackProcess,
      gradeCode,
      rmpFormTemplate,
    );
  }, [activeEntry]);

  const savedSectionsSignature = useMemo(() => {
    const sections = activeEntry?.savedSections ?? [];
    if (!sections.length) return "";
    return `${activeEntry?.entryId ?? ""}:${sections
      .map((section) => `${section.sectionId}:${JSON.stringify(section.sectionData)}`)
      .join("|")}`;
  }, [activeEntry?.entryId, activeEntry?.savedSections]);

  // Map division-details section rows into schema form values once per material (RMP normalize).
  useEffect(() => {
    if (!activeEntry || !activeSchema || !activeEntry.savedSections?.length) {
      setMappingValues(false);
      return;
    }
    if (!savedSectionsSignature) {
      setMappingValues(false);
      return;
    }
    if (appliedSectionsByEntryRef.current[activeEntry.entryId] === savedSectionsSignature) {
      setMappingValues(false);
      return;
    }
    if (!activeEntry.materialId || !activeEntry.materialCode) {
      setMappingValues(false);
      return;
    }

    setMappingValues(true);
    const hydrated = hydrateProcessingMaterialValues(activeSchema, activeEntry.savedSections, {
      materialId: Number(activeEntry.materialId),
      materialCode: String(activeEntry.materialCode),
      materialName: String(activeEntry.materialName ?? activeEntry.materialCode),
      gradeId: activeEntry.gradeId,
      gradeCode: activeEntry.gradeCode,
    });
    onEntryValuesChange(activeEntry.entryId, hydrated);
    appliedSectionsByEntryRef.current[activeEntry.entryId] = savedSectionsSignature;

    // Keep the subscale-style overlay until values have painted.
    let outer = 0;
    let inner = 0;
    outer = window.requestAnimationFrame(() => {
      inner = window.requestAnimationFrame(() => setMappingValues(false));
    });
    return () => {
      window.cancelAnimationFrame(outer);
      window.cancelAnimationFrame(inner);
    };
  }, [activeEntry, activeSchema, onEntryValuesChange, savedSectionsSignature]);

  const navPalette = {
    primary: BRAND.primary,
    primaryLight: BRAND.primaryLight,
    border: BRAND.border,
    surface: BRAND.surface,
    textSub: BRAND.textSub,
    text: BRAND.text,
  };

  const materialTabs = useMemo<UserWorkflowNavTab[]>(
    () =>
      materialEntries.map((entry) => ({
        id: entry.entryId,
        label: entry.label,
      })),
    [materialEntries],
  );

  const showUnitActions = Boolean(unitActions?.show);
  const inputsLocked = readOnly || fieldsDisabled;

  if (!materialEntries.length) {
    return (
      <Box
        sx={{
          borderRadius: 2.5,
          border: `1px solid ${BRAND.border}`,
          background: BRAND.surface,
          px: 2,
          py: 2.5,
        }}
      >
        <Typography sx={{ fontSize: "0.8rem", color: BRAND.textSub, textAlign: "center" }}>
          {S.PROCESSING_NO_MATERIALS_MESSAGE}
        </Typography>
      </Box>
    );
  }

  return (
    <Stack spacing={1.25}>
      <Box
        sx={{
          border: `1px solid ${BRAND.border}`,
          borderRadius: 2,
          px: 1.25,
          py: 1.1,
          background: BRAND.surface,
        }}
      >
        <UserWorkflowTabNav
          title={S.MATERIAL_NAV_TITLE}
          hint={S.MATERIAL_NAV_HINT}
          tabs={materialTabs}
          activeIndex={activeMaterialIndex}
          onActiveIndexChange={setActiveMaterialIndex}
          palette={navPalette}
          showStepArrows
          wrapTabs
          titleEndAdornment={
            materialEntries.length > 1 ? (
              <Box component="span" sx={{ fontSize: "0.72rem", fontWeight: 600, color: BRAND.textSub }}>
                {S.MATERIAL_NAV_COUNTER.replace("{current}", String(activeMaterialIndex + 1)).replace(
                  "{total}",
                  String(materialEntries.length),
                )}
              </Box>
            ) : null
          }
        />
      </Box>

      {showUnitActions ? (
        <Stack direction="row" justifyContent="flex-end" gap={1} flexWrap="wrap">
          <Button
            size="small"
            variant="outlined"
            disabled={inputsLocked || !unitActions?.canAct || unitActions?.actionLoading}
            onClick={unitActions?.onSaveDraft}
            sx={{ textTransform: "none", whiteSpace: "nowrap" }}
          >
            {unitActions?.saveDraftLabel ?? S.SAVE_UNIT_DRAFT}
          </Button>
          <SubmitForApprovalButton
            disabled={inputsLocked || !unitActions?.canAct || unitActions?.actionLoading}
            onClick={unitActions?.onSubmit}
            label={unitActions?.submitLabel ?? S.SUBMIT_UNIT}
          />
        </Stack>
      ) : null}

      {activeEntry && (activeValues || schemaUnavailable) ? (
        <Box
          key={activeEntry.entryId}
          sx={{
            position: "relative",
            borderRadius: 2.5,
            border: `1px solid ${BRAND.border}`,
            background: BRAND.surface,
            px: 1.5,
            py: 1.25,
            ...(schemaLoading || mappingValues
              ? { pointerEvents: "none", userSelect: "none", minHeight: 160 }
              : null),
          }}
        >
          {schemaLoading || mappingValues ? <QCSchemaBufferingLoader overlay /> : null}

          <Typography sx={{ fontSize: "0.84rem", fontWeight: 800, color: BRAND.primary, mb: 1 }}>
            {activeEntry.label}
            {activeEntry.materialName ? (
              <Box
                component="span"
                sx={{ fontWeight: 600, color: BRAND.textSub, ml: 0.75, fontSize: "0.76rem" }}
              >
                · {activeEntry.materialName}
                {activeEntry.gradeCode ? ` (${activeEntry.gradeCode})` : ""}
              </Box>
            ) : null}
          </Typography>

          {schemaUnavailable ? (
            <Stack spacing={1.25}>
              {activeProcessSlot && rmpUiKeyShowsProcessPanel(activeProcessSlot.uiKey) ? (
                <Box data-rmp-slot={activeEntry.processSlot === "liquid" ? "liquid" : "solid"}>
                  <RawMaterialMaterialProcessPanel
                    slotState={activeProcessSlot}
                    onSlotChange={(next) => {
                      if (!activeEntry || inputsLocked) return;
                      onProcessingProcessChange?.(activeEntry.entryId, next);
                    }}
                    materialCode={String(activeEntry.materialCode ?? "")}
                    rmpFormTemplate={activeEntry.rmpFormTemplate}
                    lotOptions={lotOptionsForMaterial(
                      identificationSheet?.materials,
                      activeEntry.materialCode,
                      (activeEntry.savedProcess?.lotDetails ?? [])
                        .map((lot) => String(lot.lotId ?? "").trim())
                        .filter(Boolean),
                    )}
                    quantityPerPremix={quantityPerPremixForMaterial(
                      identificationSheet?.materials,
                      activeEntry.materialCode,
                    )}
                    readOnly={inputsLocked}
                    theme={manufacturingTheme}
                    validationErrors={processingFieldErrors[activeEntry.entryId]}
                  />
                </Box>
              ) : (activeEntry.savedSections?.length ?? 0) > 0 ? (
                <QCDivisionSavedSectionsDisplay sections={activeEntry.savedSections ?? []} />
              ) : null}
              {weightmentSheet ? (
                <RawMaterialWeightmentSheetPanel
                  key={`weightment-premix-${activePremixNoForWeightment}`}
                  value={weightmentSheet}
                  onChange={handleWeightmentChange}
                  onValidationChange={handleWeightmentValidationChange}
                  theme={manufacturingTheme}
                  batchId={batchId}
                  identificationSheet={identificationSheet}
                  premixNo={activePremixNoForWeightment}
                  disabled={inputsLocked}
                  allowAddRemoveRows
                  compareHighlightOnly
                  weightmentErrors={weightmentErrors}
                  validationAttempt={validationAttempt}
                  rowSourceIndices={weightmentRowSourceIndices}
                />
              ) : (
                <Typography sx={{ fontSize: "0.78rem", color: BRAND.textSub }}>
                  {S.WEIGHTMENT_FALLBACK_EMPTY}
                </Typography>
              )}
            </Stack>
          ) : readOnly && (activeEntry.savedSections?.length ?? 0) > 0 ? (
            <QCDivisionSavedSectionsDisplay sections={activeEntry.savedSections ?? []} />
          ) : null}
        </Box>
      ) : activeEntry && readOnly && (activeEntry.savedSections?.length ?? 0) > 0 ? (
        <Box
          sx={{
            borderRadius: 2.5,
            border: `1px solid ${BRAND.border}`,
            background: BRAND.surface,
            px: 1.5,
            py: 1.25,
          }}
        >
          <Typography sx={{ fontSize: "0.84rem", fontWeight: 800, color: BRAND.primary, mb: 1 }}>
            {activeEntry.label}
          </Typography>
          <QCDivisionSavedSectionsDisplay sections={activeEntry.savedSections ?? []} />
        </Box>
      ) : null}
    </Stack>
  );
};

export default QCProcessingMaterialsPanel;
