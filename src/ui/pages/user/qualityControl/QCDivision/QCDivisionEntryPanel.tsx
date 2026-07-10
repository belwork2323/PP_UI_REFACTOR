import { memo, useCallback, useMemo } from "react";
import { Box, CircularProgress, Stack, Typography } from "@mui/material";
import type { QcDivisionEntry, QcDivisionEntryValues } from "../../../../../data/models/user/QualityControlFormModel";
import { sliceMixingFinalMixSchema } from "../../../../../hooks/user/qualityControl/qcMixingConfig";
import { createQcInitialValues } from "../../../../../schema-engine/adapters/qc.adapter";
import type { SchemaDocumentV2, SchemaFormValues } from "../../../../../schema-engine";
import { QC_DIVISION_BRAND } from "../../../../../app/theme/custom_themes/user/qualityControl/tokens";
import { STRINGS } from "../../../../../app/config/strings";
import RemoveProcessButton from "../../../../components/common/RemoveProcessButton";
import QCSchemaPanel from "./QCSchemaPanel";
import QCDivisionSavedSectionsDisplay from "./components/QCDivisionSavedSectionsDisplay";

const S = STRINGS.QUALITY_CONTROL.QC_DIVISION;

type QCDivisionEntryPanelProps = {
  entry: QcDivisionEntry;
  entryValues: QcDivisionEntryValues;
  schema: SchemaDocumentV2 | null;
  solidSchema?: SchemaDocumentV2 | null;
  liquidSchema?: SchemaDocumentV2 | null;
  subDepartmentId?: number;
  batchId?: string;
  readOnly?: boolean;
  schemaLoading?: boolean;
  schemaError?: string | null;
  onEntryValuesChange: (entryId: string, values: SchemaFormValues) => void;
  onEntryLiquidValuesChange: (entryId: string, values: SchemaFormValues) => void;
  onRemoveEntry: (entryId: string) => void;
};

const QCDivisionEntryPanel = ({
  entry,
  entryValues,
  schema,
  solidSchema = null,
  liquidSchema = null,
  subDepartmentId,
  batchId,
  readOnly = false,
  schemaLoading = false,
  schemaError = null,
  onEntryValuesChange,
  onEntryLiquidValuesChange,
  onRemoveEntry,
}: QCDivisionEntryPanelProps) => {
  const BRAND = QC_DIVISION_BRAND;

  const resolvedSchema = useMemo(() => {
    if (!schema) return null;
    if (entry.kind === "MIXING_FINAL_MIX") {
      return sliceMixingFinalMixSchema(schema, "viscosity");
    }
    return schema;
  }, [entry.kind, schema]);

  const handleValuesChange = useCallback(
    (values: SchemaFormValues) => onEntryValuesChange(entry.entryId, values),
    [entry.entryId, onEntryValuesChange],
  );

  const handleLiquidValuesChange = useCallback(
    (values: SchemaFormValues) => onEntryLiquidValuesChange(entry.entryId, values),
    [entry.entryId, onEntryLiquidValuesChange],
  );

  const handleRemove = useCallback(() => onRemoveEntry(entry.entryId), [entry.entryId, onRemoveEntry]);

  const formValues = useMemo(() => {
    const saved = entryValues.schemaValues;
    if (saved && Object.keys(saved).length > 0) return saved;
    return resolvedSchema ? createQcInitialValues(resolvedSchema) : {};
  }, [entryValues.schemaValues, resolvedSchema]);

  const solidValues = useMemo(() => {
    const saved = entryValues.schemaValues;
    if (saved && Object.keys(saved).length > 0) return saved;
    return solidSchema ? createQcInitialValues(solidSchema) : {};
  }, [entryValues.schemaValues, solidSchema]);

  const liquidValues = useMemo(() => {
    const saved = entryValues.liquidSchemaValues;
    if (saved && Object.keys(saved).length > 0) return saved;
    return liquidSchema ? createQcInitialValues(liquidSchema) : {};
  }, [entryValues.liquidSchemaValues, liquidSchema]);

  if (!entryValues) return null;

  if (!resolvedSchema) {
    if (schemaLoading) {
      return (
        <Box
          sx={{
            borderRadius: 2.5,
            border: `1px solid ${BRAND.border}`,
            background: BRAND.surface,
            px: 1.5,
            py: 3,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <CircularProgress size={24} sx={{ color: BRAND.primary }} />
        </Box>
      );
    }

    if (readOnly && (entry.savedSections?.length ?? 0) > 0) {
      return (
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
            {entry.label}
          </Typography>
          <QCDivisionSavedSectionsDisplay sections={entry.savedSections ?? []} />
        </Box>
      );
    }

    if (readOnly) {
      return (
        <Box
          sx={{
            borderRadius: 2.5,
            border: `1px solid ${BRAND.border}`,
            background: BRAND.surface,
            px: 1.5,
            py: 1.25,
          }}
        >
          <Typography sx={{ fontSize: "0.84rem", fontWeight: 800, color: BRAND.primary, mb: 0.5 }}>
            {entry.label}
          </Typography>
          <Typography sx={{ fontSize: "0.76rem", color: BRAND.textSub }}>
            {schemaError || S.SCHEMA_FETCH_ERROR}
          </Typography>
        </Box>
      );
    }

    return null;
  }

  if (entry.kind === "BOTH_PREMIX") {
    if (schemaLoading) {
      return (
        <Box
          sx={{
            borderRadius: 2.5,
            border: `1px solid ${BRAND.border}`,
            background: BRAND.surface,
            px: 1.5,
            py: 3,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <CircularProgress size={24} sx={{ color: BRAND.primary }} />
        </Box>
      );
    }

    if (!solidSchema || !liquidSchema) {
      if (readOnly && (entry.savedSections?.length ?? 0) > 0) {
        return (
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
              {entry.label}
            </Typography>
            <QCDivisionSavedSectionsDisplay sections={entry.savedSections ?? []} />
          </Box>
        );
      }

      if (readOnly) {
        return (
          <Box
            sx={{
              borderRadius: 2.5,
              border: `1px solid ${BRAND.border}`,
              background: BRAND.surface,
              px: 1.5,
              py: 1.25,
            }}
          >
            <Typography sx={{ fontSize: "0.84rem", fontWeight: 800, color: BRAND.primary, mb: 0.5 }}>
              {entry.label}
            </Typography>
            <Typography sx={{ fontSize: "0.76rem", color: BRAND.textSub }}>
              {schemaError || S.SCHEMA_FETCH_ERROR}
            </Typography>
          </Box>
        );
      }
      return null;
    }

    return (
      <Box
        sx={{
          borderRadius: 2.5,
          border: `1px solid ${BRAND.border}`,
          background: BRAND.surface,
          px: 1.5,
          py: 1.25,
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
          <Typography sx={{ fontSize: "0.84rem", fontWeight: 800, color: BRAND.primary }}>
            {entry.label}
          </Typography>
          {!readOnly ? (
            <RemoveProcessButton
              onClick={handleRemove}
              dangerColor={BRAND.danger}
              tooltip={S.DIVISION_REMOVE_TOOLTIP}
            />
          ) : null}
        </Stack>

        <Stack spacing={2}>
          <Box>
            <Typography sx={{ fontSize: "0.8rem", fontWeight: 700, color: BRAND.primary, mb: 1 }}>
              {S.SOLID_SECTION_TITLE}
            </Typography>
            <QCSchemaPanel
              schema={solidSchema}
              formValues={solidValues}
              persistedValues={entryValues.schemaValues}
              savedSections={entry.savedSections}
              hydrationKey={entry.entryId}
              subDepartmentId={subDepartmentId}
              batchId={batchId}
              onChange={handleValuesChange}
              readOnly={readOnly}
              loading={schemaLoading}
              error={schemaError}
            />
          </Box>
          <Box>
            <Typography sx={{ fontSize: "0.8rem", fontWeight: 700, color: BRAND.primary, mb: 1 }}>
              {S.LIQUID_SECTION_TITLE}
            </Typography>
            <QCSchemaPanel
              schema={liquidSchema}
              formValues={liquidValues}
              persistedValues={entryValues.liquidSchemaValues}
              savedSections={entry.savedSections}
              hydrationKey={`${entry.entryId}-liquid`}
              subDepartmentId={subDepartmentId}
              batchId={batchId}
              onChange={handleLiquidValuesChange}
              readOnly={readOnly}
              loading={schemaLoading}
              error={schemaError}
            />
          </Box>
        </Stack>
      </Box>
    );
  }

  const showEntryHeader =
    entry.kind !== "CASTING_MOTOR" &&
    entry.kind !== "CURING_MOTOR" &&
    entry.kind !== "TRIMMING_MOTOR" &&
    entry.kind !== "DE_CORING_MOTOR" &&
    entry.kind !== "POST_CURE_MOTOR" &&
    entry.kind !== "NDT_MOTOR" &&
    entry.kind !== "WEIGHTMENT_MOTOR";
  const isTrimmingMotor = entry.kind === "TRIMMING_MOTOR";
  const isWeightmentMotor = entry.kind === "WEIGHTMENT_MOTOR";

  return (
    <Box
      sx={{
        borderRadius: 2.5,
        border: `1px solid ${BRAND.border}`,
        background: BRAND.surface,
        px: 1.5,
        py: 1.25,
      }}
    >
      {isTrimmingMotor ? (
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1.25}>
          <Box>
            <Typography sx={{ fontSize: "0.8rem", fontWeight: 700, color: BRAND.primary }}>
              {entry.motorId}
            </Typography>
            <Typography sx={{ fontSize: "0.74rem", color: BRAND.textSub, mt: 0.25 }}>
              {S.TRIMMING_MOTOR_RECEIVED_DATE_LABEL}: {entry.motorReceivedDate?.trim() || "—"}
            </Typography>
          </Box>
          {!readOnly ? (
            <RemoveProcessButton
              onClick={handleRemove}
              dangerColor={BRAND.danger}
              tooltip={S.DIVISION_REMOVE_TOOLTIP}
            />
          ) : null}
        </Stack>
      ) : isWeightmentMotor ? (
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1.25}>
          <Box>
            <Typography sx={{ fontSize: "0.8rem", fontWeight: 700, color: BRAND.primary }}>
              {entry.motorId}
            </Typography>
            <Typography sx={{ fontSize: "0.74rem", color: BRAND.textSub, mt: 0.25 }}>
              {S.WEIGHTMENT_WEIGHSCALE_NO_LABEL}: {entry.weighscaleNo?.trim() || "—"}
            </Typography>
            <Typography sx={{ fontSize: "0.74rem", color: BRAND.textSub, mt: 0.25 }}>
              {S.WEIGHTMENT_CALIBRATION_DUE_DATE_LABEL}: {entry.calibrationDueDate?.trim() || "—"}
            </Typography>
          </Box>
          <RemoveProcessButton
            onClick={handleRemove}
            dangerColor={BRAND.danger}
            tooltip={S.DIVISION_REMOVE_TOOLTIP}
          />
        </Stack>
      ) : showEntryHeader ? (
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography sx={{ fontSize: "0.84rem", fontWeight: 800, color: BRAND.primary }}>
            {entry.label}
          </Typography>
          {!readOnly ? (
            <RemoveProcessButton
              onClick={handleRemove}
              dangerColor={BRAND.danger}
              tooltip={S.DIVISION_REMOVE_TOOLTIP}
            />
          ) : null}
        </Stack>
      ) : (
        <Stack direction="row" justifyContent="flex-end" alignItems="center" mb={1}>
          {!readOnly ? (
            <RemoveProcessButton
              onClick={handleRemove}
              dangerColor={BRAND.danger}
              tooltip={S.DIVISION_REMOVE_TOOLTIP}
            />
          ) : null}
        </Stack>
      )}

      <QCSchemaPanel
        schema={resolvedSchema}
        formValues={formValues}
        persistedValues={entryValues.schemaValues}
        savedSections={entry.savedSections}
        hydrationKey={entry.entryId}
        subDepartmentId={subDepartmentId}
        batchId={batchId}
        onChange={handleValuesChange}
        readOnly={readOnly}
        loading={schemaLoading}
        error={schemaError}
      />
    </Box>
  );
};

export default memo(QCDivisionEntryPanel);
