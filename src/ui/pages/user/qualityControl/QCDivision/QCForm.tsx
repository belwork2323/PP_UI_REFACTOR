import { useMemo } from "react";
import { Box, Chip, CircularProgress, Stack, Typography } from "@mui/material";
import { icons } from "../../../../../app/theme/icons";
import { STRINGS } from "../../../../../app/config/strings";
import { QC_DIVISION_BRAND } from "../../../../../app/theme/custom_themes/user/qualityControl/tokens";
import type { QcDivisionEntry, QualityControlFormState } from "../../../../../data/models/user/QualityControlFormModel";
import { getQcSchemaCacheKey } from "../../../../../hooks/user/qualityControl/qcFlowConfig";
import {
  buildDivisionNavGroups,
  resolveActiveNavContent,
} from "../../../../../hooks/user/qualityControl/qcDivisionNav";
import { sliceMixingFinalMixSchema } from "../../../../../hooks/user/qualityControl/qcMixingConfig";
import { createQcInitialValues } from "../../../../../schema-engine/adapters/qc.adapter";
import QCDivisionEntryPanel from "./QCDivisionEntryPanel";
import QCDivisionNavPanel from "./QCDivisionNavPanel";
import QCFlowBar from "./QCFlowBar";
import QCSchemaPanel from "./QCSchemaPanel";

const S = STRINGS.QUALITY_CONTROL.QC_DIVISION;
const { science: ScienceRoundedIcon } = icons.user.qualityControl.qcDivision.form;

const isDivisionEntryVisible = (entry: QcDivisionEntry, activeContent: ReturnType<typeof resolveActiveNavContent>) => {
  if (!activeContent) return false;
  if (activeContent.type === "final-mix-details") return false;
  if (activeContent.type === "entry") return activeContent.entry.entryId === entry.entryId;
  if (activeContent.type === "motor-entries") {
    return activeContent.entries.some((item) => item.entryId === entry.entryId);
  }
  return false;
};

type QCFormProps = {
  batch?: { batchId?: string } | null;
  formData: QualityControlFormState;
  subDepartmentId?: number;
  selectedDivision: string;
  selectedRawMaterialType: string;
  selectedProcessingType: string;
  selectedPremix: number | "";
  selectedMixingStage: string;
  selectedStfMotorType: string;
  selectedMotorId: string;
  selectedHardwareProcesses: string[];
  selectedCuringType: string;
  selectedTrimmingMotorCount: number | "";
  trimmingMotorReceivedDate: string;
  selectedPostCureOperation: string;
  selectedInhibitorType: string;
  selectedPropellantProcess: string;
  weightmentWeighscaleNo: string;
  weightmentCalibrationDueDate: string;
  addedPremixNumbers: number[];
  addedDivisionEntryKeys: string[];
  activeDivisionGroupIndex: number;
  activeDivisionSubIndex: number;
  isEditMode?: boolean;
  readOnly?: boolean;
  schemaLoading?: boolean;
  schemaError?: string | null;
  flowBarTheme: any;
  onDivisionChange: (value: string) => void;
  onRawMaterialTypeChange: (value: string) => void;
  onProcessingTypeChange: (value: string) => void;
  onPremixChange: (value: number | "") => void;
  onMixingStageChange: (value: string) => void;
  onStfMotorTypeChange: (value: string) => void;
  onMotorIdChange: (value: string) => void;
  onHardwareProcessesChange: (values: string[]) => void;
  onCuringTypeChange: (value: string) => void;
  onTrimmingMotorCountChange: (value: number | "") => void;
  onTrimmingMotorReceivedDateChange: (value: string) => void;
  onPostCureOperationChange: (value: string) => void;
  onInhibitorTypeChange: (value: string) => void;
  onPropellantProcessChange: (value: string) => void;
  onWeightmentWeighscaleNoChange: (value: string) => void;
  onWeightmentCalibrationDueDateChange: (value: string) => void;
  onLoadForm: () => void;
  onActiveDivisionGroupIndexChange: (index: number) => void;
  onActiveDivisionSubIndexChange: (index: number) => void;
  onDivisionEntryValuesChange: (
    entryId: string,
    values: import("../../../../../schema-engine").SchemaFormValues,
  ) => void;
  onDivisionEntryLiquidValuesChange: (
    entryId: string,
    values: import("../../../../../schema-engine").SchemaFormValues,
  ) => void;
  onMixingFinalMixDetailsChange: (values: import("../../../../../schema-engine").SchemaFormValues) => void;
  onRemoveDivisionEntry: (entryId: string) => void;
  theme: any;
};

const QCForm = ({
  batch,
  formData,
  subDepartmentId,
  selectedDivision,
  selectedRawMaterialType,
  selectedProcessingType,
  selectedPremix,
  selectedMixingStage,
  selectedStfMotorType,
  selectedMotorId,
  selectedHardwareProcesses,
  selectedCuringType,
  selectedTrimmingMotorCount,
  trimmingMotorReceivedDate,
  selectedPostCureOperation,
  selectedInhibitorType,
  selectedPropellantProcess,
  weightmentWeighscaleNo,
  weightmentCalibrationDueDate,
  addedPremixNumbers,
  addedDivisionEntryKeys,
  activeDivisionGroupIndex,
  activeDivisionSubIndex,
  isEditMode = false,
  readOnly = false,
  schemaLoading = false,
  schemaError = null,
  flowBarTheme,
  onDivisionChange,
  onRawMaterialTypeChange,
  onProcessingTypeChange,
  onPremixChange,
  onMixingStageChange,
  onStfMotorTypeChange,
  onMotorIdChange,
  onHardwareProcessesChange,
  onCuringTypeChange,
  onTrimmingMotorCountChange,
  onTrimmingMotorReceivedDateChange,
  onPostCureOperationChange,
  onInhibitorTypeChange,
  onPropellantProcessChange,
  onWeightmentWeighscaleNoChange,
  onWeightmentCalibrationDueDateChange,
  onLoadForm,
  onActiveDivisionGroupIndexChange,
  onActiveDivisionSubIndexChange,
  onDivisionEntryValuesChange,
  onDivisionEntryLiquidValuesChange,
  onMixingFinalMixDetailsChange,
  onRemoveDivisionEntry,
  theme,
}: QCFormProps) => {
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

  return (
    <Box sx={{ fontFamily: "'DM Sans', sans-serif" }}>
      {isEditMode ? (
        <Box
          sx={{
            mb: 2.5,
            px: 2,
            py: 1.5,
            borderRadius: 2,
            background: "rgba(192,57,43,0.05)",
            border: "1.5px solid rgba(192,57,43,0.2)",
            display: "flex",
            alignItems: "center",
            gap: 1.2,
          }}
        >
          <Typography sx={{ fontSize: "0.8rem", color: BRAND.danger, fontWeight: 600 }}>
            {S.EDIT_MODE_BANNER}
          </Typography>
        </Box>
      ) : null}

      <Box
        sx={{
          borderRadius: 2.5,
          border: `1px solid ${theme.palette.border}`,
          background: `linear-gradient(135deg, ${BRAND.surface} 0%, #fff 100%)`,
          px: 2,
          py: 1.75,
          mb: 2.5,
        }}
      >
        <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ sm: "center" }} gap={1.5}>
          <Stack direction="row" alignItems="center" gap={1.5} flex={1}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: "12px",
                background: `linear-gradient(135deg,${BRAND.primary},${BRAND.primaryLight})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: `0 4px 14px ${BRAND.primary}40`,
              }}
            >
              <ScienceRoundedIcon sx={{ color: "#fff", fontSize: 20 }} />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 800, fontSize: "1rem", color: BRAND.text }}>{S.TITLE}</Typography>
              <Typography sx={{ fontSize: "0.74rem", color: BRAND.textSub, mt: 0.2 }}>
                {S.SUBTITLE}
                {batch?.batchId ? ` · ${batch.batchId}` : ""}
              </Typography>
            </Box>
          </Stack>
          {hasDivisionEntries ? (
            <Chip
              label={`${divisionEntries.length} division${divisionEntries.length === 1 ? "" : "s"} added`}
              size="small"
              sx={{
                height: 26,
                fontWeight: 700,
                fontSize: "0.7rem",
                alignSelf: { xs: "flex-start", sm: "center" },
                background: "rgba(27,79,114,0.1)",
                color: BRAND.primary,
                border: `1px solid ${BRAND.primary}44`,
              }}
            />
          ) : null}
        </Stack>
      </Box>

      {!readOnly ? (
        <QCFlowBar
          batch={batch}
          selectedDivision={selectedDivision}
          selectedRawMaterialType={selectedRawMaterialType}
          selectedProcessingType={selectedProcessingType}
          selectedPremix={selectedPremix}
          selectedMixingStage={selectedMixingStage}
          selectedStfMotorType={selectedStfMotorType}
          selectedMotorId={selectedMotorId}
          selectedHardwareProcesses={selectedHardwareProcesses}
          selectedCuringType={selectedCuringType}
          selectedTrimmingMotorCount={selectedTrimmingMotorCount}
          trimmingMotorReceivedDate={trimmingMotorReceivedDate}
          selectedPostCureOperation={selectedPostCureOperation}
          selectedInhibitorType={selectedInhibitorType}
          selectedPropellantProcess={selectedPropellantProcess}
          weightmentWeighscaleNo={weightmentWeighscaleNo}
          weightmentCalibrationDueDate={weightmentCalibrationDueDate}
          addedPremixNumbers={addedPremixNumbers}
          addedDivisionEntryKeys={addedDivisionEntryKeys}
          hasDivisionEntries={hasDivisionEntries}
          schemaLoading={schemaLoading}
          onDivisionChange={onDivisionChange}
          onRawMaterialTypeChange={onRawMaterialTypeChange}
          onProcessingTypeChange={onProcessingTypeChange}
          onPremixChange={onPremixChange}
          onMixingStageChange={onMixingStageChange}
          onStfMotorTypeChange={onStfMotorTypeChange}
          onMotorIdChange={onMotorIdChange}
          onHardwareProcessesChange={onHardwareProcessesChange}
          onCuringTypeChange={onCuringTypeChange}
          onTrimmingMotorCountChange={onTrimmingMotorCountChange}
          onTrimmingMotorReceivedDateChange={onTrimmingMotorReceivedDateChange}
          onPostCureOperationChange={onPostCureOperationChange}
          onInhibitorTypeChange={onInhibitorTypeChange}
          onPropellantProcessChange={onPropellantProcessChange}
          onWeightmentWeighscaleNoChange={onWeightmentWeighscaleNoChange}
          onWeightmentCalibrationDueDateChange={onWeightmentCalibrationDueDateChange}
          onLoadForm={onLoadForm}
          theme={flowBarTheme}
        />
      ) : null}

      {schemaLoading && !hasDivisionEntries ? (
        <Box
          sx={{
            borderRadius: 2.5,
            border: `1px solid ${theme.palette.border}`,
            background: theme.palette.surface,
            px: 2,
            py: 5,
            display: "flex",
            justifyContent: "center",
            mt: 2,
          }}
        >
          <CircularProgress size={28} />
        </Box>
      ) : null}

      {hasDivisionEntries && navGroups.length > 0 ? (
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

            {divisionEntries.map((entry) => (
              <Box
                key={entry.entryId}
                sx={{ display: isDivisionEntryVisible(entry, activeContent) ? "block" : "none" }}
              >
                <QCDivisionEntryPanel
                  entry={entry}
                  formData={formData}
                  subDepartmentId={subDepartmentId}
                  batchId={batch?.batchId}
                  readOnly={readOnly}
                  schemaLoading={schemaLoading}
                  schemaError={schemaError}
                  onEntryValuesChange={onDivisionEntryValuesChange}
                  onEntryLiquidValuesChange={onDivisionEntryLiquidValuesChange}
                  onRemoveEntry={onRemoveDivisionEntry}
                />
              </Box>
            ))}
          </Box>
        </>
      ) : (
        <Box
          sx={{
            mt: 2,
            borderRadius: 2.5,
            border: `1px solid ${BRAND.border}`,
            background: BRAND.surface,
            px: 2,
            py: 2.5,
          }}
        >
          <Typography sx={{ fontSize: "0.8rem", color: BRAND.textSub, textAlign: "center" }}>
            {S.DIVISION_NO_ENTRIES_MESSAGE}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default QCForm;
