import CasePrepSelect from "../../manufacturing/CasePreparation/CasePrepSelect";
import {
  QC_FLOW_LABELS,
  QC_PROCESSING_TYPE_OPTIONS,
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
  isWeighmentDivisionFlow,
  STF_MOTOR_TYPE_SELECT_OPTIONS,
} from "../../../../../hooks/user/qualityControl/qcDivisionRegistry";
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
  QC_POST_CURE_OPERATION_OPTIONS,
  QC_INHIBITOR_TYPE_OPTIONS,
  isQcPostCureInhibitionOperation,
} from "../../../../../hooks/user/qualityControl/qcPostCureConfig";
import { STF_FLOW_LABELS } from "../../../../../hooks/user/qualityControl/stfFlowConfig";
import { STRINGS } from "../../../../../app/config/strings";
import { Box, Button, CircularProgress, Typography } from "@mui/material";
import CasePrepMultiSelect from "../../manufacturing/CasePreparation/CasePrepMultiSelect";
import CasePrepDateField from "../../manufacturing/CasePreparation/CasePrepDateField";
import { DateTimeField } from "../../../../components/common/DateField";
import { buildDivisionEntryDedupKey } from "../../../../../hooks/user/qualityControl/qcDivisionEntries";
import type { QcApiSubType } from "../../../../../schema-engine/adapters/qc.adapter";
import {
  QC_PROPELLANT_PROCESS_OPTIONS,
  mapQcPropellantProcessToApi,
} from "../../../../../hooks/user/qualityControl/qcPropellantConfig";

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
  selectedTrimmingMotorCount: number | "";
  trimmingMotorReceivedDate: string;
  postCureMotorReceiptDate: string;
  selectedPostCureOperation: string;
  selectedInhibitorType: string;
  selectedPropellantProcess: string;
  addedPremixNumbers: number[];
  addedDivisionEntryKeys: string[];
  hasDivisionEntries: boolean;
  schemaLoading?: boolean;
  /** When division-details seeded motor/premix nav, hide redundant pickers for auto-loaded flows. */
  partialNavActive?: boolean;
  /** Hide the Load Form button (e.g. when setup panel provides its own load action). */
  hideLoadAction?: boolean;
  /** Show Post Cure operation / inhibitor / receipt pickers (subscale qualification setup). */
  postCureSetupMode?: boolean;
  onProcessingTypeChange: (value: string) => void;
  onPremixChange: (value: number | "") => void;
  onMixingStageChange: (value: string) => void;
  onStfMotorTypeChange: (value: string) => void;
  onMotorIdChange: (value: string) => void;
  onHardwareProcessesChange: (values: string[]) => void;
  onTrimmingMotorCountChange: (value: number | "") => void;
  onTrimmingMotorReceivedDateChange: (value: string) => void;
  onPostCureMotorReceiptDateChange: (value: string) => void;
  onPostCureOperationChange: (value: string) => void;
  onInhibitorTypeChange: (value: string) => void;
  onPropellantProcessChange: (value: string) => void;
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
  selectedTrimmingMotorCount,
  trimmingMotorReceivedDate,
  postCureMotorReceiptDate,
  selectedPostCureOperation,
  selectedInhibitorType,
  selectedPropellantProcess,
  addedPremixNumbers,
  addedDivisionEntryKeys,
  hasDivisionEntries,
  schemaLoading = false,
  partialNavActive = false,
  hideLoadAction = false,
  postCureSetupMode = false,
  onProcessingTypeChange,
  onPremixChange,
  onMixingStageChange,
  onStfMotorTypeChange,
  onMotorIdChange,
  onHardwareProcessesChange,
  onTrimmingMotorCountChange,
  onTrimmingMotorReceivedDateChange,
  onPostCureMotorReceiptDateChange,
  onPostCureOperationChange,
  onInhibitorTypeChange,
  onPropellantProcessChange,
  onLoadForm,
  theme,
}: QCFlowBarProps) => {
  const flowBar = theme.manufacturing?.casePreparation?.flowBar ?? {};
  const L = QC_FLOW_LABELS;
  const panelType = getQcDivisionPanelType(selectedDivision);
  const showRawMaterialType = panelType === "RAW_MATERIAL";
  const hideRawMaterialProcessingPickers =
    isRawMaterialProcessingType(selectedRawMaterialType) && partialNavActive;
  const showProcessingType =
    showRawMaterialType &&
    isRawMaterialProcessingType(selectedRawMaterialType) &&
    !hideRawMaterialProcessingPickers;
  const isRawMaterialPremixFlow =
    isPremixProcessingFlow(selectedRawMaterialType, selectedProcessingType) &&
    !hideRawMaterialProcessingPickers;
  const isMixingFlow = isMixingDivisionFlow(selectedDivision);
  const isHardwareFlow = isHardwareDivisionFlow(selectedDivision);
  const isCastingFlow = isCastingDivisionFlow(selectedDivision);
  const isCuringFlow = isCuringDivisionFlow(selectedDivision);
  const isTrimmingFlow = isTrimmingDivisionFlow(selectedDivision);
  const isDeCoringFlow = isDeCoringDivisionFlow(selectedDivision);
  const isPostCureFlow = isPostCureDivisionFlow(selectedDivision);
  const isNdtFlow = isNdtDivisionFlow(selectedDivision);
  const isPropellantFlow = isPropellantDivisionFlow(selectedDivision);
  const isWeightmentFlow = isWeighmentDivisionFlow(selectedDivision);
  const autoSeededPartialFlow =
    hideRawMaterialProcessingPickers ||
    (partialNavActive &&
      (isCastingFlow ||
        isCuringFlow ||
        isDeCoringFlow ||
        isTrimmingFlow ||
        isPostCureFlow ||
        isNdtFlow ||
        isPropellantFlow ||
        isWeightmentFlow ||
        isMixingFlow ||
        isHardwareFlow ||
        isRawMaterialPremixFlow));
  const showMixingStage = isMixingFlow && !autoSeededPartialFlow;
  const showMixingNumber =
    isMixingFlow && isQcMixingStage(selectedMixingStage) && !autoSeededPartialFlow;
  const showPremixSelect = isRawMaterialPremixFlow && !autoSeededPartialFlow;
  const showStfMotorType = panelType === "STF";
  const showMotorIdSelect = false;
  const showPropellantProcess = false;
  const showHardwareProcesses = false;
  const showPostCureOperation = postCureSetupMode && isPostCureFlow;
  const showInhibitorType =
    postCureSetupMode &&
    isPostCureFlow &&
    isQcPostCureInhibitionOperation(selectedPostCureOperation);
  const showPostCureMotorReceipt = postCureSetupMode && isPostCureFlow;
  const showPostCureMotorId = false;
  const showTrimmingMotorCount = false;
  const showTrimmingMotorId = false;
  const showTrimmingReceivedDate = false;
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
  const isMotorAlreadyAdded = (motorId: string): boolean =>
    (isCastingFlow &&
      addedDivisionEntryKeys.includes(
        buildDivisionEntryDedupKey({
          flowKey: selectedDivision,
          kind: "CASTING_MOTOR",
          motorId,
        }),
      )) ||
    (isCuringFlow && addedDivisionEntryKeys.some((key) => key.startsWith(`CURING:${motorId}:`))) ||
    (isTrimmingFlow &&
      addedDivisionEntryKeys.includes(
        buildDivisionEntryDedupKey({
          flowKey: selectedDivision,
          kind: "TRIMMING_MOTOR",
          motorId,
        }),
      )) ||
    (isDeCoringFlow &&
      addedDivisionEntryKeys.includes(
        buildDivisionEntryDedupKey({
          flowKey: selectedDivision,
          kind: "DE_CORING_MOTOR",
          motorId,
        }),
      )) ||
    (isNdtFlow &&
      addedDivisionEntryKeys.includes(
        buildDivisionEntryDedupKey({
          flowKey: selectedDivision,
          kind: "NDT_MOTOR",
          motorId,
        }),
      )) ||
    (isWeightmentFlow &&
      addedDivisionEntryKeys.includes(
        buildDivisionEntryDedupKey({
          flowKey: selectedDivision,
          kind: "WEIGHTMENT_MOTOR",
          motorId,
        }),
      )) ||
    (isPostCureFlow &&
      addedDivisionEntryKeys.some((key) => key.startsWith(`POST_CURE:${motorId}:`)));

  const motorIdOptions = resolveQcMotorIdOptions(batch).map((option) => ({
    ...option,
    disabled: isPropellantFlow ? false : isMotorAlreadyAdded(option.value),
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

  const availablePremixOptions = QC_PROCESSING_PREMIX_OPTIONS.filter(
    (premixNo) => !addedPremixNumbers.includes(premixNo),
  );
  const availableMixingNumberOptions = QC_MIXING_NUMBER_OPTIONS.filter(
    (number) => !addedPremixNumbers.includes(number),
  );

  const flowState = {
    rawMaterialType: selectedRawMaterialType,
    processingType: selectedProcessingType,
    selectedPremix,
    mixingStage: selectedMixingStage as QcMixingStage | "",
    addedPremixNumbers,
    stfMotorType: selectedStfMotorType,
    selectedMotorId,
    selectedHardwareProcesses,
    selectedTrimmingMotorCount,
    trimmingMotorReceivedDate,
    postCureMotorReceiptDate,
    selectedPostCureOperation,
    selectedInhibitorType,
    selectedPropellantProcess,
    addedDivisionEntryKeys,
  };

  const canLoad = canLoadDivisionSchema(selectedDivision, flowState);

  const isPremixAction = isRawMaterialPremixFlow || isMixingFlow;

  const showLoadAction =
    !hideLoadAction &&
    !autoSeededPartialFlow &&
    Boolean(selectedDivision) &&
    !(hasDivisionEntries && !isPremixAction) &&
    (panelType === "SIMPLE" ||
      panelType === "STF" ||
      isMixingFlow ||
      (showRawMaterialType &&
        selectedRawMaterialType &&
        (!showProcessingType || selectedProcessingType)));

  const numberAlreadyAdded =
    selectedPremix !== "" && addedPremixNumbers.includes(Number(selectedPremix));
  const loadDisabled = !canLoad || schemaLoading || (isPremixAction && numberAlreadyAdded);
  const loadLabel = schemaLoading
    ? L.loadingSchema
    : isPremixAction
      ? S.ADD_PREMIX_LABEL
      : L.loadForm;

  const hasVisiblePickers =
    showProcessingType ||
    showPremixSelect ||
    showMixingStage ||
    showMixingNumber ||
    showStfMotorType ||
    showTrimmingMotorCount ||
    showTrimmingMotorId ||
    showTrimmingReceivedDate ||
    showPostCureMotorReceipt ||
    showPostCureOperation ||
    showPostCureMotorId ||
    (showMotorIdSelect && !isTrimmingFlow) ||
    showPropellantProcess ||
    showHardwareProcesses ||
    showInhibitorType ||
    showLoadAction;

  if (!hasVisiblePickers) return null;

  return (
    <Box sx={flowBar.container}>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Box sx={{ ...flowBar.topRow, alignItems: "flex-end", flexWrap: "wrap" }}>
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
              onChange={(value) => onTrimmingMotorCountChange(value === "" ? "" : Number(value))}
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

          {showPostCureMotorReceipt ? (
            <Box sx={flowBar.selectField?.(280)}>
              <Typography component="label" sx={flowBar.selectLabel}>
                {S.POST_CURE_MOTOR_RECEIPT_DATE_LABEL}
              </Typography>
              <DateTimeField
                value={postCureMotorReceiptDate}
                onChange={onPostCureMotorReceiptDateChange}
                placeholder={S.POST_CURE_MOTOR_RECEIPT_DATE_PLACEHOLDER}
                compact
                sx={flowBar.selectInput?.(Boolean(postCureMotorReceiptDate))}
              />
            </Box>
          ) : null}

          {showPostCureOperation ? (
            <CasePrepSelect
              label={S.POST_CURE_OPERATION_LABEL}
              value={selectedPostCureOperation}
              placeholder={S.POST_CURE_OPERATION_PLACEHOLDER}
              options={QC_POST_CURE_OPERATION_OPTIONS}
              width={240}
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
              width={240}
              theme={theme}
              onChange={onInhibitorTypeChange}
            />
          ) : null}

          {showMotorIdSelect && !isTrimmingFlow ? (
            <CasePrepSelect
              label={isNdtFlow ? S.NDT_MOTOR_ID_LABEL : S.HARDWARE_MOTOR_ID_LABEL}
              value={selectedMotorId}
              placeholder={isNdtFlow ? S.NDT_MOTOR_ID_PLACEHOLDER : S.HARDWARE_MOTOR_ID_PLACEHOLDER}
              options={motorIdOptions}
              width={260}
              theme={theme}
              onChange={onMotorIdChange}
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
