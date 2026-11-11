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
  onClick?: () => void;
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
  onClick,
  theme,
}: AdminStatCardProps) => (
  <Box
    sx={{
      ...theme.card,
      ...(onClick
        ? {
            cursor: "pointer",
            transition: "transform 0.15s ease, box-shadow 0.15s ease",
            "&:hover": { transform: "translateY(-2px)" },
          }
        : {}),
    }}
    onClick={onClick}
    role={onClick ? "button" : undefined}
    tabIndex={onClick ? 0 : undefined}
    onKeyDown={
      onClick
        ? (e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onClick();
            }
          }
        : undefined
    }
  >
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
