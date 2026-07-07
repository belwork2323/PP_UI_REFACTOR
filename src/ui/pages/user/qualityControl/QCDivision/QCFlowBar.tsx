import CasePrepSelect from "../../manufacturing/CasePreparation/CasePrepSelect";
import {
  QC_DIVISION_OPTIONS,
  QC_FLOW_LABELS,
  QC_PROCESSING_TYPE_OPTIONS,
  QC_RAW_MATERIAL_TYPE_OPTIONS,
} from "../../../../../hooks/user/qualityControl/qcFlowConfig";
import {
  canLoadDivisionSchema,
  getQcDivisionPanelType,
  isCastingDivisionFlow,
  isCuringDivisionFlow,
  isDeCoringDivisionFlow,
  isHardwareDivisionFlow,
  isMixingDivisionFlow,
  isNdtDivisionFlow,
  isPostCureDivisionFlow,
  isPropellantDivisionFlow,
  isTrimmingDivisionFlow,
  isWeightmentDivisionFlow,
  STF_MOTOR_TYPE_SELECT_OPTIONS,
} from "../../../../../hooks/user/qualityControl/qcDivisionRegistry";
import { QC_CURING_TYPE_OPTIONS } from "../../../../../hooks/user/qualityControl/qcCuringConfig";
import {
  QC_HARDWARE_PROCESS_OPTIONS,
  resolveQcMotorIdOptions,
} from "../../../../../hooks/user/qualityControl/qcHardwareConfig";
import {
  QC_MIXING_NUMBER_OPTIONS,
  QC_MIXING_STAGE_OPTIONS,
  getQcMixingNumberLabel,
  isQcMixingStage,
  type QcMixingStage,
} from "../../../../../hooks/user/qualityControl/qcMixingConfig";
import {
  QC_PROCESSING_PREMIX_OPTIONS,
  getQcPremixLabel,
  isPremixProcessingFlow,
  isRawMaterialProcessingType,
} from "../../../../../hooks/user/qualityControl/qcProcessingConfig";
import { resolveQcTrimmingMotorCountOptions } from "../../../../../hooks/user/qualityControl/qcTrimmingConfig";
import {
  QC_INHIBITOR_TYPE_OPTIONS,
  QC_POST_CURE_OPERATION_OPTIONS,
  isQcPostCureInhibitionOperation,
  resolveQcPostCureSchemaSelection,
} from "../../../../../hooks/user/qualityControl/qcPostCureConfig";
import {
  QC_PROPELLANT_PROCESS_OPTIONS,
  mapQcPropellantProcessToApi,
} from "../../../../../hooks/user/qualityControl/qcPropellantConfig";
import { STF_FLOW_LABELS } from "../../../../../hooks/user/qualityControl/stfFlowConfig";
import { STRINGS } from "../../../../../app/config/strings";
import { Box, Button, CircularProgress } from "@mui/material";
import CasePrepMultiSelect from "../../manufacturing/CasePreparation/CasePrepMultiSelect";
import CasePrepDateField from "../../manufacturing/CasePreparation/CasePrepDateField";
import CasePrepTextField from "../../manufacturing/CasePreparation/CasePrepTextField";
import { buildDivisionEntryDedupKey } from "../../../../../hooks/user/qualityControl/qcDivisionEntries";
import type { QcApiSubType } from "../../../../../schema-engine/adapters/qc.adapter";

const S = STRINGS.QUALITY_CONTROL.QC_DIVISION;

type QCFlowBarProps = {
  batch?: { batchId?: string; motorId?: string; motorIds?: string[] } | null;
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
  hasDivisionEntries: boolean;
  schemaLoading?: boolean;
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
  theme: any;
};

const QCFlowBar = ({
  batch,
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
  hasDivisionEntries,
  schemaLoading = false,
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
  theme,
}: QCFlowBarProps) => {
  const flowBar = theme.manufacturing?.casePreparation?.flowBar ?? {};
  const L = QC_FLOW_LABELS;
  const panelType = getQcDivisionPanelType(selectedDivision);
  const showRawMaterialType = panelType === "RAW_MATERIAL";
  const showProcessingType = showRawMaterialType && isRawMaterialProcessingType(selectedRawMaterialType);
  const isRawMaterialPremixFlow = isPremixProcessingFlow(selectedRawMaterialType, selectedProcessingType);
  const isMixingFlow = isMixingDivisionFlow(selectedDivision);
  const isHardwareFlow = isHardwareDivisionFlow(selectedDivision);
  const isCastingFlow = isCastingDivisionFlow(selectedDivision);
  const isCuringFlow = isCuringDivisionFlow(selectedDivision);
  const isTrimmingFlow = isTrimmingDivisionFlow(selectedDivision);
  const isDeCoringFlow = isDeCoringDivisionFlow(selectedDivision);
  const isPostCureFlow = isPostCureDivisionFlow(selectedDivision);
  const isNdtFlow = isNdtDivisionFlow(selectedDivision);
  const isPropellantFlow = isPropellantDivisionFlow(selectedDivision);
  const isWeightmentFlow = isWeightmentDivisionFlow(selectedDivision);
  const showMixingStage = isMixingFlow;
  const showMixingNumber = isMixingFlow && isQcMixingStage(selectedMixingStage);
  const showPremixSelect = isRawMaterialPremixFlow;
  const showStfMotorType = panelType === "STF";
  const showMotorIdSelect =
    isHardwareFlow ||
    isCastingFlow ||
    isCuringFlow ||
    isDeCoringFlow ||
    isNdtFlow ||
    isPropellantFlow ||
    isWeightmentFlow ||
    isTrimmingFlow;
  const showPropellantProcess = isPropellantFlow && Boolean(selectedMotorId);
  const showWeightmentWeighscale = isWeightmentFlow && Boolean(selectedMotorId);
  const showWeightmentCalibrationDate = isWeightmentFlow && Boolean(selectedMotorId);
  const showHardwareProcesses = isHardwareFlow && Boolean(selectedMotorId);
  const showCuringType = isCuringFlow;
  const showPostCureOperation = isPostCureFlow;
  const showInhibitorType =
    isPostCureFlow && isQcPostCureInhibitionOperation(selectedPostCureOperation);
  const showPostCureMotorId =
    isPostCureFlow &&
    Boolean(selectedPostCureOperation) &&
    (!showInhibitorType || Boolean(selectedInhibitorType));
  const showTrimmingMotorCount = isTrimmingFlow;
  const showTrimmingMotorId = isTrimmingFlow && selectedTrimmingMotorCount !== "";
  const showTrimmingReceivedDate = isTrimmingFlow && Boolean(selectedMotorId);
  const trimmingMotorCountOptions = resolveQcTrimmingMotorCountOptions(batch);
  const mixingStage = isQcMixingStage(selectedMixingStage) ? selectedMixingStage : null;
  const propellantProcessOptions = QC_PROPELLANT_PROCESS_OPTIONS.map((option) => ({
    ...option,
    disabled:
      Boolean(selectedMotorId) &&
      addedDivisionEntryKeys.includes(
        buildDivisionEntryDedupKey({
          flowKey: selectedDivision,
          kind: "PROPELLANT_PROCESS",
          motorId: selectedMotorId,
          subType: mapQcPropellantProcessToApi(option.value) ?? undefined,
        }),
      ),
  }));
  const motorIdOptions = resolveQcMotorIdOptions(batch).map((option) => ({
    ...option,
    disabled: isPropellantFlow || isWeightmentFlow
      ? false
      : (isCastingFlow &&
          addedDivisionEntryKeys.includes(
            buildDivisionEntryDedupKey({
              flowKey: selectedDivision,
              kind: "CASTING_MOTOR",
              motorId: option.value,
            }),
          )) ||
        (isCuringFlow &&
          addedDivisionEntryKeys.includes(
            buildDivisionEntryDedupKey({
              flowKey: selectedDivision,
              kind: "CURING_MOTOR",
              motorId: option.value,
            }),
          )) ||
        (isTrimmingFlow &&
          addedDivisionEntryKeys.includes(
            buildDivisionEntryDedupKey({
              flowKey: selectedDivision,
              kind: "TRIMMING_MOTOR",
              motorId: option.value,
            }),
          )) ||
        (isDeCoringFlow &&
          addedDivisionEntryKeys.includes(
            buildDivisionEntryDedupKey({
              flowKey: selectedDivision,
              kind: "DE_CORING_MOTOR",
              motorId: option.value,
            }),
          )) ||
        (isNdtFlow &&
          addedDivisionEntryKeys.includes(
            buildDivisionEntryDedupKey({
              flowKey: selectedDivision,
              kind: "NDT_MOTOR",
              motorId: option.value,
            }),
          )) ||
        (isWeightmentFlow &&
          addedDivisionEntryKeys.includes(
            buildDivisionEntryDedupKey({
              flowKey: selectedDivision,
              kind: "WEIGHTMENT_MOTOR",
              motorId: option.value,
            }),
          )) ||
        (isPostCureFlow &&
          (() => {
            const selection = resolveQcPostCureSchemaSelection(
              selectedPostCureOperation,
              selectedInhibitorType,
            );
            return (
              selection &&
              addedDivisionEntryKeys.includes(
                buildDivisionEntryDedupKey({
                  flowKey: selectedDivision,
                  kind: "POST_CURE_MOTOR",
                  motorId: option.value,
                  subType: selection.subType,
                  inhibitorType: selection.inhibitorType,
                }),
              )
            );
          })()),
  }));
  const hardwareProcessOptions = QC_HARDWARE_PROCESS_OPTIONS.map((option) => ({
    ...option,
    disabled:
      Boolean(selectedMotorId) &&
      addedDivisionEntryKeys.includes(
        buildDivisionEntryDedupKey({
          flowKey: selectedDivision,
          kind: "HARDWARE_PROCESS",
          motorId: selectedMotorId,
          subType: option.value as QcApiSubType,
        }),
      ),
  }));

  const flowState = {
    rawMaterialType: selectedRawMaterialType,
    processingType: selectedProcessingType,
    mixingStage: selectedMixingStage,
    selectedPremix,
    addedPremixNumbers,
    stfMotorType: selectedStfMotorType,
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
    addedDivisionEntryKeys,
  };

  const canLoad = canLoadDivisionSchema(selectedDivision, flowState);

  const availablePremixOptions = QC_PROCESSING_PREMIX_OPTIONS.filter(
    (premixNo) => !addedPremixNumbers.includes(premixNo),
  );
  const availableMixingNumberOptions = QC_MIXING_NUMBER_OPTIONS.filter(
    (number) => !addedPremixNumbers.includes(number),
  );

  const showLoadAction =
    Boolean(selectedDivision) &&
    (panelType === "SIMPLE" ||
      panelType === "STF" ||
      isMixingFlow ||
      isHardwareFlow ||
      isCastingFlow ||
      isCuringFlow ||
      isTrimmingFlow ||
      isDeCoringFlow ||
      isNdtFlow ||
      isPropellantFlow ||
      isWeightmentFlow ||
      isPostCureFlow ||
      (showRawMaterialType &&
        selectedRawMaterialType &&
        (!showProcessingType || selectedProcessingType)));

  const isPremixAction = isRawMaterialPremixFlow || isMixingFlow;
  const isHardwareAction = isHardwareFlow;
  const numberAlreadyAdded =
    selectedPremix !== "" && addedPremixNumbers.includes(Number(selectedPremix));
  const loadDisabled = !canLoad || schemaLoading || (isPremixAction && numberAlreadyAdded);
  const loadLabel = hasDivisionEntries
    ? isPremixAction
      ? S.ADD_PREMIX_LABEL
      : isHardwareAction
        ? S.ADD_DIVISION_LABEL
        : S.ADD_DIVISION_LABEL
    : schemaLoading
      ? L.loadingSchema
      : isPremixAction
        ? S.ADD_PREMIX_LABEL
        : L.loadForm;

  return (
    <Box sx={flowBar.container}>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Box sx={{ ...flowBar.topRow, alignItems: "flex-end", flexWrap: "wrap" }}>
          <CasePrepSelect
            label={L.division}
            value={selectedDivision}
            placeholder={L.divisionPlaceholder}
            options={QC_DIVISION_OPTIONS.map((option) => ({
              value: option.value,
              label: option.label,
            }))}
            width={240}
            theme={theme}
            onChange={onDivisionChange}
          />

          {showRawMaterialType ? (
            <CasePrepSelect
              label={L.rawMaterialType}
              value={selectedRawMaterialType}
              placeholder={L.rawMaterialTypePlaceholder}
              options={QC_RAW_MATERIAL_TYPE_OPTIONS.map((option) => ({
                value: option.value,
                label: option.label,
              }))}
              width={280}
              theme={theme}
              onChange={onRawMaterialTypeChange}
            />
          ) : null}

          {showProcessingType ? (
            <CasePrepSelect
              label={L.processingType}
              value={selectedProcessingType}
              placeholder={L.processingTypePlaceholder}
              options={QC_PROCESSING_TYPE_OPTIONS.map((option) => ({
                value: option.value,
                label: option.label,
              }))}
              width={240}
              theme={theme}
              onChange={onProcessingTypeChange}
            />
          ) : null}

          {showPremixSelect ? (
            <CasePrepSelect
              label={S.PREMIX_LABEL}
              value={selectedPremix === "" ? "" : String(selectedPremix)}
              placeholder={S.PREMIX_PLACEHOLDER}
              options={availablePremixOptions.map((premixNo) => ({
                value: String(premixNo),
                label: getQcPremixLabel(premixNo),
              }))}
              width={260}
              theme={theme}
              onChange={(value) => onPremixChange(value === "" ? "" : Number(value))}
            />
          ) : null}

          {showMixingStage ? (
            <CasePrepSelect
              label={S.MIXING_STAGE_LABEL}
              value={selectedMixingStage}
              placeholder={S.MIXING_STAGE_PLACEHOLDER}
              options={QC_MIXING_STAGE_OPTIONS.map((option) => ({
                value: option.value,
                label: option.label,
              }))}
              width={220}
              theme={theme}
              onChange={onMixingStageChange}
            />
          ) : null}

          {showMixingNumber && mixingStage ? (
            <CasePrepSelect
              label={
                mixingStage === "FINAL_MIX"
                  ? S.MIXING_FINAL_MIX_NUMBER_FIELD_LABEL
                  : S.MIXING_NUMBER_LABEL
              }
              value={selectedPremix === "" ? "" : String(selectedPremix)}
              placeholder={S.MIXING_NUMBER_PLACEHOLDER}
              options={availableMixingNumberOptions.map((number) => ({
                value: String(number),
                label: getQcMixingNumberLabel(mixingStage, number),
              }))}
              width={260}
              theme={theme}
              onChange={(value) => onPremixChange(value === "" ? "" : Number(value))}
            />
          ) : null}

          {showStfMotorType ? (
            <CasePrepSelect
              label={STF_FLOW_LABELS.motorType}
              value={selectedStfMotorType}
              placeholder={STF_FLOW_LABELS.motorTypePlaceholder}
              options={STF_MOTOR_TYPE_SELECT_OPTIONS.map((option) => ({
                value: option.value,
                label: option.label,
              }))}
              width={240}
              theme={theme}
              onChange={onStfMotorTypeChange}
            />
          ) : null}

          {showTrimmingMotorCount ? (
            <CasePrepSelect
              label={S.TRIMMING_MOTOR_COUNT_LABEL}
              value={selectedTrimmingMotorCount === "" ? "" : String(selectedTrimmingMotorCount)}
              placeholder={S.TRIMMING_MOTOR_COUNT_PLACEHOLDER}
              options={trimmingMotorCountOptions}
              width={220}
              theme={theme}
              onChange={(value) =>
                onTrimmingMotorCountChange(value === "" ? "" : Number(value))
              }
            />
          ) : null}

          {showTrimmingMotorId ? (
            <CasePrepSelect
              label={S.TRIMMING_MOTOR_ID_LABEL}
              value={selectedMotorId}
              placeholder={S.TRIMMING_MOTOR_ID_PLACEHOLDER}
              options={motorIdOptions}
              width={260}
              theme={theme}
              onChange={onMotorIdChange}
            />
          ) : null}

          {showTrimmingReceivedDate ? (
            <CasePrepDateField
              label={S.TRIMMING_MOTOR_RECEIVED_DATE_LABEL}
              value={trimmingMotorReceivedDate}
              placeholder={S.TRIMMING_MOTOR_RECEIVED_DATE_PLACEHOLDER}
              theme={theme}
              onChange={onTrimmingMotorReceivedDateChange}
            />
          ) : null}

          {showPostCureOperation ? (
            <CasePrepSelect
              label={S.POST_CURE_OPERATION_LABEL}
              value={selectedPostCureOperation}
              placeholder={S.POST_CURE_OPERATION_PLACEHOLDER}
              options={QC_POST_CURE_OPERATION_OPTIONS}
              width={260}
              theme={theme}
              onChange={onPostCureOperationChange}
            />
          ) : null}

          {showInhibitorType ? (
            <CasePrepSelect
              label={S.INHIBITOR_TYPE_LABEL}
              value={selectedInhibitorType}
              placeholder={S.INHIBITOR_TYPE_PLACEHOLDER}
              options={QC_INHIBITOR_TYPE_OPTIONS}
              width={260}
              theme={theme}
              onChange={onInhibitorTypeChange}
            />
          ) : null}

          {showPostCureMotorId ? (
            <CasePrepSelect
              label={S.CASTING_MOTOR_ID_LABEL}
              value={selectedMotorId}
              placeholder={S.CASTING_MOTOR_ID_PLACEHOLDER}
              options={motorIdOptions}
              width={260}
              theme={theme}
              onChange={onMotorIdChange}
            />
          ) : null}

          {showMotorIdSelect && !isTrimmingFlow ? (
            <CasePrepSelect
              label={
                isCuringFlow
                  ? S.CURING_MOTOR_ID_LABEL
                  : isCastingFlow
                    ? S.CASTING_MOTOR_ID_LABEL
                    : isDeCoringFlow
                      ? S.DE_CORING_MOTOR_ID_LABEL
                      : isNdtFlow
                        ? S.NDT_MOTOR_ID_LABEL
                        : isWeightmentFlow
                          ? S.HARDWARE_MOTOR_ID_LABEL
                          : isPropellantFlow
                            ? S.HARDWARE_MOTOR_ID_LABEL
                            : S.HARDWARE_MOTOR_ID_LABEL
              }
              value={selectedMotorId}
              placeholder={
                isCuringFlow
                  ? S.CURING_MOTOR_ID_PLACEHOLDER
                  : isCastingFlow
                    ? S.CASTING_MOTOR_ID_PLACEHOLDER
                    : isDeCoringFlow
                      ? S.DE_CORING_MOTOR_ID_PLACEHOLDER
                      : isNdtFlow
                        ? S.NDT_MOTOR_ID_PLACEHOLDER
                        : isWeightmentFlow
                          ? S.HARDWARE_MOTOR_ID_PLACEHOLDER
                          : isPropellantFlow
                            ? S.HARDWARE_MOTOR_ID_PLACEHOLDER
                            : S.HARDWARE_MOTOR_ID_PLACEHOLDER
              }
              options={motorIdOptions}
              width={260}
              theme={theme}
              onChange={onMotorIdChange}
            />
          ) : null}

          {showCuringType ? (
            <CasePrepSelect
              label={S.CURING_TYPE_LABEL}
              value={selectedCuringType}
              placeholder={S.CURING_TYPE_PLACEHOLDER}
              options={QC_CURING_TYPE_OPTIONS.map((option) => ({
                value: option.value,
                label: option.label,
              }))}
              width={260}
              theme={theme}
              onChange={onCuringTypeChange}
            />
          ) : null}

          {showWeightmentWeighscale ? (
            <CasePrepTextField
              label={S.WEIGHTMENT_WEIGHSCALE_NO_LABEL}
              value={weightmentWeighscaleNo}
              placeholder={S.WEIGHTMENT_WEIGHSCALE_NO_PLACEHOLDER}
              width={260}
              theme={theme}
              onChange={onWeightmentWeighscaleNoChange}
            />
          ) : null}

          {showWeightmentCalibrationDate ? (
            <CasePrepDateField
              label={S.WEIGHTMENT_CALIBRATION_DUE_DATE_LABEL}
              value={weightmentCalibrationDueDate}
              placeholder={S.WEIGHTMENT_CALIBRATION_DUE_DATE_PLACEHOLDER}
              theme={theme}
              onChange={onWeightmentCalibrationDueDateChange}
            />
          ) : null}

          {showPropellantProcess ? (
            <CasePrepSelect
              label={S.PROPELLANT_PROCESS_LABEL}
              value={selectedPropellantProcess}
              placeholder={S.PROPELLANT_PROCESS_PLACEHOLDER}
              options={propellantProcessOptions}
              width={320}
              theme={theme}
              onChange={onPropellantProcessChange}
            />
          ) : null}

          {showHardwareProcesses ? (
            <CasePrepMultiSelect
              label={S.HARDWARE_PROCESS_LABEL}
              value={selectedHardwareProcesses}
              placeholder={S.HARDWARE_PROCESS_PLACEHOLDER}
              options={hardwareProcessOptions}
              width={320}
              theme={theme}
              onChange={onHardwareProcessesChange}
            />
          ) : null}
        </Box>

        {showLoadAction ? (
          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <Button
              variant="contained"
              size="small"
              disabled={loadDisabled}
              onClick={onLoadForm}
              startIcon={schemaLoading ? <CircularProgress size={14} color="inherit" /> : undefined}
            >
              {schemaLoading ? L.loadingSchema : loadLabel}
            </Button>
          </Box>
        ) : null}
      </Box>
    </Box>
  );
};

export default QCFlowBar;
