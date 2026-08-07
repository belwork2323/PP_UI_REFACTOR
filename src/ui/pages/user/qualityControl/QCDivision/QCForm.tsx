import { useMemo } from "react";
import { Box, Chip, Stack, Typography } from "@mui/material";
import { icons } from "../../../../../app/theme/icons";
import { STRINGS } from "../../../../../app/config/strings";
import { QC_DIVISION_BRAND } from "../../../../../app/theme/custom_themes/user/qualityControl/tokens";
import type { QualityControlFormState } from "../../../../../data/models/user/QualityControlFormModel";
import { buildDivisionNavGroups } from "../../../../../hooks/user/qualityControl/qcDivisionNav";
import type {
  QcDivisionOption,
  QcRawMaterialTypeOption,
} from "../../../../../hooks/user/qualityControl/qcFlowConfig";
import type { QcPartialNavItem } from "../../../../../hooks/user/qualityControl/qcDivisionApprovalUnits";
import type { SchemaFormValues } from "../../../../../schema-engine";
import QCDivisionFormBody from "./QCDivisionFormBody";
import type { QCDivisionNavApprovalActions } from "./QCDivisionNavPanel";
import type { QCDivisionEntryUnitActions } from "./QCDivisionEntryPanel";
import QCFlowBar from "./QCFlowBar";
import QCPartialItemNavigation from "./QCPartialItemNavigation";

const S = STRINGS.QUALITY_CONTROL.QC_DIVISION;
const { science: ScienceRoundedIcon } = icons.user.qualityControl.qcDivision.form;

type QCFormProps = {
  batch?: { batchId?: string } | null;
  formData: QualityControlFormState;
  scopedFormData?: QualityControlFormState;
  subDepartmentId?: number;
  selectedDivision: string;
  divisionOptions?: QcDivisionOption[];
  divisionsLoading?: boolean;
  selectedRawMaterialType: string;
  rawMaterialTypeOptions?: QcRawMaterialTypeOption[];
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
  partialNavItems?: QcPartialNavItem[];
  activePartialNavIndex?: number;
  partialNavActive?: boolean;
  divisionGroupStatusByFlowKey?: Record<string, import("../../../../../hooks/user/qualityControl/qcDivisionApprovalUnits").QcPartialItemStatus>;
  isEditMode?: boolean;
  readOnly?: boolean;
  fieldsReadOnly?: boolean;
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
  onPartialNavIndexChange?: (index: number) => void;
  onActiveDivisionGroupIndexChange: (index: number) => void;
  onActiveDivisionSubIndexChange: (index: number) => void;
  onDivisionEntryValuesChange: (entryId: string, values: SchemaFormValues) => void;
  onDivisionEntryLiquidValuesChange: (entryId: string, values: SchemaFormValues) => void;
  onMixingFinalMixDetailsChange: (values: SchemaFormValues) => void;
  onRemoveDivisionEntry: (entryId: string) => void;
  navApprovalActions?: QCDivisionNavApprovalActions | null;
  unitActions?: QCDivisionEntryUnitActions | null;
  theme: any;
};

const QCForm = ({
  batch,
  formData,
  scopedFormData,
  subDepartmentId,
  selectedDivision,
  divisionOptions = [],
  divisionsLoading = false,
  selectedRawMaterialType,
  rawMaterialTypeOptions = [],
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
  partialNavItems = [],
  activePartialNavIndex = 0,
  partialNavActive = false,
  divisionGroupStatusByFlowKey = {},
  isEditMode = false,
  readOnly = false,
  fieldsReadOnly = false,
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
  onPartialNavIndexChange,
  onActiveDivisionGroupIndexChange,
  onActiveDivisionSubIndexChange,
  onDivisionEntryValuesChange,
  onDivisionEntryLiquidValuesChange,
  onMixingFinalMixDetailsChange,
  onRemoveDivisionEntry,
  navApprovalActions = null,
  unitActions = null,
  theme,
}: QCFormProps) => {
  const BRAND = QC_DIVISION_BRAND;
  const bodyFormData = scopedFormData ?? formData;
  const divisionEntries = bodyFormData.divisionEntries ?? [];
  const hasDivisionEntries = divisionEntries.length > 0;
  const navGroupsCount = useMemo(
    () => (hasDivisionEntries ? buildDivisionNavGroups(divisionEntries).length : 0),
    [divisionEntries, hasDivisionEntries],
  );

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
          {partialNavActive ? (
            <Chip
              label={`${partialNavItems.length} item${partialNavItems.length === 1 ? "" : "s"}`}
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
          ) : hasDivisionEntries ? (
            <Chip
              label={`${navGroupsCount} division${navGroupsCount === 1 ? "" : "s"} added`}
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
          divisionOptions={divisionOptions}
          divisionsLoading={divisionsLoading}
          selectedRawMaterialType={selectedRawMaterialType}
          rawMaterialTypeOptions={rawMaterialTypeOptions}
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
          partialNavActive={partialNavActive}
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

      {partialNavActive ? (
        <QCPartialItemNavigation
          items={partialNavItems}
          activeIndex={activePartialNavIndex}
          onActiveIndexChange={onPartialNavIndexChange ?? (() => undefined)}
          loading={schemaLoading}
        />
      ) : null}

      <QCDivisionFormBody
        batch={batch}
        formData={bodyFormData}
        subDepartmentId={subDepartmentId}
        activeDivisionGroupIndex={activeDivisionGroupIndex}
        activeDivisionSubIndex={activeDivisionSubIndex}
        readOnly={readOnly || fieldsReadOnly}
        schemaLoading={schemaLoading}
        schemaError={schemaError}
        hideDivisionSubNav={partialNavActive}
        groupStatusByFlowKey={divisionGroupStatusByFlowKey}
        onActiveDivisionGroupIndexChange={onActiveDivisionGroupIndexChange}
        onActiveDivisionSubIndexChange={onActiveDivisionSubIndexChange}
        onDivisionEntryValuesChange={onDivisionEntryValuesChange}
        onDivisionEntryLiquidValuesChange={onDivisionEntryLiquidValuesChange}
        onMixingFinalMixDetailsChange={onMixingFinalMixDetailsChange}
        onRemoveDivisionEntry={onRemoveDivisionEntry}
        navApprovalActions={navApprovalActions}
        unitActions={unitActions}
        theme={theme}
      />
    </Box>
  );
};

export default QCForm;
