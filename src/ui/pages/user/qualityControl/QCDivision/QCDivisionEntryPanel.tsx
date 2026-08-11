import { memo, useCallback, useEffect, useMemo, type ReactNode } from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import type { QcDivisionEntry, QcDivisionEntryValues } from "../../../../../data/models/user/QualityControlFormModel";
import { createQcInitialValues } from "../../../../../schema-engine/adapters/qc.adapter";
import type { SchemaDocumentV2, SchemaFormValues } from "../../../../../schema-engine";
import { QC_DIVISION_BRAND } from "../../../../../app/theme/custom_themes/user/qualityControl/tokens";
import { STRINGS } from "../../../../../app/config/strings";
import RemoveProcessButton from "../../../../components/common/RemoveProcessButton";
import QCSchemaPanel from "./QCSchemaPanel";
import QCSchemaBufferingLoader from "./QCSchemaBufferingLoader";
import QCDivisionSavedSectionsDisplay from "./components/QCDivisionSavedSectionsDisplay";
import QCRawMaterialRevalidationTable from "./QCRawMaterialRevalidationTable";
import QCMixingDetailsTable from "./QCMixingDetailsTable";
import QCMixingViscosityTable from "./QCMixingViscosityTable";
import QCHardwareProcessPanel from "./QCHardwareProcessPanel";
import QCCastingMotorPanel from "./QCCastingMotorPanel";
import {
  applyMixingDivisionEntryToValues,
  createInitialPremixDetailsValues,
  createInitialViscosityValues,
  hydrateMixingDetailsValuesFromSections,
  hydrateViscosityValuesFromSections,
  mergeFinalMixEntrySchemaValues,
  pickFinalMixDetailsSchemaValues,
  pickViscositySchemaValues,
  resolveMixingDetailsSeed,
  type QcMixingQualityCheckDefinition,
} from "../../../../../hooks/user/qualityControl/qcMixingTables";
import {
  createInitialHardwareProcessValues,
  hydrateHardwareProcessValuesFromSections,
  hydrateHardwareUploadValuesFromSections,
  isQcHardwareProcessSubType,
  mergeHardwareUploadValuesIntoEntryValues,
} from "../../../../../hooks/user/qualityControl/qcHardwareTables";
import {
  createInitialCastingValues,
  hydrateCastingValuesFromSections,
} from "../../../../../hooks/user/qualityControl/qcCastingTables";
import {
  createInitialRevalidationSchemaValues,
  hydrateRevalidationValuesFromSections,
} from "../../../../../hooks/user/qualityControl/qcRawMaterialRevalidationTable";

const S = STRINGS.QUALITY_CONTROL.QC_DIVISION;

export type QCDivisionEntryUnitActions = {
  show?: boolean;
  canAct?: boolean;
  actionLoading?: boolean;
  isEditMode?: boolean;
  onSaveDraft?: () => void;
  onSubmit?: () => void;
};

type QCDivisionEntryPanelProps = {
  entry: QcDivisionEntry;
  entryValues: QcDivisionEntryValues;
  schema: SchemaDocumentV2 | null;
  solidSchema?: SchemaDocumentV2 | null;
  liquidSchema?: SchemaDocumentV2 | null;
  subDepartmentId?: number;
  batchId?: string;
  divisionAutoPopulateData?: Record<string, unknown> | null;
  mixingQualityCheckDefinitions?: QcMixingQualityCheckDefinition[] | null;
  batchPayload?: unknown;
  readOnly?: boolean;
  schemaLoading?: boolean;
  schemaError?: string | null;
  onEntryValuesChange: (entryId: string, values: SchemaFormValues) => void;
  onEntryLiquidValuesChange: (entryId: string, values: SchemaFormValues) => void;
  onRemoveEntry: (entryId: string) => void;
  unitActions?: QCDivisionEntryUnitActions | null;
};

const QCDivisionEntryPanel = ({
  entry,
  entryValues,
  schema,
  solidSchema = null,
  liquidSchema = null,
  subDepartmentId,
  batchId,
  divisionAutoPopulateData = null,
  mixingQualityCheckDefinitions = null,
  batchPayload = null,
  readOnly = false,
  schemaLoading = false,
  schemaError = null,
  onEntryValuesChange,
  onEntryLiquidValuesChange,
  onRemoveEntry,
  unitActions = null,
}: QCDivisionEntryPanelProps) => {
  const BRAND = QC_DIVISION_BRAND;

  const resolvedSchema = useMemo(() => {
    if (!schema) return null;
    if (
      entry.kind === "MIXING_PREMIX" ||
      entry.kind === "MIXING_FINAL_MIX" ||
      entry.kind === "HARDWARE_PROCESS" ||
      entry.kind === "CASTING_MOTOR"
    ) {
      return null;
    }
    return schema;
  }, [entry.kind, schema]);

  const mixingPremixValues = useMemo(() => {
    const saved = entryValues.schemaValues;
    if (saved && Object.keys(saved).length > 0) return saved;
    if (entry.savedSections?.length) {
      return hydrateMixingDetailsValuesFromSections(entry.savedSections, "premix");
    }
    return createInitialPremixDetailsValues(mixingQualityCheckDefinitions);
  }, [
    entry.savedSections,
    entryValues.schemaValues,
    mixingQualityCheckDefinitions,
  ]);

  const premixAutoSeed = useMemo(
    () =>
      resolveMixingDetailsSeed({
        variant: "premix",
        premixNo: entry.premixNo,
        autoPopulatePayload:
          (divisionAutoPopulateData as { __manufacturingDivisionData?: unknown } | null)
            ?.__manufacturingDivisionData ?? divisionAutoPopulateData,
        batchPayload,
      }),
    [batchPayload, divisionAutoPopulateData, entry.premixNo],
  );

  const mixingViscosityValues = useMemo(() => {
    const saved = entryValues.schemaValues;
    if (saved && Object.keys(saved).length > 0) return saved;
    if (entry.savedSections?.length) {
      return hydrateViscosityValuesFromSections(entry.savedSections);
    }
    return createInitialViscosityValues();
  }, [entry.savedSections, entryValues.schemaValues]);

  const handleValuesChange = useCallback(
    (values: SchemaFormValues) => {
      if (entry.kind === "MIXING_FINAL_MIX") {
        // Viscosity table may pass viscosity-only or full blob — keep details, take viscosity from `values`.
        onEntryValuesChange(
          entry.entryId,
          mergeFinalMixEntrySchemaValues(
            pickFinalMixDetailsSchemaValues(entryValues.schemaValues),
            pickViscositySchemaValues(values),
          ),
        );
        return;
      }
      onEntryValuesChange(entry.entryId, values);
    },
    [entry.entryId, entry.kind, entryValues.schemaValues, onEntryValuesChange],
  );

  // Seed Premix once when the entry/seed source changes — never on every keystroke.
  useEffect(() => {
    if (readOnly || entry.kind !== "MIXING_PREMIX") return;
    if (!premixAutoSeed && !(mixingQualityCheckDefinitions?.length)) return;
    const current = entryValues.schemaValues;
    if (current && Object.keys(current).length > 0) return;
    const seeded = applyMixingDivisionEntryToValues(
      createInitialPremixDetailsValues(mixingQualityCheckDefinitions),
      {
        variant: "premix",
        premixNo: entry.premixNo,
        autoPopulatePayload: divisionAutoPopulateData,
        batchPayload,
        qualityCheckDefinitions: mixingQualityCheckDefinitions,
      },
      { onlyIfEmpty: true },
    );
    onEntryValuesChange(entry.entryId, seeded);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- seed only when entry identity / seed source arrives empty
  }, [
    batchPayload,
    divisionAutoPopulateData,
    entry.entryId,
    entry.kind,
    entry.premixNo,
    mixingQualityCheckDefinitions,
    premixAutoSeed,
    readOnly,
  ]);

  const handleLiquidValuesChange = useCallback(
    (values: SchemaFormValues) => onEntryLiquidValuesChange(entry.entryId, values),
    [entry.entryId, onEntryLiquidValuesChange],
  );

  const handleRemove = useCallback(() => onRemoveEntry(entry.entryId), [entry.entryId, onRemoveEntry]);

  const headerActions = useMemo((): ReactNode => {
    const showUnitActions = Boolean(unitActions?.show);
    // Mixing units are managed via Mix Navigation — no remove control.
    const showRemove =
      !readOnly &&
      entry.kind !== "MIXING_PREMIX" &&
      entry.kind !== "MIXING_FINAL_MIX" &&
      entry.kind !== "HARDWARE_PROCESS" &&
      entry.kind !== "CASTING_MOTOR";
    if (!showUnitActions && !showRemove) return null;

    return (
      <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap" justifyContent="flex-end">
        {showUnitActions ? (
          <>
            <Button
              size="small"
              variant="outlined"
              disabled={readOnly || !unitActions?.canAct || unitActions?.actionLoading}
              onClick={unitActions?.onSaveDraft}
              sx={{ textTransform: "none", whiteSpace: "nowrap" }}
            >
              {S.SAVE_UNIT_DRAFT}
            </Button>
            <Button
              size="small"
              variant="contained"
              disabled={readOnly || !unitActions?.canAct || unitActions?.actionLoading}
              onClick={unitActions?.onSubmit}
              sx={{ textTransform: "none", whiteSpace: "nowrap" }}
            >
              {unitActions?.isEditMode ? S.RESUBMIT_UNIT : S.SUBMIT_UNIT}
            </Button>
          </>
        ) : null}
        {showRemove ? (
          <RemoveProcessButton
            onClick={handleRemove}
            dangerColor={BRAND.danger}
            tooltip={S.DIVISION_REMOVE_TOOLTIP}
          />
        ) : null}
      </Stack>
    );
  }, [BRAND.danger, entry.kind, handleRemove, readOnly, unitActions]);

  const formValues = useMemo(() => {
    const saved = entryValues.schemaValues;
    if (saved && Object.keys(saved).length > 0) return saved;
    if (entry.kind === "REVALIDATION") {
      if (entry.savedSections?.length) {
        return hydrateRevalidationValuesFromSections(entry.savedSections);
      }
      return createInitialRevalidationSchemaValues();
    }
    if (entry.kind === "HARDWARE_PROCESS") {
      const subType = String(entry.subType ?? "");
      if (entry.savedSections?.length && isQcHardwareProcessSubType(subType)) {
        let values = hydrateHardwareProcessValuesFromSections(entry.savedSections, subType);
        if (subType === "ABRADING") {
          values = mergeHardwareUploadValuesIntoEntryValues(
            values,
            hydrateHardwareUploadValuesFromSections(entry.savedSections),
          );
        }
        return values;
      }
      if (isQcHardwareProcessSubType(subType)) {
        return createInitialHardwareProcessValues(subType);
      }
      return {};
    }
    if (entry.kind === "CASTING_MOTOR") {
      if (entry.savedSections?.length) {
        return hydrateCastingValuesFromSections(entry.savedSections);
      }
      return createInitialCastingValues();
    }
    return resolvedSchema ? createQcInitialValues(resolvedSchema) : {};
  }, [entry.kind, entry.savedSections, entry.subType, entryValues.schemaValues, resolvedSchema]);

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

  if (entry.kind === "HARDWARE_PROCESS") {
    return (
      <QCHardwareProcessPanel
        subType={String(entry.subType ?? "")}
        values={formValues}
        onChange={handleValuesChange}
        readOnly={readOnly}
        headerActions={headerActions}
      />
    );
  }

  if (entry.kind === "CASTING_MOTOR") {
    return (
      <QCCastingMotorPanel
        motorId={entry.motorId}
        values={formValues}
        onChange={handleValuesChange}
        readOnly={readOnly}
        headerActions={headerActions}
      />
    );
  }

  if (entry.kind === "REVALIDATION") {
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
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1} gap={1}>
          <Typography sx={{ fontSize: "0.84rem", fontWeight: 800, color: BRAND.primary }}>
            {entry.label}
          </Typography>
          {headerActions}
        </Stack>
        <QCRawMaterialRevalidationTable
          values={formValues}
          onChange={handleValuesChange}
          batchId={batchId}
          readOnly={readOnly}
        />
      </Box>
    );
  }

  if (entry.kind === "MIXING_PREMIX") {
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
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1} gap={1}>
          <Typography sx={{ fontSize: "0.84rem", fontWeight: 800, color: BRAND.primary }}>
            {entry.label}
          </Typography>
          {headerActions}
        </Stack>
        <QCMixingDetailsTable
          variant="premix"
          values={mixingPremixValues}
          onChange={handleValuesChange}
          readOnly={readOnly}
          autoSeed={premixAutoSeed}
        />
      </Box>
    );
  }

  if (entry.kind === "MIXING_FINAL_MIX") {
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
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1} gap={1}>
          <Typography sx={{ fontSize: "0.84rem", fontWeight: 800, color: BRAND.primary }}>
            {entry.label}
          </Typography>
          {headerActions}
        </Stack>
        <QCMixingViscosityTable
          values={mixingViscosityValues}
          onChange={handleValuesChange}
          readOnly={readOnly}
        />
      </Box>
    );
  }

  if (!entryValues) return null;

  if (!resolvedSchema) {
    if (schemaLoading) {
      return <QCSchemaBufferingLoader />;
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
      return <QCSchemaBufferingLoader />;
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
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5} gap={1}>
          <Typography sx={{ fontSize: "0.84rem", fontWeight: 800, color: BRAND.primary }}>
            {entry.label}
          </Typography>
          {headerActions}
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
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1.25} gap={1}>
          <Box>
            <Typography sx={{ fontSize: "0.8rem", fontWeight: 700, color: BRAND.primary }}>
              {entry.motorId}
            </Typography>
            <Typography sx={{ fontSize: "0.74rem", color: BRAND.textSub, mt: 0.25 }}>
              {S.TRIMMING_MOTOR_RECEIVED_DATE_LABEL}: {entry.motorReceivedDate?.trim() || "—"}
            </Typography>
          </Box>
          {headerActions}
        </Stack>
      ) : isWeightmentMotor ? (
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1.25} gap={1}>
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
          {headerActions}
        </Stack>
      ) : showEntryHeader ? (
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1} gap={1}>
          <Typography sx={{ fontSize: "0.84rem", fontWeight: 800, color: BRAND.primary }}>
            {entry.label}
          </Typography>
          {headerActions}
        </Stack>
      ) : (
        <Stack direction="row" justifyContent="flex-end" alignItems="center" mb={1}>
          {headerActions}
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
