import { useCallback, useMemo } from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import { STRINGS } from "../../../../../app/config/strings";
import { QC_DIVISION_BRAND } from "../../../../../app/theme/custom_themes/user/qualityControl/tokens";
import type { QcDivisionEntry } from "../../../../../data/models/user/QualityControlFormModel";
import type { SchemaFormValues } from "../../../../../schema-engine";
import {
  createInitialViscosityValues,
  hydrateViscosityValuesFromSections,
  mergeFinalMixEntrySchemaValues,
  pickFinalMixDetailsSchemaValues,
  pickViscositySchemaValues,
  type QcMixingDetailsSeed,
} from "../../../../../hooks/user/qualityControl/qcMixingTables";
import QCMixingDetailsTable from "./QCMixingDetailsTable";
import QCMixingViscosityTable from "./QCMixingViscosityTable";
import type { QCDivisionEntryUnitActions } from "./QCDivisionEntryPanel";

const S = STRINGS.QUALITY_CONTROL.QC_DIVISION;
const BRAND = QC_DIVISION_BRAND;

type QCMixingFinalMixPanelProps = {
  entry: QcDivisionEntry;
  finalMixDetailsValues: SchemaFormValues;
  entrySchemaValues?: SchemaFormValues;
  onFinalMixDetailsChange: (values: SchemaFormValues) => void;
  onEntryValuesChange: (entryId: string, values: SchemaFormValues) => void;
  readOnly?: boolean;
  fieldsDisabled?: boolean;
  autoSeed?: QcMixingDetailsSeed | null;
  unitActions?: QCDivisionEntryUnitActions | null;
  actionLabels?: Pick<QCDivisionEntryUnitActions, "saveDraftLabel" | "submitLabel" | "viewDetailsLabel">;
};

const QCMixingFinalMixPanel = ({
  entry,
  finalMixDetailsValues,
  entrySchemaValues,
  onFinalMixDetailsChange,
  onEntryValuesChange,
  readOnly = false,
  fieldsDisabled = false,
  autoSeed = null,
  unitActions = null,
  actionLabels = null,
}: QCMixingFinalMixPanelProps) => {
  const viscosityValues = useMemo(() => {
    const saved = entrySchemaValues;
    if (saved && Object.keys(saved).length > 0) {
      return pickViscositySchemaValues(saved);
    }
    if (entry.savedSections?.length) {
      return hydrateViscosityValuesFromSections(entry.savedSections);
    }
    return createInitialViscosityValues();
  }, [entry.savedSections, entrySchemaValues]);

  const handleFinalMixDetailsChange = useCallback(
    (values: SchemaFormValues) => {
      onFinalMixDetailsChange(values);
      onEntryValuesChange(
        entry.entryId,
        mergeFinalMixEntrySchemaValues(values, pickViscositySchemaValues(entrySchemaValues)),
      );
    },
    [entry.entryId, entrySchemaValues, onEntryValuesChange, onFinalMixDetailsChange],
  );

  const handleViscosityChange = useCallback(
    (values: SchemaFormValues) => {
      onEntryValuesChange(
        entry.entryId,
        mergeFinalMixEntrySchemaValues(
          pickFinalMixDetailsSchemaValues(entrySchemaValues) ||
            pickFinalMixDetailsSchemaValues(finalMixDetailsValues),
          pickViscositySchemaValues(values),
        ),
      );
    },
    [entry.entryId, entrySchemaValues, finalMixDetailsValues, onEntryValuesChange],
  );

  const showUnitActions = Boolean(unitActions?.show);
  const showViewDetails = unitActions?.showViewDetails ?? showUnitActions;

  return (
    <Box
      sx={{
        borderRadius: 2.5,
        border: `1px solid ${BRAND.border}`,
        background: BRAND.surface,
        px: 1.5,
        py: 1.25,
        ...(fieldsDisabled && !readOnly
          ? { pointerEvents: "none", userSelect: "none", opacity: 0.92 }
          : null),
      }}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        gap={1}
        mb={1.5}
      >
        <Typography sx={{ fontSize: "0.84rem", fontWeight: 800, color: BRAND.primary }}>
          {entry.label}
        </Typography>
        {showUnitActions || showViewDetails ? (
          <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap" justifyContent="flex-end">
            {showUnitActions ? (
              <>
                <Button
                  size="small"
                  variant="outlined"
                  disabled={
                    readOnly || fieldsDisabled || !unitActions?.canAct || unitActions?.actionLoading
                  }
                  onClick={unitActions?.onSaveDraft}
                  sx={{ textTransform: "none", whiteSpace: "nowrap" }}
                >
                  {actionLabels?.saveDraftLabel ?? unitActions?.saveDraftLabel ?? S.SAVE_UNIT_DRAFT}
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  disabled={
                    readOnly || fieldsDisabled || !unitActions?.canAct || unitActions?.actionLoading
                  }
                  onClick={unitActions?.onSubmit}
                  sx={{ textTransform: "none", whiteSpace: "nowrap" }}
                >
                  {actionLabels?.submitLabel ?? unitActions?.submitLabel ?? S.SUBMIT_UNIT}
                </Button>
              </>
            ) : null}
            {showViewDetails ? (
              <Button
                size="small"
                variant="outlined"
                disabled={
                  readOnly ||
                  fieldsDisabled ||
                  !unitActions?.canViewDetails ||
                  unitActions?.actionLoading
                }
                onClick={unitActions?.onViewDetails}
                sx={{ textTransform: "none", whiteSpace: "nowrap" }}
              >
                {actionLabels?.viewDetailsLabel ??
                  unitActions?.viewDetailsLabel ??
                  S.VIEW_DETAILS}
              </Button>
            ) : null}
          </Stack>
        ) : null}
      </Stack>

      <Stack spacing={2}>
        <QCMixingDetailsTable
          variant="finalMix"
          values={finalMixDetailsValues}
          onChange={handleFinalMixDetailsChange}
          readOnly={readOnly}
          autoSeed={autoSeed}
        />
        <QCMixingViscosityTable
          values={viscosityValues}
          onChange={handleViscosityChange}
          readOnly={readOnly}
        />
      </Stack>
    </Box>
  );
};

export default QCMixingFinalMixPanel;
