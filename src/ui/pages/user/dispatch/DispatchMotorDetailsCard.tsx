import { Box, Stack, Typography } from "@mui/material";
import { DISPATCH_FLOW_LABELS } from "../../../../hooks/user/dispatch/dispatchFlowConfig";
import type { DispatchMotorSession } from "../../../../data/models/user/DispatchFormModel";
import type { DispatchMotorData } from "../../../../data/models/user/DispatchMotorDataModel";
import DispatchMotorPanel from "./DispatchMotorPanel";
import getDispatchTheme from "../../../../app/theme/custom_themes/user/dispatch/dispatch_theme";

type DispatchMotorDetailsCardProps = {
  motor: DispatchMotorSession;
  subDepartmentId?: number;
  batchId?: string;
  theme: {
    palette: {
      border: string;
      surface: string;
      primary: string;
      primaryLight?: string;
      text: string;
      textSub: string;
      pageBg?: string;
    };
  };
  onMotorDataChange: (data: DispatchMotorData) => void;
  readOnly?: boolean;
  disabled?: boolean;
};

const formatStageLabel = (stage: string) => {
  const trimmed = String(stage ?? "").trim();
  if (!trimmed) return "—";
  return trimmed.toLowerCase().startsWith("stage") ? trimmed : `Stage ${trimmed}`;
};

const formatYesNo = (value: string) => {
  const normalized = String(value ?? "").trim().toUpperCase();
  if (!normalized) return "—";
  return normalized;
};

const DispatchMotorDetailsCard = ({
  motor,
  subDepartmentId,
  batchId,
  theme,
  onMotorDataChange,
  readOnly = false,
  disabled = false,
}: DispatchMotorDetailsCardProps) => {
  const L = DISPATCH_FLOW_LABELS;
  const panel = getDispatchTheme(theme).panel;
  const setup = motor.setup;

  const summaryItems = [
    { id: "stage", label: L.stage, value: formatStageLabel(setup.motorStage) },
    { id: "castingDate", label: L.castingDate, value: setup.castingDate },
    { id: "dispatchDate", label: L.dispatchDate, value: setup.dispatchDate },
    { id: "dispatchLocation", label: L.dispatchLocation, value: setup.dispatchLocation },
    { id: "ndtClearance", label: L.ndtClearance, value: formatYesNo(setup.ndtClearance) },
    ...(setup.ndtClearance === "YES"
      ? [{ id: "ndtMomNo", label: L.ndtMomNo, value: setup.ndtMomNo }]
      : []),
    {
      id: "finalAcceptanceClearance",
      label: L.finalAcceptanceClearance,
      value: formatYesNo(setup.finalAcceptanceClearance),
    },
    ...(setup.finalAcceptanceClearance === "YES"
      ? [{ id: "finalAcceptanceMomNo", label: L.finalAcceptanceMomNo, value: setup.finalAcceptanceMomNo }]
      : []),
  ];

  return (
    <>
      <Box sx={panel.setupSummary}>
        <Stack
          direction="row"
          flexWrap="wrap"
          useFlexGap
          sx={{ columnGap: 2.5, rowGap: 1.25 }}
        >
          {summaryItems.map((item) => (
            <Box key={item.id} sx={{ minWidth: { xs: "100%", sm: 180 } }}>
              <Typography sx={panel.setupLabel}>{item.label}</Typography>
              <Typography sx={panel.setupValue}>{item.value?.trim() ? item.value : "—"}</Typography>
            </Box>
          ))}
        </Stack>
      </Box>

      <Typography sx={panel.detailsSectionTitle}>{L.detailsFormSection}</Typography>

      <DispatchMotorPanel
        value={motor.dispatchData}
        onChange={onMotorDataChange}
        theme={theme}
        readOnly={readOnly}
        disabled={disabled}
      />
    </>
  );
};

export default DispatchMotorDetailsCard;
