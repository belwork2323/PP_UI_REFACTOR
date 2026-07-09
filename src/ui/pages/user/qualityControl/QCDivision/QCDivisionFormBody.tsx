import { useMemo } from "react";
import { Box, CircularProgress, Typography } from "@mui/material";
import { STRINGS } from "../../../../../app/config/strings";
import { QC_DIVISION_BRAND } from "../../../../../app/theme/custom_themes/user/qualityControl/tokens";
import type { QcDivisionEntry, QualityControlFormState } from "../../../../../data/models/user/QualityControlFormModel";
import { getQcSchemaCacheKey } from "../../../../../hooks/user/qualityControl/qcFlowConfig";
import {
  buildDivisionNavGroups,
  resolveActiveNavContent,
} from "../../../../../hooks/user/qualityControl/qcDivisionNav";
import {
  getLiquidSchemaForBothEntry,
  getSchemaForDivisionEntry,
  getSolidSchemaForBothEntry,
} from "../../../../../hooks/user/qualityControl/qcDivisionEntries";
import { sliceMixingFinalMixSchema } from "../../../../../hooks/user/qualityControl/qcMixingConfig";
import { createQcInitialValues } from "../../../../../schema-engine/adapters/qc.adapter";
import type { SchemaFormValues } from "../../../../../schema-engine";
import QCDivisionEntryPanel from "./QCDivisionEntryPanel";
import QCDivisionNavPanel from "./QCDivisionNavPanel";
import QCSchemaPanel from "./QCSchemaPanel";

const S = STRINGS.QUALITY_CONTROL.QC_DIVISION;

const resolveVisibleEntries = (
  activeContent: ReturnType<typeof resolveActiveNavContent>,
): QcDivisionEntry[] => {
  if (!activeContent) return [];
  if (activeContent.type === "entry") return [activeContent.entry];
  if (activeContent.type === "motor-entries") return activeContent.entries;
  return [];
};

export type QCDivisionFormBodyProps = {
  batch?: { batchId?: string } | null;
  formData: QualityControlFormState;
  subDepartmentId?: number;
  activeDivisionGroupIndex: number;
  activeDivisionSubIndex: number;
  readOnly?: boolean;
  schemaLoading?: boolean;
  schemaError?: string | null;
  onActiveDivisionGroupIndexChange: (index: number) => void;
  onActiveDivisionSubIndexChange: (index: number) => void;
  onDivisionEntryValuesChange: (entryId: string, values: SchemaFormValues) => void;
  onDivisionEntryLiquidValuesChange: (entryId: string, values: SchemaFormValues) => void;
  onMixingFinalMixDetailsChange: (values: SchemaFormValues) => void;
  onRemoveDivisionEntry: (entryId: string) => void;
  theme: any;
};

const QCDivisionFormBody = ({
  batch,
  formData,
  subDepartmentId,
  activeDivisionGroupIndex,
  activeDivisionSubIndex,
  readOnly = false,
  schemaLoading = false,
  schemaError = null,
  onActiveDivisionGroupIndexChange,
  onActiveDivisionSubIndexChange,
  onDivisionEntryValuesChange,
  onDivisionEntryLiquidValuesChange,
  onMixingFinalMixDetailsChange,
  onRemoveDivisionEntry,
  theme,
}: QCDivisionFormBodyProps) => {
  const BRAND = QC_DIVISION_BRAND;
  const divisionEntries = formData.divisionEntries ?? [];
  const hasDivisionEntries = divisionEntries.length > 0;

  const finalMixFullSchema = useMemo(() => {
    const cacheKey = getQcSchemaCacheKey("MIXING", "FINAL_MIX");
    return formData.schemasByKey?.[cacheKey] ?? null;
  }, [formData.schemasByKey]);

  const finalMixDetailsSchema = useMemo(
    () => (finalMixFullSchema ? sliceMixingFinalMixSchema(finalMixFullSchema, "details") : null),
    [finalMixFullSchema],
  );

  const finalMixDetailsValues = useMemo(
    () =>
      formData.mixingFinalMixDetailsValues ??
      (finalMixDetailsSchema ? createQcInitialValues(finalMixDetailsSchema) : {}),
    [finalMixDetailsSchema, formData.mixingFinalMixDetailsValues],
  );

  const navGroups = useMemo(() => buildDivisionNavGroups(divisionEntries), [divisionEntries]);
  const safeGroupIndex = Math.min(Math.max(activeDivisionGroupIndex, 0), Math.max(0, navGroups.length - 1));
  const activeGroup = navGroups[safeGroupIndex];
  const subNavCount =
    activeGroup?.kind === "motor-based"
      ? activeGroup.motorTabs.length
      : activeGroup?.kind === "mixing"
        ? activeGroup.tabs.length
        : activeGroup?.kind === "entries"
          ? activeGroup.entries.length
          : 0;
  const safeSubIndex = Math.min(Math.max(activeDivisionSubIndex, 0), Math.max(0, subNavCount - 1));
  const activeContent = useMemo(
    () => resolveActiveNavContent(navGroups, safeGroupIndex, safeSubIndex),
    [navGroups, safeGroupIndex, safeSubIndex],
  );
  const activeEntry = activeContent?.type === "entry" ? activeContent.entry : null;
  const activeMotorId = activeContent?.type === "motor-entries" ? activeContent.motorId : null;
  const visibleEntries = useMemo(() => resolveVisibleEntries(activeContent), [activeContent]);
  const bothPremixSolidSchema = useMemo(() => getSolidSchemaForBothEntry(formData), [formData.schemasByKey]);
  const bothPremixLiquidSchema = useMemo(() => getLiquidSchemaForBothEntry(formData), [formData.schemasByKey]);

  if (schemaLoading && !hasDivisionEntries) {
    return (
      <Box
        sx={{
          borderRadius: 2.5,
          border: `1px solid ${theme.palette.border}`,
          background: theme.palette.surface,
          px: 2,
          py: 5,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <CircularProgress size={28} />
      </Box>
    );
  }

  if (!hasDivisionEntries || navGroups.length === 0) {
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
          {readOnly ? S.DETAILS_NO_DATA : S.DIVISION_NO_ENTRIES_MESSAGE}
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <QCDivisionNavPanel
        entries={divisionEntries}
        activeGroupIndex={activeDivisionGroupIndex}
        activeSubIndex={activeDivisionSubIndex}
        onActiveGroupIndexChange={onActiveDivisionGroupIndexChange}
        onActiveSubIndexChange={onActiveDivisionSubIndexChange}
      />
      <Box sx={{ mt: 1.25 }}>
        {activeContent?.type === "final-mix-details" && finalMixDetailsSchema ? (
          <Box
            sx={{
              borderRadius: 2.5,
              border: `1px solid ${BRAND.border}`,
              background: BRAND.surface,
              px: 1.5,
              py: 1.25,
            }}
          >
            <QCSchemaPanel
              schema={finalMixDetailsSchema}
              formValues={finalMixDetailsValues}
              savedSections={formData.savedSections}
              subDepartmentId={subDepartmentId}
              batchId={batch?.batchId}
              onChange={onMixingFinalMixDetailsChange}
              readOnly={readOnly}
              loading={schemaLoading}
              error={schemaError}
            />
          </Box>
        ) : null}

        {activeEntry?.kind === "MIXING_FINAL_MIX" ? (
          <Typography sx={{ fontSize: "0.74rem", color: BRAND.textSub, mb: 1 }}>
            {S.MIXING_FINAL_MIX_VISCOSITY_ENTRY_HINT}
          </Typography>
        ) : null}

        {activeMotorId && activeContent?.type === "motor-entries" && activeContent.flowKey !== "TRIMMING" ? (
          <Typography sx={{ fontSize: "0.84rem", fontWeight: 800, color: BRAND.primary, mb: 1 }}>
            {activeMotorId}
          </Typography>
        ) : null}

        {visibleEntries.map((entry) => {
          const entryValues = formData.divisionEntryValues?.[entry.entryId];
          if (!entryValues) return null;

          return (
            <QCDivisionEntryPanel
              key={entry.entryId}
              entry={entry}
              entryValues={entryValues}
              schema={getSchemaForDivisionEntry(formData, entry)}
              solidSchema={entry.kind === "BOTH_PREMIX" ? bothPremixSolidSchema : undefined}
              liquidSchema={entry.kind === "BOTH_PREMIX" ? bothPremixLiquidSchema : undefined}
              subDepartmentId={subDepartmentId}
              batchId={batch?.batchId}
              readOnly={readOnly}
              schemaLoading={schemaLoading}
              schemaError={schemaError}
              onEntryValuesChange={onDivisionEntryValuesChange}
              onEntryLiquidValuesChange={onDivisionEntryLiquidValuesChange}
              onRemoveEntry={onRemoveDivisionEntry}
            />
          );
        })}
      </Box>
    </>
  );
};

export default QCDivisionFormBody;
