import { useMemo } from "react";
import { Box, Chip, Stack, Typography } from "@mui/material";
import { icons } from "../../../../../app/theme/icons";
import { STRINGS } from "../../../../../app/config/strings";
import { QC_DIVISION_BRAND } from "../../../../../app/theme/custom_themes/user/qualityControl/tokens";
import type { QualityControlFormState } from "../../../../../data/models/user/QualityControlFormModel";
import type { QcDivisionCatalogNavTab } from "../../../../../hooks/user/qualityControl/qcFlowConfig";
import type {
  QcPartialItemStatus,
  QcPartialNavItem,
} from "../../../../../hooks/user/qualityControl/qcDivisionApprovalUnits";
import type { SchemaFormValues } from "../../../../../schema-engine";
import QCDivisionFormBody from "./QCDivisionFormBody";
import QCDivisionNavPanel, { type QCDivisionNavApprovalActions } from "./QCDivisionNavPanel";
import type { QCDivisionEntryUnitActions } from "./QCDivisionEntryPanel";
import QCFlowBar from "./QCFlowBar";
import QCPartialItemNavigation from "./QCPartialItemNavigation";
import QCSchemaBufferingLoader from "./QCSchemaBufferingLoader";
import type { QcMixingQualityCheckDefinition } from "../../../../../hooks/user/qualityControl/qcMixingTables";

const S = STRINGS.QUALITY_CONTROL.QC_DIVISION;
const { science: ScienceRoundedIcon } = icons.user.qualityControl.qcDivision.form;

type QCFormProps = {
  batch?: { batchId?: string } | null;
  divisionAutoPopulateData?: Record<string, unknown> | null;
  mixingQualityChecksByStage?: {
    PREMIX: QcMixingQualityCheckDefinition[];
    FINAL_MIX: QcMixingQualityCheckDefinition[];
  };
  formData: QualityControlFormState;
  scopedFormData?: QualityControlFormState;
  subDepartmentId?: number;
  selectedDivision: string;
  selectedRawMaterialType: string;
  selectedProcessingType: string;
  selectedPremix: number | "";
  selectedMixingStage: string;
  selectedStfMotorType: string;
  selectedMotorId: string;
  selectedHardwareProcesses: string[];
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
  divisionNavTabs?: QcDivisionCatalogNavTab[];
  activeDivisionTabKey?: string;
  divisionsLoading?: boolean;
  partialNavItems?: QcPartialNavItem[];
  activePartialNavIndex?: number;
  partialNavActive?: boolean;
  divisionGroupStatusByFlowKey?: Record<string, QcPartialItemStatus>;
  isPartialNavTabEnabled?: (index: number) => boolean;
  getPartialNavTabDisabledReason?: (index: number) => string | undefined;
  isDivisionNavTabEnabled?: (tabKey: string) => boolean;
  getDivisionNavTabDisabledReason?: (tabKey: string) => string | undefined;
  isEditMode?: boolean;
  readOnly?: boolean;
  fieldsReadOnly?: boolean;
  /** Hide add-unit flow bar when division itself is locked / view-only. */
  canEditDivisionStructure?: boolean;
  formLockMessage?: string | null;
  schemaLoading?: boolean;
  schemaError?: string | null;
  flowBarTheme: any;
  onDivisionNavTabChange: (tabKey: string) => void;
  onProcessingTypeChange: (value: string) => void;
  onPremixChange: (value: number | "") => void;
  onMixingStageChange: (value: string) => void;
  onStfMotorTypeChange: (value: string) => void;
  onMotorIdChange: (value: string) => void;
  onHardwareProcessesChange: (values: string[]) => void;
  onTrimmingMotorCountChange: (value: number | "") => void;
  onTrimmingMotorReceivedDateChange: (value: string) => void;
  onPostCureOperationChange: (value: string) => void;
  onInhibitorTypeChange: (value: string) => void;
  onPropellantProcessChange: (value: string) => void;
  onWeightmentWeighscaleNoChange: (value: string) => void;
  onWeightmentCalibrationDueDateChange: (value: string) => void;
  onLoadForm?: () => void;
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
  divisionAutoPopulateData = null,
  mixingQualityChecksByStage = { PREMIX: [], FINAL_MIX: [] },
  formData,
  scopedFormData,
  subDepartmentId,
  selectedDivision,
  selectedRawMaterialType,
  selectedProcessingType,
  selectedPremix,
  selectedMixingStage,
  selectedStfMotorType,
  selectedMotorId,
  selectedHardwareProcesses,
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
  divisionNavTabs = [],
  activeDivisionTabKey = "",
  divisionsLoading = false,
  partialNavItems = [],
  activePartialNavIndex = 0,
  partialNavActive = false,
  divisionGroupStatusByFlowKey = {},
  isPartialNavTabEnabled,
  getPartialNavTabDisabledReason,
  isDivisionNavTabEnabled,
  getDivisionNavTabDisabledReason,
  isEditMode = false,
  readOnly = false,
  fieldsReadOnly = false,
  canEditDivisionStructure = true,
  formLockMessage = null,
  schemaLoading = false,
  schemaError = null,
  flowBarTheme,
  onDivisionNavTabChange,
  onProcessingTypeChange,
  onPremixChange,
  onMixingStageChange,
  onStfMotorTypeChange,
  onMotorIdChange,
  onHardwareProcessesChange,
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
  const activeTabLabel = useMemo(
    () =>
      divisionNavTabs.find((tab) => tab.tabKey === activeDivisionTabKey)?.label ||
      selectedDivision ||
      "Division",
    [activeDivisionTabKey, divisionNavTabs, selectedDivision],
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
          <Typography sx={{ fontSize: "0.78rem", color: "#C0392B", fontWeight: 600 }}>
            {S.EDIT_MODE_BANNER}
          </Typography>
        </Box>
      ) : null}

      <Box
        sx={{
          mb: 2,
          p: 2,
          borderRadius: 2.5,
          border: `1px solid ${BRAND.border}`,
          background: BRAND.surface,
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          alignItems={{ xs: "flex-start", sm: "center" }}
          justifyContent="space-between"
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
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
              label={activeTabLabel}
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

      <QCDivisionNavPanel
        tabs={divisionNavTabs}
        activeTabKey={activeDivisionTabKey}
        statusByTabKey={divisionGroupStatusByFlowKey}
        loading={divisionsLoading}
        onTabChange={onDivisionNavTabChange}
        approvalActions={navApprovalActions}
        isTabEnabled={isDivisionNavTabEnabled}
        getTabDisabledReason={getDivisionNavTabDisabledReason}
      />

      {formLockMessage ? (
        <Box
          sx={{
            mb: 1.25,
            px: 1.25,
            py: 0.75,
            borderRadius: 1.5,
            border: `1px solid ${BRAND.border}`,
            bgcolor: BRAND.surface,
          }}
        >
          <Typography sx={{ fontSize: "0.72rem", color: BRAND.textSub, fontWeight: 600 }}>
            {formLockMessage}
          </Typography>
        </Box>
      ) : null}

      {canEditDivisionStructure ? (
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
          onProcessingTypeChange={onProcessingTypeChange}
          onPremixChange={onPremixChange}
          onMixingStageChange={onMixingStageChange}
          onStfMotorTypeChange={onStfMotorTypeChange}
          onMotorIdChange={onMotorIdChange}
          onHardwareProcessesChange={onHardwareProcessesChange}
          onTrimmingMotorCountChange={onTrimmingMotorCountChange}
          onTrimmingMotorReceivedDateChange={onTrimmingMotorReceivedDateChange}
          onPostCureOperationChange={onPostCureOperationChange}
          onInhibitorTypeChange={onInhibitorTypeChange}
          onPropellantProcessChange={onPropellantProcessChange}
          onWeightmentWeighscaleNoChange={onWeightmentWeighscaleNoChange}
          onWeightmentCalibrationDueDateChange={onWeightmentCalibrationDueDateChange}
          theme={flowBarTheme}
        />
      ) : null}

      {partialNavActive ? (
        <QCPartialItemNavigation
          items={partialNavItems}
          activeIndex={activePartialNavIndex}
          onActiveIndexChange={onPartialNavIndexChange ?? (() => undefined)}
          loading={schemaLoading}
          isTabEnabled={isPartialNavTabEnabled}
          getTabDisabledReason={getPartialNavTabDisabledReason}
        />
      ) : null}

      <Box
        sx={{
          position: "relative",
          ...(schemaLoading ? { pointerEvents: "none", userSelect: "none", minHeight: 160 } : null),
        }}
      >
        {schemaLoading ? <QCSchemaBufferingLoader overlay /> : null}
        <QCDivisionFormBody
          batch={batch}
          divisionAutoPopulateData={divisionAutoPopulateData}
          mixingQualityChecksByStage={mixingQualityChecksByStage}
          formData={bodyFormData}
          subDepartmentId={subDepartmentId}
          activeDivisionGroupIndex={activeDivisionGroupIndex}
          activeDivisionSubIndex={activeDivisionSubIndex}
          readOnly={readOnly || fieldsReadOnly}
          schemaLoading={schemaLoading}
          schemaError={schemaError}
          hideEntryGroupNav
          onActiveDivisionGroupIndexChange={onActiveDivisionGroupIndexChange}
          onActiveDivisionSubIndexChange={onActiveDivisionSubIndexChange}
          onDivisionEntryValuesChange={onDivisionEntryValuesChange}
          onDivisionEntryLiquidValuesChange={onDivisionEntryLiquidValuesChange}
          onMixingFinalMixDetailsChange={onMixingFinalMixDetailsChange}
          onRemoveDivisionEntry={onRemoveDivisionEntry}
          unitActions={unitActions}
          theme={theme}
        />
      </Box>
    </Box>
  );
};

export default QCForm;
