import { useEffect, useMemo, useRef, useState } from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import { STRINGS } from "../../../../../app/config/strings";
import { QC_DIVISION_BRAND } from "../../../../../app/theme/custom_themes/user/qualityControl/tokens";
import type {
  QcDivisionEntry,
  QcDivisionEntryValues,
} from "../../../../../data/models/user/QualityControlFormModel";
import { getSchemaForDivisionEntry } from "../../../../../hooks/user/qualityControl/qcDivisionEntries";
import { hydrateProcessingMaterialValues } from "../../../../../hooks/user/qualityControl/qcProcessingMaterials";
import type { QualityControlFormState } from "../../../../../data/models/user/QualityControlFormModel";
import type { SchemaFormValues } from "../../../../../schema-engine";
import {
  UserWorkflowTabNav,
  type UserWorkflowNavTab,
} from "../../../../components/custom/UserWorkflowStepPager";
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
  readOnly?: boolean;
  schemaLoading?: boolean;
  schemaError?: string | null;
  onEntryValuesChange: (
    entryId: string,
    values: SchemaFormValues | ((prev: SchemaFormValues) => SchemaFormValues),
  ) => void;
  unitActions?: QCDivisionEntryUnitActions | null;
};

const QCProcessingMaterialsPanel = ({
  formData,
  entries,
  entryValuesById,
  subDepartmentId,
  batchId,
  readOnly = false,
  schemaLoading = false,
  schemaError = null,
  onEntryValuesChange,
  unitActions = null,
}: QCProcessingMaterialsPanelProps) => {
  const BRAND = QC_DIVISION_BRAND;
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
            disabled={readOnly || !unitActions?.canAct || unitActions?.actionLoading}
              onClick={unitActions?.onSaveDraft}
              sx={{ textTransform: "none", whiteSpace: "nowrap" }}
            >
              {unitActions?.saveDraftLabel ?? S.SAVE_UNIT_DRAFT}
            </Button>
            <Button
              size="small"
              variant="contained"
              disabled={readOnly || !unitActions?.canAct || unitActions?.actionLoading}
              onClick={unitActions?.onSubmit}
              sx={{ textTransform: "none", whiteSpace: "nowrap" }}
            >
              {unitActions?.submitLabel ?? S.SUBMIT_UNIT}
            </Button>
        </Stack>
      ) : null}

      {activeEntry && activeValues ? (
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

          {readOnly && (activeEntry.savedSections?.length ?? 0) > 0 ? (
            <QCDivisionSavedSectionsDisplay sections={activeEntry.savedSections ?? []} />
          ) : !activeSchema && schemaLoading ? null : (
            <QCSchemaPanel
              schema={activeSchema}
              formValues={activeValues.schemaValues ?? {}}
              persistedValues={activeValues.schemaValues}
              // Sections are already mapped into formValues above (with RMP normalize).
              hydrationKey={`${activeEntry.entryId}:${savedSectionsSignature}`}
              subDepartmentId={subDepartmentId}
              batchId={batchId}
              onChange={(values) => onEntryValuesChange(activeEntry.entryId, values)}
              readOnly={readOnly}
              lockStructure
              loading={false}
              error={schemaError}
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
