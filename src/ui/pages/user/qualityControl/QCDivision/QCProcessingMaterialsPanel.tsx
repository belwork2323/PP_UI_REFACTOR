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
  ensureWeightmentRowForMaterialPremix,
  filterWeightmentSheetForMaterial,
  hydrateProcessingMaterialValues,
  mergeWeightmentSheetForMaterial,
  resolveQcProcessingWeightmentSheet,
} from "../../../../../hooks/user/qualityControl/qcProcessingMaterials";
import { normalizeSheetMaterialsForWeightmentCompare } from "../../../../../data/models/user/rawMaterialWeightmentValidation";
import type { QualityControlFormState } from "../../../../../data/models/user/QualityControlFormModel";
import type { RawMaterialPrepWeightmentSheet } from "../../../../../data/models/user/RawMaterialPreparationModel";
import type { IdentificationSheet } from "../../../../../data/models/admin/BatchManagement/BatchManagementModel";
import type { SchemaFormValues } from "../../../../../schema-engine";
import {
  UserWorkflowTabNav,
  type UserWorkflowNavTab,
} from "../../../../components/custom/UserWorkflowStepPager";
import SubmitForApprovalButton from "../../../../components/common/SubmitForApprovalButton";
import RawMaterialWeightmentSheetPanel from "../../manufacturing/RawMaterial/RawMaterialWeightmentSheetPanel";
import QCSchemaPanel from "./QCSchemaPanel";
import QCSchemaBufferingLoader from "./QCSchemaBufferingLoader";
import QCDivisionSavedSectionsDisplay from "./components/QCDivisionSavedSectionsDisplay";
import type { QCDivisionEntryUnitActions } from "./QCDivisionEntryPanel";

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

  const activeEntry = materialEntries[activeMaterialIndex] ?? null;
  const activeValues = activeEntry ? entryValuesById[activeEntry.entryId] : null;
  const activeSchema = activeEntry ? getSchemaForDivisionEntry(formData, activeEntry) : null;
  const schemaUnavailable = Boolean(activeEntry?.schemaUnavailable);

  const fullWeightmentSheet = useMemo(() => {
    if (!schemaUnavailable) return null;
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
    schemaUnavailable,
  ]);

  // Seed QC-owned weighment from autopopulate/batch once — table shows API rows first;
  // compare stays off until the user checks it (no auto rewrite of entered values).
  useEffect(() => {
    if (!schemaUnavailable || !onProcessingWeightmentSheetChange) return;
    if (formData.processingWeightmentSheet != null) return;
    if (!fullWeightmentSheet) return;
    // Stamp each row's own scope from its code so later code edits don't drop the row.
    const stampedDetails = (fullWeightmentSheet.weightmentDetails ?? []).map((row) => ({
      ...row,
      scopeMaterialCode:
        String(row.scopeMaterialCode ?? "").trim() ||
        String(row.materialCode ?? "").trim() ||
        null,
    }));
    onProcessingWeightmentSheetChange((prev) => {
      // Another effect / edit may have seeded while this was scheduled — keep it.
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
    schemaUnavailable,
  ]);

  // Ensure one weighment row for the active material × premix (no free-form Add Row).
  useEffect(() => {
    if (!schemaUnavailable || !onProcessingWeightmentSheetChange || !activeEntry) return;
    const code = String(activeEntry.materialCode ?? "").trim();
    if (!code || !fullWeightmentSheet) return;
    const materialName = String(activeEntry.materialName ?? code);
    const premixNo = activeEntry.premixNo;
    onProcessingWeightmentSheetChange((prev) => {
      const prevHasRows = (prev.weightmentDetails?.length ?? 0) > 0;
      const base = prevHasRows ? prev : fullWeightmentSheet;
      const ensured = ensureWeightmentRowForMaterialPremix(base, {
        materialCode: code,
        materialName,
        premixNo,
      });
      if (
        JSON.stringify(ensured.weightmentDetails) ===
        JSON.stringify(base.weightmentDetails)
      ) {
        // Unchanged: keep user sheet, or adopt API base when still empty.
        return prevHasRows ? prev : ensured;
      }
      return ensured;
    });
  }, [
    activeEntry,
    fullWeightmentSheet,
    onProcessingWeightmentSheetChange,
    schemaUnavailable,
  ]);

  const weightmentSheet = useMemo(() => {
    if (!activeEntry || !fullWeightmentSheet) return null;
    return filterWeightmentSheetForMaterial(
      fullWeightmentSheet,
      activeEntry.materialCode,
      activeEntry.premixNo,
    );
  }, [activeEntry, fullWeightmentSheet]);

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

  const handleWeightmentChange = (
    next:
      | RawMaterialPrepWeightmentSheet
      | ((prev: RawMaterialPrepWeightmentSheet) => RawMaterialPrepWeightmentSheet),
  ) => {
    if (!onProcessingWeightmentSheetChange || !activeEntry || !fullWeightmentSheet) return;
    onProcessingWeightmentSheetChange((prevFull) => {
      const prevHasRows = (prevFull?.weightmentDetails?.length ?? 0) > 0;
      const base = prevHasRows ? (prevFull as RawMaterialPrepWeightmentSheet) : fullWeightmentSheet;
      const currentFiltered = filterWeightmentSheetForMaterial(
        base,
        activeEntry.materialCode,
        activeEntry.premixNo,
      );

      const patched =
        typeof next === "function" ? next(currentFiltered) : next;

      // Compare checkbox / deviation flags only touch validation — never rewrite rows.
      const detailsUnchanged =
        patched.weightmentDetails === currentFiltered.weightmentDetails ||
        JSON.stringify(patched.weightmentDetails ?? []) ===
          JSON.stringify(currentFiltered.weightmentDetails ?? []);
      if (detailsUnchanged) {
        return {
          ...base,
          mixerBuildingNumber:
            patched.mixerBuildingNumber ?? base.mixerBuildingNumber,
          validation: patched.validation ?? base.validation,
        };
      }

      return mergeWeightmentSheetForMaterial(
        base,
        activeEntry.materialCode,
        {
          ...patched,
          weightmentDetails: (patched.weightmentDetails ?? []).map((row) => ({
            ...row,
            // Keep user-edited code/name; only fill blanks from the active material tab.
            materialCode:
              String(row.materialCode ?? "").trim() ||
              String(activeEntry.materialCode ?? ""),
            materialName:
              String(row.materialName ?? "").trim() ||
              String(activeEntry.materialName ?? activeEntry.materialCode ?? ""),
            scopeMaterialCode:
              String(row.scopeMaterialCode ?? "").trim() ||
              String(activeEntry.materialCode ?? ""),
            premixNo: row.premixNo ?? activeEntry.premixNo ?? null,
          })),
        },
        activeEntry.premixNo,
      );
    });
  };

  /** Compare / deviation — validation flags only; never touch weighment detail values. */
  const handleWeightmentValidationChange = (
    patch: Partial<RawMaterialPrepWeightmentSheet["validation"]>,
  ) => {
    if (!onProcessingWeightmentSheetChange || !fullWeightmentSheet) return;
    onProcessingWeightmentSheetChange((prevFull) => {
      const prevHasRows = (prevFull?.weightmentDetails?.length ?? 0) > 0;
      const base = prevHasRows ? (prevFull as RawMaterialPrepWeightmentSheet) : fullWeightmentSheet;
      return {
        ...base,
        validation: {
          ...base.validation,
          ...patch,
        },
      };
    });
  };

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
              <Box
                sx={{
                  borderRadius: 1.5,
                  border: `1px solid ${BRAND.warn ?? "#D97706"}`,
                  background: "rgba(217, 119, 6, 0.08)",
                  px: 1.25,
                  py: 1,
                }}
              >
                <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: BRAND.text }}>
                  {S.SCHEMA_UNAVAILABLE_FOR_MATERIAL}
                </Typography>
              </Box>
              {weightmentSheet ? (
                <RawMaterialWeightmentSheetPanel
                  value={weightmentSheet}
                  onChange={handleWeightmentChange}
                  onValidationChange={handleWeightmentValidationChange}
                  theme={manufacturingTheme}
                  batchId={batchId}
                  identificationSheet={identificationSheet}
                  disabled={inputsLocked}
                  compareHighlightOnly
                  allowAddRemoveRows={false}
                />
              ) : (
                <Typography sx={{ fontSize: "0.78rem", color: BRAND.textSub }}>
                  {S.WEIGHTMENT_FALLBACK_EMPTY}
                </Typography>
              )}
            </Stack>
          ) : readOnly && (activeEntry.savedSections?.length ?? 0) > 0 ? (
            <QCDivisionSavedSectionsDisplay sections={activeEntry.savedSections ?? []} />
          ) : !activeSchema && schemaLoading ? null : (
            <QCSchemaPanel
              schema={activeSchema}
              formValues={activeValues?.schemaValues ?? {}}
              persistedValues={activeValues?.schemaValues}
              // Sections are already mapped into formValues above (with RMP normalize).
              hydrationKey={`${activeEntry.entryId}:${savedSectionsSignature}`}
              subDepartmentId={subDepartmentId}
              batchId={batchId}
              onChange={(values) => onEntryValuesChange(activeEntry.entryId, values)}
              readOnly={inputsLocked}
              lockStructure
              loading={false}
              error={null}
            />
          )}
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
