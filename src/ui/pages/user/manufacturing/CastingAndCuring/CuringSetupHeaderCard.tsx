import { Box, Stack, Typography } from "@mui/material";
import type { CuringProcessSetup } from "../../../../../data/models/user/CastingCuringFormModel";
import { CASTING_CURING_FLOW_LABELS } from "../../../../../hooks/user/manufacturing/castingCuringFlowConfig";

type CuringSetupHeaderCardProps = {
  setup: CuringProcessSetup;
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

const CuringSetupHeaderCard = ({ setup, theme }: CuringSetupHeaderCardProps) => {
  const L = CASTING_CURING_FLOW_LABELS;
  const showMotorsToCure = String(setup.configuration).toLowerCase() === "multiple";

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
      <Stack
        direction="row"
        useFlexGap
        flexWrap="wrap"
        gap={2}
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "repeat(2, minmax(0, 1fr))",
            md: "repeat(4, minmax(0, 1fr))",
          },
        }}
      >
        <DetailItem label={L.curingSelectOven} value={setup.oven} />
        <DetailItem label={L.curingType} value={setup.curingType} />
        <DetailItem label={L.curingConfiguration} value={setup.configuration} />
        {showMotorsToCure ? (
          <DetailItem
            label={L.curingMotorsToCure}
            value={setup.motorsToCureCount === "" ? "" : String(setup.motorsToCureCount)}
          />
        ) : null}
        <DetailItem label={L.curingOvensUtilized} value={setup.ovensUtilized} />
      </Stack>
    </Box>
  );
};

export default CuringSetupHeaderCard;
