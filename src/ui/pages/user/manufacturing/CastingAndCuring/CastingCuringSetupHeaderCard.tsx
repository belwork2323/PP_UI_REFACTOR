import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import { Box, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import type { CastingProcessSetup } from "../../../../../data/models/user/CastingCuringFormModel";
import { CASTING_CURING_BRAND } from "../../../../../app/theme/custom_themes/user/manufacturing/castingAndCuring_theme";
import { CASTING_CURING_FLOW_LABELS } from "../../../../../hooks/user/manufacturing/castingCuringFlowConfig";

type CastingCuringSetupHeaderCardProps = {
  castingType: string;
  castingStation: string;
  motorIds: string[];
  motorReceivedAt: string;
  setup: CastingProcessSetup;
  onRemove?: () => void;
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
  motorIds,
  motorReceivedAt,
  setup,
  onRemove,
  theme,
}: CastingCuringSetupHeaderCardProps) => {
  const L = CASTING_CURING_FLOW_LABELS;
  const dangerColor = CASTING_CURING_BRAND.danger;

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
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" gap={1} mb={1}>
        <Typography sx={{ fontSize: "0.84rem", fontWeight: 800, color: theme.palette.primary }}>
          {L.castingProcessTitle}
        </Typography>
        {onRemove ? (
          <Tooltip title={L.removeCastingCardHint}>
            <IconButton
              size="small"
              aria-label={L.removeCastingCard}
              onClick={onRemove}
              sx={{
                mt: -0.25,
                mr: -0.5,
                color: dangerColor,
                "&:hover": { color: dangerColor, background: "rgba(192,57,43,0.08)" },
              }}
            >
              <DeleteOutlineRoundedIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        ) : null}
      </Stack>
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
        <DetailItem label={L.motorId} value={motorIds.join(", ")} />
        <DetailItem label={L.motorReceivedAt} value={motorReceivedAt} />
        <DetailItem label={L.initialVacuum} value={setup.initialVacuum} />
        <DetailItem label={L.castingVacuumPressure} value={setup.castingVacuumPressure} />
        <DetailItem label={L.soakingVacuumPressure} value={setup.soakingVacuumPressure} />
        <DetailItem label={L.finalMixCount} value={setup.finalMixCount} />
      </Stack>
    </Box>
  );
};

export default CastingCuringSetupHeaderCard;
