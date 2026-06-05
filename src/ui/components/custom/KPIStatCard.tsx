import { Box, Typography } from "@mui/material";
import { fonts, spacing } from "../../../app/theme";

const KPIStatCard = ({ icon: Icon, label, value, unit, color }) => (
  <Box
    sx={{
      bgcolor: "background.paper",
      p: spacing.md,
      borderLeft: `5px solid ${color}`,
      borderRadius: 2,
      display: "flex",
      alignItems: "center",
      gap: spacing.md,
      boxShadow: 1,
    }}
  >
    <Icon sx={{ fontSize: 40, color }} />

    <Box>
      <Typography fontWeight={fonts.weight.bold}>
        {value}
        {unit && <span>{unit}</span>}
      </Typography>
      <Typography fontSize={fonts.size.sm} color="text.secondary">
        {label}
      </Typography>
    </Box>
  </Box>
);

export default KPIStatCard;
