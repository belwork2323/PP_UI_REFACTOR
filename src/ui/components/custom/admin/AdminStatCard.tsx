import type { ReactNode } from "react";
import { Box, Typography } from "@mui/material";

export type AdminStatCardProps = {
  label: string;
  subLabel?: string;
  value: ReactNode;
  icon: ReactNode;
  accent: string;
  iconBg: string;
  iconBorder?: string;
  iconColor: string;
  valueColor: string;
  theme: {
    card: object;
    accentBar: object;
    iconWrap: object;
    textWrap: object;
    value: object;
    label: object;
    subLabel: object;
    cornerDot: object;
  };
};

/** Shared stat card layout for AdminManagementStatsGrid and DashKPICard-style widgets */
const AdminStatCard = ({
  label,
  subLabel,
  value,
  icon,
  accent,
  iconBg,
  iconBorder,
  iconColor,
  valueColor,
  theme,
}: AdminStatCardProps) => (
  <Box sx={theme.card}>
    <Box sx={{ ...theme.accentBar, background: accent }} />
    <Box
      sx={{
        ...theme.iconWrap,
        bgcolor: iconBg,
        boxShadow: iconBorder ? `0 0 0 1px ${iconBorder}` : undefined,
      }}
    >
      <Box sx={{ color: iconColor }}>{icon}</Box>
    </Box>
    <Box sx={theme.textWrap}>
      <Typography sx={{ ...theme.value, color: valueColor }}>{value}</Typography>
      <Typography sx={theme.label}>{label}</Typography>
      {subLabel ? <Typography sx={theme.subLabel}>{subLabel}</Typography> : null}
    </Box>
    <Box sx={{ ...theme.cornerDot, background: accent }} />
  </Box>
);

export default AdminStatCard;
