import { memo, useCallback, useEffect, useMemo, type ReactNode } from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import type { QcDivisionEntry, QcDivisionEntryValues } from "../../../../../data/models/user/QualityControlFormModel";
import { createQcInitialValues } from "../../../../../schema-engine/adapters/qc.adapter";
import type { SchemaDocumentV2, SchemaFormValues } from "../../../../../schema-engine";
import { QC_DIVISION_BRAND } from "../../../../../app/theme/custom_themes/user/qualityControl/tokens";
import { STRINGS } from "../../../../../app/config/strings";
import RemoveProcessButton from "../../../../components/common/RemoveProcessButton";
import SubmitForApprovalButton from "../../../../components/common/SubmitForApprovalButton";
import QCSchemaPanel from "./QCSchemaPanel";
import QCSchemaBufferingLoader from "./QCSchemaBufferingLoader";
import QCDivisionSavedSectionsDisplay from "./components/QCDivisionSavedSectionsDisplay";
import QCRawMaterialRevalidationTable from "./QCRawMaterialRevalidationTable";
import QCMixingDetailsTable from "./QCMixingDetailsTable";
import QCMixingViscosityTable from "./QCMixingViscosityTable";
import QCHardwareProcessPanel from "./QCHardwareProcessPanel";
import QCCastingMotorPanel from "./QCCastingMotorPanel";
import QCCuringMotorPanel from "./QCCuringMotorPanel";
import QCDeCoringMotorPanel from "./QCDeCoringMotorPanel";
import QCTrimmingMotorPanel from "./QCTrimmingMotorPanel";
import QCPostCureMotorPanel from "./QCPostCureMotorPanel";
import QCNdtMotorPanel from "./QCNdtMotorPanel";
import QCPropellantMotorPanel from "./QCPropellantMotorPanel";
import QCWeighmentMotorPanel from "./QCWeighmentMotorPanel";
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
  isQcHardwareProcessSubType,
} from "../../../../../hooks/user/qualityControl/qcHardwareTables";
import {
  createInitialCastingValues,
  hydrateCastingValuesFromSections,
} from "../../../../../hooks/user/qualityControl/qcCastingTables";
import {
  createInitialCuringValues,
  getCuringSetupField,
  hydrateCuringValuesFromSections,
  setCuringSetupField,
} from "../../../../../hooks/user/qualityControl/qcCuringTables";
import {
  createInitialDeCoringValues,
  hydrateDeCoringValuesFromSections,
} from "../../../../../hooks/user/qualityControl/qcDeCoringTables";
import {
  createInitialTrimmingValues,
  hydrateTrimmingValuesFromSections,
} from "../../../../../hooks/user/qualityControl/qcTrimmingTables";
import {
  createInitialPostCureValues,
  hydratePostCureValuesFromSections,
  postCureFormValuesHaveUserData,
} from "../../../../../hooks/user/qualityControl/qcPostCureTables";
import {
  createInitialNdtValues,
  hydrateNdtValuesFromSections,
} from "../../../../../hooks/user/qualityControl/qcNdtTables";
import {
  createInitialPropellantValues,
  hydratePropellantValuesFromSections,
} from "../../../../../hooks/user/qualityControl/qcPropellantTables";
import { resolveQcPropellantPremixCount } from "../../../../../hooks/user/qualityControl/qcPropellantConfig";
import {
  createInitialWeighmentValues,
  hydrateWeighmentValuesFromSections,
} from "../../../../../hooks/user/qualityControl/qcWeighmentTables";
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
  saveDraftLabel?: string;
  submitLabel?: string;
  draftConfirmTitle?: string;
  draftConfirmMessage?: string;
  submitConfirmTitle?: string;
  submitConfirmMessage?: string;
  showViewDetails?: boolean;
  canViewDetails?: boolean;
  viewDetailsLabel?: string;
  onSaveDraft?: () => void;
  onSubmit?: () => void;
  onViewDetails?: () => void;
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
  /** Waiting/Approved lock — disable edits without details theme. */
  fieldsDisabled?: boolean;
  schemaLoading?: boolean;
  schemaError?: string | null;
  onEntryValuesChange: (
    entryId: string,
    values: SchemaFormValues | ((prev: SchemaFormValues) => SchemaFormValues),
  ) => void;
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
  fieldsDisabled = false,
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
      entry.kind === "CASTING_MOTOR" ||
      entry.kind === "CURING_MOTOR" ||
      entry.kind === "DE_CORING_MOTOR" ||
      entry.kind === "TRIMMING_MOTOR" ||
      entry.kind === "POST_CURE_MOTOR" ||
      entry.kind === "NDT_MOTOR" ||
      entry.kind === "PROPELLANT_MOTOR" ||
      entry.kind === "PROPELLANT_PROCESS"
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
    (valuesOrUpdater: SchemaFormValues | ((prev: SchemaFormValues) => SchemaFormValues)) => {
      if (entry.kind === "MIXING_FINAL_MIX") {
        // Viscosity table may pass viscosity-only or full blob — keep details, take viscosity from `values`.
        const values =
          typeof valuesOrUpdater === "function"
            ? valuesOrUpdater(entryValues.schemaValues ?? {})
            : valuesOrUpdater;
        onEntryValuesChange(
          entry.entryId,
          mergeFinalMixEntrySchemaValues(
            pickFinalMixDetailsSchemaValues(entryValues.schemaValues),
            pickViscositySchemaValues(values),
          ),
        );
        return;
      }
      onEntryValuesChange(entry.entryId, valuesOrUpdater);
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
      !fieldsDisabled &&
      entry.kind !== "REVALIDATION" &&
      entry.kind !== "MIXING_PREMIX" &&
      entry.kind !== "MIXING_FINAL_MIX" &&
      entry.kind !== "HARDWARE_PROCESS" &&
      entry.kind !== "CASTING_MOTOR" &&
      entry.kind !== "CURING_MOTOR" &&
      entry.kind !== "DE_CORING_MOTOR" &&
      entry.kind !== "TRIMMING_MOTOR" &&
      entry.kind !== "POST_CURE_MOTOR" &&
      entry.kind !== "NDT_MOTOR" &&
      entry.kind !== "PROPELLANT_MOTOR" &&
      entry.kind !== "PROPELLANT_PROCESS" &&
      entry.kind !== "WEIGHTMENT_MOTOR";
    if (!showUnitActions && !showRemove) return null;

    return (
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
              {unitActions?.saveDraftLabel ?? S.SAVE_UNIT_DRAFT}
            </Button>
            <SubmitForApprovalButton
              disabled={
                readOnly || fieldsDisabled || !unitActions?.canAct || unitActions?.actionLoading
              }
              onClick={unitActions?.onSubmit}
              label={unitActions?.submitLabel ?? S.SUBMIT_UNIT}
            />
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
  }, [BRAND.danger, entry.kind, fieldsDisabled, handleRemove, readOnly, unitActions]);

  const formValues = useMemo(() => {
    const saved = entryValues.schemaValues;
    const hasSavedValues = Boolean(saved && Object.keys(saved).length > 0);
    if (
      entry.kind === "POST_CURE_MOTOR" &&
      (!hasSavedValues || !postCureFormValuesHaveUserData(saved))
    ) {
      if (entry.savedSections?.length) {
        return hydratePostCureValuesFromSections(
          entry.savedSections,
          entry.subType,
          entry.inhibitorType,
        );
      }
      if (hasSavedValues) return saved!;
      return createInitialPostCureValues(entry.subType, entry.inhibitorType);
    }
    if (hasSavedValues) return saved!;
    if (entry.kind === "REVALIDATION") {
      if (entry.savedSections?.length) {
        return hydrateRevalidationValuesFromSections(entry.savedSections);
      }
      return createInitialRevalidationSchemaValues();
    }
    if (entry.kind === "HARDWARE_PROCESS") {
      const subType = String(entry.subType ?? "");
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
    if (entry.kind === "CURING_MOTOR") {
      if (entry.savedSections?.length) {
        let hydrated = hydrateCuringValuesFromSections(entry.savedSections);
        if (!getCuringSetupField(hydrated, "CURING_TYPE") && entry.subType) {
          hydrated = setCuringSetupField(hydrated, "CURING_TYPE", String(entry.subType));
        }
        return hydrated;
      }
      return createInitialCuringValues(entry.subType);
    }
    if (entry.kind === "DE_CORING_MOTOR") {
      if (entry.savedSections?.length) {
        return hydrateDeCoringValuesFromSections(entry.savedSections);
      }
      return createInitialDeCoringValues();
    }
    if (entry.kind === "TRIMMING_MOTOR") {
      if (entry.savedSections?.length) {
        return hydrateTrimmingValuesFromSections(entry.savedSections, {
          motorReceivedAt: entry.motorReceivedDate ?? "",
        });
      }
      return createInitialTrimmingValues(entry.motorReceivedDate ?? "");
    }
    if (entry.kind === "NDT_MOTOR") {
      if (entry.savedSections?.length) {
        return hydrateNdtValuesFromSections(entry.savedSections);
      }
      return createInitialNdtValues();
    }
    if (entry.kind === "PROPELLANT_MOTOR" || entry.kind === "PROPELLANT_PROCESS") {
      const fmCount = resolveQcPropellantPremixCount(divisionAutoPopulateData, batchPayload);
      if (entry.savedSections?.length) {
        return hydratePropellantValuesFromSections(entry.savedSections, fmCount);
      }
      return createInitialPropellantValues(fmCount);
    }
    if (entry.kind === "WEIGHTMENT_MOTOR") {
      if (entry.savedSections?.length) {
        return hydrateWeighmentValuesFromSections(entry.savedSections);
      }
      return createInitialWeighmentValues();
    }
    return resolvedSchema ? createQcInitialValues(resolvedSchema) : {};
  }, [
    batchPayload,
    divisionAutoPopulateData,
    entry.inhibitorType,
    entry.kind,
    entry.motorReceivedDate,
    entry.savedSections,
    entry.subType,
    entryValues.schemaValues,
    resolvedSchema,
  ]);

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
      <Box
        sx={
          fieldsDisabled && !readOnly
            ? { pointerEvents: "none", userSelect: "none", opacity: 0.92 }
            : undefined
        }
      >
        <QCHardwareProcessPanel
          subType={String(entry.subType ?? "")}
          values={formValues}
          onChange={handleValuesChange}
          readOnly={readOnly}
          headerActions={headerActions}
        />
      </Box>
    );
  }

  if (entry.kind === "CASTING_MOTOR") {
    return (
      <Box
        sx={
          fieldsDisabled && !readOnly
            ? { pointerEvents: "none", userSelect: "none", opacity: 0.92 }
            : undefined
        }
      >
        <QCCastingMotorPanel
          motorId={entry.motorId}
          values={formValues}
          onChange={handleValuesChange}
          readOnly={readOnly}
          headerActions={headerActions}
        />
      </Box>
    );
  }

  if (entry.kind === "CURING_MOTOR") {
    return (
      <Box
        sx={
          fieldsDisabled && !readOnly
            ? { pointerEvents: "none", userSelect: "none", opacity: 0.92 }
            : undefined
        }
      >
        <QCCuringMotorPanel
          motorId={entry.motorId}
          curingSubType={entry.subType}
          values={formValues}
          onChange={handleValuesChange}
          readOnly={readOnly}
          headerActions={headerActions}
        />
      </Box>
    );
  }

  if (entry.kind === "DE_CORING_MOTOR") {
    return (
      <QCDeCoringMotorPanel
        motorId={entry.motorId}
        values={formValues}
        onChange={handleValuesChange}
        readOnly={readOnly}
        disabled={fieldsDisabled}
        headerActions={headerActions}
      />
    );
  }

  if (entry.kind === "TRIMMING_MOTOR") {
    return (
      <QCTrimmingMotorPanel
        motorId={entry.motorId}
        values={formValues}
        onChange={handleValuesChange}
        readOnly={readOnly}
        disabled={fieldsDisabled}
        headerActions={headerActions}
      />
    );
  }

  if (entry.kind === "POST_CURE_MOTOR") {
    return (
      <QCPostCureMotorPanel
        motorId={entry.motorId}
        subType={entry.subType}
        inhibitorType={entry.inhibitorType}
        values={formValues}
        onChange={handleValuesChange}
        readOnly={readOnly}
        disabled={fieldsDisabled}
        headerActions={headerActions}
      />
    );
  }

  if (entry.kind === "NDT_MOTOR") {
    return (
      <QCNdtMotorPanel
        motorId={entry.motorId}
        values={formValues}
        onChange={handleValuesChange}
        readOnly={readOnly}
        disabled={fieldsDisabled}
        headerActions={headerActions}
      />
    );
  }

  if (entry.kind === "PROPELLANT_MOTOR" || entry.kind === "PROPELLANT_PROCESS") {
    return (
      <QCPropellantMotorPanel
        motorId={entry.motorId}
        values={formValues}
        onChange={handleValuesChange}
        readOnly={readOnly}
        disabled={fieldsDisabled}
        headerActions={headerActions}
        batchPayload={divisionAutoPopulateData ?? batchPayload}
      />
    );
  }

  if (entry.kind === "WEIGHTMENT_MOTOR") {
    return (
      <QCWeighmentMotorPanel
        motorId={entry.motorId}
        values={formValues}
        onChange={handleValuesChange}
        readOnly={readOnly}
        disabled={fieldsDisabled}
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
          ...(fieldsDisabled && !readOnly
            ? { pointerEvents: "none", userSelect: "none", opacity: 0.92 }
            : null),
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
          ...(fieldsDisabled && !readOnly
            ? { pointerEvents: "none", userSelect: "none", opacity: 0.92 }
            : null),
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
          ...(fieldsDisabled && !readOnly
            ? { pointerEvents: "none", userSelect: "none", opacity: 0.92 }
            : null),
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
              readOnly={fieldsDisabled}
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
              readOnly={fieldsDisabled}
              loading={schemaLoading}
              error={schemaError}
            />
          </Box>
        </Stack>
      </Box>
    );
  }

  const showEntryHeader =
    entry.kind !== "TRIMMING_MOTOR" &&
    entry.kind !== "DE_CORING_MOTOR" &&
    entry.kind !== "POST_CURE_MOTOR" &&
    entry.kind !== "NDT_MOTOR" &&
    entry.kind !== "PROPELLANT_MOTOR" &&
    entry.kind !== "PROPELLANT_PROCESS" &&
    entry.kind !== "WEIGHTMENT_MOTOR";
  const isTrimmingMotor = false;

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
        readOnly={fieldsDisabled}
        loading={schemaLoading}
        error={schemaError}
      />
    </Box>
  );
};

export default memo(QCDivisionEntryPanel);
