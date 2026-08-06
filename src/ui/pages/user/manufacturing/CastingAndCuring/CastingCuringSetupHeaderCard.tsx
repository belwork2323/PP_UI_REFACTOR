import { Box, Stack, Typography } from "@mui/material";
import { CASTING_CURING_FLOW_LABELS } from "../../../../../hooks/user/manufacturing/castingCuringFlowConfig";

type CastingCuringSetupHeaderCardProps = {
  castingType: string;
  castingStation: string;
  motorId: string;
  motorReceivedAt: string;
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

const CastingCuringSetupHeaderCard = ({
  castingType,
  castingStation,
  motorId,
  motorReceivedAt,
  theme,
}: CastingCuringSetupHeaderCardProps) => {
  const L = CASTING_CURING_FLOW_LABELS;

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
        {L.castingProcessTitle}
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
        <DetailItem label={L.castingType} value={castingType} />
        <DetailItem label={L.castingStation} value={castingStation} />
        <DetailItem label={L.motorId} value={motorId} />
        <DetailItem label={L.motorReceivedAt} value={motorReceivedAt} />
      </Stack>
    </Box>
  );
};

export default CastingCuringSetupHeaderCard;
