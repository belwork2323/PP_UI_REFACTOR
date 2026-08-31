import { Box, Typography } from "@mui/material";
import { STRINGS } from "../../../../../app/config/strings";

const S = STRINGS.QUALITY_CONTROL.QC_DIVISION;

type QCDivisionBlockedStateProps = {
  reason?: string | null;
  theme?: { palette?: { text?: { secondary?: string }; border?: string; surface?: string } };
};

const QCDivisionBlockedState = ({ reason, theme }: QCDivisionBlockedStateProps) => (
  <Box
    sx={{
      borderRadius: 2.5,
      border: `1px solid ${theme?.palette?.border ?? "rgba(148,163,184,0.35)"}`,
      background: theme?.palette?.surface ?? "rgba(248,250,252,0.9)",
      px: { xs: 2, sm: 2.5 },
      py: 3,
      textAlign: "center",
    }}
  >
    <Typography sx={{ fontWeight: 800, fontSize: "0.95rem", mb: 1 }}>
      {S.SCHEMA_LOADING_TITLE}
    </Typography>
    <Typography sx={{ color: theme?.palette?.text?.secondary ?? "#64748b", fontSize: "0.88rem" }}>
      {reason ??
        "Cannot show QC UI — no motor, premix, or material data available for this batch."}
    </Typography>
  </Box>
);

export default QCDivisionBlockedState;
