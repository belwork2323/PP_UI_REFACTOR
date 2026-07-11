import { Box, Button, CircularProgress, Typography } from "@mui/material";
import CasePrepSelect from "../manufacturing/CasePreparation/CasePrepSelect";
import CasePrepDateField from "../manufacturing/CasePreparation/CasePrepDateField";
import CasePrepTextField from "../manufacturing/CasePreparation/CasePrepTextField";
import {
  DISPATCH_FLOW_LABELS,
  DISPATCH_STAGE_OPTIONS,
  DISPATCH_YES_NO_OPTIONS,
  canAddDispatchMotor,
  canLoadDispatchMotor,
  dispatchMotorStagesMatch,
  type DispatchAddedMotor,
  type DispatchMotorOption,
} from "../../../../hooks/user/dispatch/dispatchFlowConfig";
import type { DispatchFormState } from "../../../../data/models/user/DispatchFormModel";
import type getDispatchTheme from "../../../../app/theme/custom_themes/user/dispatch/dispatch_theme";

type DispatchFlowBarProps = {
  batchId?: string;
  formData: DispatchFormState;
  draftMotorId: string;
  addedMotors: DispatchAddedMotor[];
  availableMotors?: DispatchMotorOption[];
  schemaLoading?: boolean;
  onSetupChange: (field: string, value: string) => void;
  onDraftMotorIdChange: (value: string) => void;
  onLoadForm: () => void;
  onAddMotor: () => void;
  theme: any;
  dispatchTheme: ReturnType<typeof getDispatchTheme>;
};

const DispatchFlowBar = ({
  formData,
  draftMotorId,
  addedMotors,
  availableMotors = [],
  schemaLoading = false,
  onSetupChange,
  onDraftMotorIdChange,
  onLoadForm,
  onAddMotor,
  theme,
  dispatchTheme,
}: DispatchFlowBarProps) => {
  const flowBar = dispatchTheme.flowBar;
  const casePrepFlowBar = theme.manufacturing?.casePreparation?.flowBar ?? {};
  const L = DISPATCH_FLOW_LABELS;
  const usedMotorIds = addedMotors.map((motor) => motor.motorId);
  const hasMotors = addedMotors.length > 0;
  const sharedSetup = {
    motorStage: formData.motorStage,
    castingDate: formData.castingDate,
    dispatchDate: formData.dispatchDate,
    dispatchLocation: formData.dispatchLocation,
    ndtClearance: formData.ndtClearance,
    ndtMomNo: formData.ndtMomNo,
    finalAcceptanceClearance: formData.finalAcceptanceClearance,
    finalAcceptanceMomNo: formData.finalAcceptanceMomNo,
  };

  const motorOptions = availableMotors
    .filter((motor) => dispatchMotorStagesMatch(motor.motorStage, formData.motorStage))
    .map((motor) => ({
      value: motor.motorId,
      label: motor.motorId,
      disabled: motor.motorId !== draftMotorId && usedMotorIds.includes(motor.motorId),
    }));

  const canLoad = canLoadDispatchMotor({
    setup: sharedSetup,
    draftMotorId,
    usedMotorIds,
    hasMotors,
  });
  const canAdd = canAddDispatchMotor({
    setup: sharedSetup,
    draftMotorId,
    usedMotorIds,
    hasMotors,
  });
  const showLoad = canLoad;
  const showAdd = !canLoad && canAdd;
  const setupHint = hasMotors ? L.setupHintLoaded : L.setupHint;
  const selectTheme = {
    ...theme,
    manufacturing: theme.manufacturing ?? { casePreparation: { flowBar: casePrepFlowBar } },
  };

  return (
    <Box sx={flowBar.container}>
      {setupHint ? <Typography sx={flowBar.setupHint}>{setupHint}</Typography> : null}

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2.25 }}>
        <Box sx={flowBar.topRow}>
          <CasePrepSelect
            label={L.stage}
            value={formData.motorStage}
            placeholder={L.stagePlaceholder}
            options={DISPATCH_STAGE_OPTIONS}
            width={180}
            theme={selectTheme}
            onChange={(value) => onSetupChange("motorStage", value)}
          />

          <CasePrepSelect
            label={L.motorId}
            value={draftMotorId}
            placeholder={L.motorIdPlaceholder}
            options={motorOptions}
            width={260}
            theme={selectTheme}
            disabled={!formData.motorStage || motorOptions.length === 0}
            onChange={onDraftMotorIdChange}
          />

          <CasePrepDateField
            label={L.castingDate}
            value={formData.castingDate}
            onChange={(value) => onSetupChange("castingDate", value)}
            theme={selectTheme}
          />

          <CasePrepDateField
            label={L.dispatchDate}
            value={formData.dispatchDate}
            onChange={(value) => onSetupChange("dispatchDate", value)}
            theme={selectTheme}
          />

          <CasePrepTextField
            label={L.dispatchLocation}
            value={formData.dispatchLocation}
            placeholder={L.dispatchLocationPlaceholder}
            width={240}
            theme={selectTheme}
            onChange={(value) => onSetupChange("dispatchLocation", value)}
          />
        </Box>

        <Box sx={flowBar.topRow}>
          <CasePrepSelect
            label={L.ndtClearance}
            value={formData.ndtClearance}
            placeholder="Select"
            options={DISPATCH_YES_NO_OPTIONS}
            width={260}
            theme={selectTheme}
            onChange={(value) => onSetupChange("ndtClearance", value)}
          />

          {formData.ndtClearance === "YES" ? (
            <CasePrepTextField
              label={L.ndtMomNo}
              value={formData.ndtMomNo}
              placeholder={L.ndtMomNoPlaceholder}
              theme={selectTheme}
              onChange={(value) => onSetupChange("ndtMomNo", value)}
            />
          ) : null}

          <CasePrepSelect
            label={L.finalAcceptanceClearance}
            value={formData.finalAcceptanceClearance}
            placeholder="Select"
            options={DISPATCH_YES_NO_OPTIONS}
            width={340}
            theme={selectTheme}
            onChange={(value) => onSetupChange("finalAcceptanceClearance", value)}
          />

          {formData.finalAcceptanceClearance === "YES" ? (
            <CasePrepTextField
              label={L.finalAcceptanceMomNo}
              value={formData.finalAcceptanceMomNo}
              placeholder={L.finalAcceptanceMomNoPlaceholder}
              theme={selectTheme}
              onChange={(value) => onSetupChange("finalAcceptanceMomNo", value)}
            />
          ) : null}

          <Box sx={{ ...flowBar.actionRow, ml: { sm: "auto" }, width: { xs: "100%", sm: "auto" } }}>
            {showLoad ? (
              <Button
                variant="contained"
                size="medium"
                disabled={schemaLoading}
                onClick={onLoadForm}
                startIcon={schemaLoading ? <CircularProgress size={14} color="inherit" /> : undefined}
                sx={flowBar.primaryAction}
              >
                {schemaLoading ? L.loadingSchema : L.loadForm}
              </Button>
            ) : null}
            {showAdd ? (
              <Button
                variant="contained"
                size="medium"
                disabled={schemaLoading}
                onClick={onAddMotor}
                startIcon={schemaLoading ? <CircularProgress size={14} color="inherit" /> : undefined}
                sx={flowBar.primaryAction}
              >
                {schemaLoading ? L.loadingSchema : L.addMotor}
              </Button>
            ) : null}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default DispatchFlowBar;
