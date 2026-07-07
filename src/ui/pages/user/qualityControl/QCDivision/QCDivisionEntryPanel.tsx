import { Box, Stack, Typography } from "@mui/material";
import type {
  QcDivisionEntry,
  QualityControlFormState,
} from "../../../../../data/models/user/QualityControlFormModel";
import {
  getLiquidSchemaForBothEntry,
  getSchemaForDivisionEntry,
  getSolidSchemaForBothEntry,
} from "../../../../../hooks/user/qualityControl/qcDivisionEntries";
import {
  sliceMixingFinalMixSchema,
} from "../../../../../hooks/user/qualityControl/qcMixingConfig";
import { createQcInitialValues } from "../../../../../schema-engine/adapters/qc.adapter";
import type { SchemaFormValues } from "../../../../../schema-engine";
import { QC_DIVISION_BRAND } from "../../../../../app/theme/custom_themes/user/qualityControl/tokens";
import { STRINGS } from "../../../../../app/config/strings";
import RemoveProcessButton from "../../../../components/common/RemoveProcessButton";
import QCSchemaPanel from "./QCSchemaPanel";

const S = STRINGS.QUALITY_CONTROL.QC_DIVISION;

type QCDivisionEntryPanelProps = {
  entry: QcDivisionEntry;
  formData: QualityControlFormState;
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
  formData,
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
  const entryValues = formData.divisionEntryValues?.[entry.entryId];
  const fullSchema = getSchemaForDivisionEntry(formData, entry);
  const schema =
    entry.kind === "MIXING_FINAL_MIX" && fullSchema
      ? sliceMixingFinalMixSchema(fullSchema, "viscosity")
      : fullSchema;

  if (!schema || !entryValues) return null;

  if (entry.kind === "BOTH_PREMIX") {
    const solidSchema = getSolidSchemaForBothEntry(formData);
    const liquidSchema = getLiquidSchemaForBothEntry(formData);
    if (!solidSchema || !liquidSchema) return null;

    const solidValues = entryValues.schemaValues ?? createQcInitialValues(solidSchema);
    const liquidValues = entryValues.liquidSchemaValues ?? createQcInitialValues(liquidSchema);

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
              onClick={() => onRemoveEntry(entry.entryId)}
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
              hydrationKey={entry.entryId}
              subDepartmentId={subDepartmentId}
              batchId={batchId}
              onChange={(values) => onEntryValuesChange(entry.entryId, values)}
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
              hydrationKey={`${entry.entryId}-liquid`}
              subDepartmentId={subDepartmentId}
              batchId={batchId}
              onChange={(values) => onEntryLiquidValuesChange(entry.entryId, values)}
              readOnly={readOnly}
              loading={schemaLoading}
              error={schemaError}
            />
          </Box>
        </Stack>
      </Box>
    );
  }

  const formValues = entryValues.schemaValues ?? createQcInitialValues(schema);
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
              onClick={() => onRemoveEntry(entry.entryId)}
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
            onClick={() => onRemoveEntry(entry.entryId)}
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
              onClick={() => onRemoveEntry(entry.entryId)}
              dangerColor={BRAND.danger}
              tooltip={S.DIVISION_REMOVE_TOOLTIP}
            />
          ) : null}
        </Stack>
      ) : (
        <Stack direction="row" justifyContent="flex-end" alignItems="center" mb={1}>
          {!readOnly ? (
            <RemoveProcessButton
              onClick={() => onRemoveEntry(entry.entryId)}
              dangerColor={BRAND.danger}
              tooltip={S.DIVISION_REMOVE_TOOLTIP}
            />
          ) : null}
        </Stack>
      )}

      <QCSchemaPanel
        schema={schema}
        formValues={formValues}
        hydrationKey={entry.entryId}
        subDepartmentId={subDepartmentId}
        batchId={batchId}
        onChange={(values) => onEntryValuesChange(entry.entryId, values)}
        readOnly={readOnly}
        loading={schemaLoading}
        error={schemaError}
      />
    </Box>
  );
};

export default QCDivisionEntryPanel;
