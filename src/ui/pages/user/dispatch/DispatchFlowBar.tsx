import { Box, Button, CircularProgress } from "@mui/material";
import CasePrepSelect from "../manufacturing/CasePreparation/CasePrepSelect";
import CasePrepDateField from "../manufacturing/CasePreparation/CasePrepDateField";
import CasePrepTextField from "../manufacturing/CasePreparation/CasePrepTextField";
import {
  DISPATCH_FLOW_LABELS,
  DISPATCH_STAGE_OPTIONS,
  DISPATCH_YES_NO_OPTIONS,
  canLoadDispatchForm,
} from "../../../../hooks/user/dispatch/dispatchFlowConfig";
import type { DispatchFormState } from "../../../../data/models/user/DispatchFormModel";

type DispatchFlowBarProps = {
  batchId: string;
  formData: DispatchFormState;
  formLoaded: boolean;
  schemaLoading?: boolean;
  onSetupChange: (field: string, value: string) => void;
  onLoadForm: () => void;
  theme: any;

  availableMotors?: Array<{
    motorId: string;
    motorStage?: string;
  }>;
};
const DispatchFlowBar = ({
  batchId,
  formData,
  formLoaded,
  schemaLoading = false,
  onSetupChange,
  onLoadForm,
  theme,
  availableMotors = [],
}: DispatchFlowBarProps) => {
  const flowBar = theme.manufacturing?.casePreparation?.flowBar ?? {};
  const L = DISPATCH_FLOW_LABELS;
  const motorOptions = (availableMotors ?? [])
  .filter(
    (motor) =>
      String(motor.motorStage ?? "") ===
      String(formData.motorStage ?? "")
  )
  .map((motor) => ({
    value: motor.motorId,
    label: motor.motorId,
  }));
  const canLoad = canLoadDispatchForm(formData);

  return (
    <Box sx={flowBar.container}>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Box
          sx={{
            ...flowBar.topRow,
            alignItems: "flex-end",
            flexWrap: "wrap",
          }}
        >
          <CasePrepSelect
            label={L.stage}
            value={formData.motorStage}
            placeholder={L.stagePlaceholder}
            options={DISPATCH_STAGE_OPTIONS}
            width={180}
            theme={theme}
            onChange={(value) => onSetupChange("motorStage", value)}
          />

          <CasePrepSelect
            label={L.motorId}
            value={formData.motorId}
            placeholder={L.motorIdPlaceholder}
            options={motorOptions}
            width={220}
            theme={theme}
            disabled={!formData.motorStage}
            onChange={(value) => onSetupChange("motorId", value)}
          />

          <CasePrepDateField
            label={L.castingDate}
            value={formData.castingDate}
            onChange={(value) => onSetupChange("castingDate", value)}
            theme={theme}
          />

          <CasePrepDateField
            label={L.dispatchDate}
            value={formData.dispatchDate}
            onChange={(value) => onSetupChange("dispatchDate", value)}
            theme={theme}
          />

          <CasePrepTextField
            label={L.dispatchLocation}
            value={formData.dispatchLocation}
            placeholder={L.dispatchLocationPlaceholder}
            width={240}
            theme={theme}
            onChange={(value) => onSetupChange("dispatchLocation", value)}
          />
        </Box>

        <Box
          sx={{
            ...flowBar.topRow,
            alignItems: "flex-end",
            flexWrap: "wrap",
          }}
        >
          <CasePrepSelect
            label={L.ndtClearance}
            value={formData.ndtClearance}
            placeholder="Select"
            options={DISPATCH_YES_NO_OPTIONS}
            width={260}
            theme={theme}
            onChange={(value) => onSetupChange("ndtClearance", value)}
          />

          {formData.ndtClearance === "YES" ? (
            <CasePrepTextField
              label={L.ndtMomNo}
              value={formData.ndtMomNo}
              placeholder={L.ndtMomNoPlaceholder}
              theme={theme}
              onChange={(value) => onSetupChange("ndtMomNo", value)}
            />
          ) : null}

          <CasePrepSelect
            label={L.finalAcceptanceClearance}
            value={formData.finalAcceptanceClearance}
            placeholder="Select"
            options={DISPATCH_YES_NO_OPTIONS}
            width={340}
            theme={theme}
            onChange={(value) => onSetupChange("finalAcceptanceClearance", value)}
          />

          {formData.finalAcceptanceClearance === "YES" ? (
            <CasePrepTextField
              label={L.finalAcceptanceMomNo}
              value={formData.finalAcceptanceMomNo}
              placeholder={L.finalAcceptanceMomNoPlaceholder}
              theme={theme}
              onChange={(value) => onSetupChange("finalAcceptanceMomNo", value)}
            />
          ) : null}
        </Box>

        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
          <Button
            variant="contained"
            size="small"
            disabled={!canLoad || schemaLoading || formLoaded}
            onClick={onLoadForm}
            startIcon={schemaLoading ? <CircularProgress size={14} color="inherit" /> : undefined}
          >
            {schemaLoading ? L.loadingSchema : L.loadForm}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default DispatchFlowBar;
