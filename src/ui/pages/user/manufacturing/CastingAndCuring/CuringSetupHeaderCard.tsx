import { Box, Stack, Typography } from "@mui/material";
import type { CuringCycleConfig } from "../../../../../data/models/user/CuringCycleConfigModel";
import type { CuringProcessSetup } from "../../../../../data/models/user/CastingCuringFormModel";
import {
  CASTING_CURING_FLOW_LABELS,
  formatCuringTypeLabel,
  formatMotorStageLabel,
  type CastingCuringBatchMotorSource,
} from "../../../../../hooks/user/manufacturing/castingCuringFlowConfig";
import { STRINGS } from "../../../../../app/config/strings";

type CuringSetupHeaderCardProps = {
  setup: CuringProcessSetup;
  curingCycleConfig?: CuringCycleConfig | null;
  batch?: CastingCuringBatchMotorSource | null;
  theme: any;
};

const DetailItem = ({ label, value }: { label: string; value: string }) => (
  <Box sx={{ minWidth: 0 }}>
    <Typography sx={{ fontSize: "0.65rem", fontWeight: 700, color: "text.secondary", mb: 0.25 }}>
      {label}
    </Typography>
    <Typography sx={{ fontSize: "0.82rem", fontWeight: 600, color: "text.primary", wordBreak: "break-word" }}>
      {value || "—"}
    </Typography>
  </Box>
);

const formatOvenNo = (ovenNo: string) => {
  const n = Number(ovenNo);
  if (!ovenNo.trim()) return "";
  if (Number.isFinite(n) && n > 0) {
    return STRINGS.MANUFACTURING.CASTING_CURING.CURING_OVEN_NO_OPTION(n);
  }
  return ovenNo;
};

const CuringSetupHeaderCard = ({
  setup,
  curingCycleConfig = null,
  batch = null,
  theme,
}: CuringSetupHeaderCardProps) => {
  const L = CASTING_CURING_FLOW_LABELS;
  const motorStageLabel = formatMotorStageLabel(curingCycleConfig, batch);

  return (
    <Box
      sx={{
        borderRadius: 2.5,
        border: `1px solid ${theme.palette.border}`,
        background: theme.palette.surface,
        px: 1.5,
        py: 1.25,
        mb: 1.25,
      }}
    >
      <Typography sx={{ fontSize: "0.84rem", fontWeight: 800, color: theme.palette.primary, mb: 1 }}>
        {L.curingProcessTitle}
      </Typography>
      <Stack direction="row" useFlexGap flexWrap="wrap" gap={2}>
        <DetailItem label={L.curingMotorStage} value={motorStageLabel} />
        <DetailItem
          label={L.curingType}
          value={formatCuringTypeLabel(curingCycleConfig?.curingType ?? setup.curingType)}
        />
        <DetailItem label={L.curingSelectOven} value={setup.oven} />
        <DetailItem label={L.curingSelectOvenNo} value={formatOvenNo(setup.ovenNo)} />
      </Stack>
    </Box>
  );
};

export default CuringSetupHeaderCard;
