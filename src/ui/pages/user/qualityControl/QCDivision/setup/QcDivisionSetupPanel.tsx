import { Box, Button, Stack, Typography } from "@mui/material";
import type { QcDivisionSetupDefinition } from "../../../../../hooks/user/qualityControl/qcDivisionSetupConfig";

type QcDivisionSetupPanelProps = {
  definition: QcDivisionSetupDefinition;
  canLoad: boolean;
  loading?: boolean;
  onLoad: () => void;
  children?: React.ReactNode;
  theme?: { palette?: { primary?: string; border?: string; surface?: string } };
};

const QcDivisionSetupPanel = ({
  definition,
  canLoad,
  loading = false,
  onLoad,
  children,
  theme,
}: QcDivisionSetupPanelProps) => (
  <Box
    sx={{
      borderRadius: 2.5,
      border: `1px solid ${theme?.palette?.border ?? "rgba(148,163,184,0.35)"}`,
      background: theme?.palette?.surface ?? "#fff",
      px: { xs: 1.25, sm: 1.5 },
      py: 1.5,
      mb: 2,
    }}
  >
    <Typography
      sx={{
        fontSize: "0.84rem",
        fontWeight: 800,
        color: theme?.palette?.primary ?? "#1d4ed8",
        mb: 1.5,
      }}
    >
      {definition.title}
    </Typography>
    <Stack spacing={1.5}>{children}</Stack>
    <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
      <Button variant="contained" disabled={!canLoad || loading} onClick={onLoad}>
        {loading ? "Loading…" : definition.loadLabel}
      </Button>
    </Box>
  </Box>
);

export default QcDivisionSetupPanel;
