import { Box, Button, CircularProgress, Typography } from "@mui/material";
import {
  STF_FLOW_LABELS,
  canAddStfBemMotor,
  hasStfMotorsOfSubType,
  type StfAddedMotor,
  type StfMotorOption,
} from "../../../../../hooks/user/qualityControl/stfFlowConfig";
import type { StfSubType } from "../../../../../schema-engine";
import CasePrepSelect from "../../manufacturing/CasePreparation/CasePrepSelect";

type STFFlowBarProps = {
  selectedMotorType: StfSubType | "";
  motorCount: number | "";
  draftMotorIds: string[];
  draftBemNo: string;
  addedMotors: StfAddedMotor[];
  availableMotorOptions: StfMotorOption[];
  availableBemMotorOptions?: StfMotorOption[];
  maxMotorCount: number;
  approvedMotorsLoading?: boolean;
  schemaLoading?: boolean;
  /** ACEM locks motor type to BEM; main motors come from batch navigation. */
  lockMotorTypeToBem?: boolean;
  onMotorTypeChange: (value: string) => void;
  onMotorCountChange: (count: number | "") => void;
  onDraftMotorIdChange: (index: number, motorId: string) => void;
  onDraftBemNoChange: (value: string) => void;
  onLoadForm: () => void;
  onAddMotors: () => void;
  theme: any;
};

const STFFlowBar = ({
  draftBemNo,
  addedMotors,
  availableBemMotorOptions = [],
  schemaLoading = false,
  lockMotorTypeToBem = true,
  onDraftBemNoChange,
  onAddMotors,
  theme,
}: STFFlowBarProps) => {
  const flowBar = theme.manufacturing?.casePreparation?.flowBar ?? {};
  const L = STF_FLOW_LABELS;
  const usedMotorIds = addedMotors.map((motor) => motor.motorId);
  const hasBemMotors = hasStfMotorsOfSubType(addedMotors, "BEM");

  const bemOptions = availableBemMotorOptions.map((option) => ({
    ...option,
    disabled: option.value !== draftBemNo && usedMotorIds.includes(option.value),
  }));

  const canAddBem = canAddStfBemMotor(draftBemNo, usedMotorIds, hasBemMotors);
  const setupHint =
    bemOptions.length === 0
      ? L.setupHintBemEmpty
      : hasBemMotors
        ? L.setupHintBemLoaded
        : L.setupHintBem;

  return (
    <Box sx={flowBar.container}>
      {setupHint ? (
        <Typography sx={{ fontSize: "0.78rem", color: "#5D6D7E", mb: 1.5 }}>{setupHint}</Typography>
      ) : null}

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Box
          sx={{
            ...flowBar.topRow,
            alignItems: "flex-end",
            flexWrap: "wrap",
          }}
        >
          {lockMotorTypeToBem ? (
            <Box sx={{ minWidth: 160 }}>
              <Typography
                sx={{
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  color: "#5D6D7E",
                  mb: 0.75,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                {L.motorType}
              </Typography>
              <Box
                sx={{
                  height: 40,
                  px: 1.5,
                  display: "flex",
                  alignItems: "center",
                  borderRadius: 1.5,
                  border: "1.5px solid #D5D8DC",
                  background: "#F4F6F8",
                  fontSize: "0.84rem",
                  fontWeight: 700,
                  color: "#1C2833",
                }}
              >
                BEM
              </Box>
            </Box>
          ) : null}

          <CasePrepSelect
            label={L.bemNo}
            value={draftBemNo}
            placeholder={L.bemNoPlaceholder}
            options={bemOptions}
            width={260}
            theme={theme}
            disabled={bemOptions.length === 0}
            onChange={onDraftBemNoChange}
          />
        </Box>

        {canAddBem ? (
          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <Button
              variant="contained"
              size="small"
              disabled={schemaLoading}
              onClick={onAddMotors}
              startIcon={
                schemaLoading ? <CircularProgress size={14} color="inherit" /> : undefined
              }
            >
              {schemaLoading ? L.loadingSchema : L.addMotors}
            </Button>
          </Box>
        ) : null}
      </Box>
    </Box>
  );
};

export default STFFlowBar;
