import type { ReactNode } from "react";
import { Box, Typography } from "@mui/material";

export type AdminManagementStatItem = {
  label: string;
  subLabel: string;
  value: ReactNode;
  variant: string;
  icon: ReactNode;
};

type AdminManagementStatsGridProps = {
  stats: AdminManagementStatItem[];
  theme: {
    statsGrid: {
      outerWrap: object;
      bgDecor: object;
      innerGrid: object;
      card: object;
      accentBar: object;
      iconWrap: object;
      textWrap: object;
      value: object;
      label: object;
      subLabel: object;
      cornerDot: object;
      colors: Record<string, {
        accent: string;
        iconBg: string;
        iconBorder: string;
        iconColor: string;
        value: string;
      }>;
    };
  };
};

const AdminManagementStatsGrid = ({ stats, theme }: AdminManagementStatsGridProps) => {
  const { statsGrid } = theme;

  return (
    <Box sx={statsGrid.outerWrap}>
      <Box sx={statsGrid.bgDecor} />
      <Box sx={statsGrid.innerGrid}>
        {stats.map((stat) => {
          const sc = statsGrid.colors[stat.variant];
          return (
            <Box key={stat.label} sx={statsGrid.card}>
              <Box sx={{ ...statsGrid.accentBar, background: sc?.accent }} />
              <Box
                sx={{
                  ...statsGrid.iconWrap,
                  bgcolor: sc?.iconBg,
                  boxShadow: sc?.iconBorder ? `0 0 0 1px ${sc.iconBorder}` : undefined,
                }}
              >
                <Box sx={{ color: sc?.iconColor }}>{stat.icon}</Box>
              </Box>
              <Box sx={statsGrid.textWrap}>
                <Typography sx={{ ...statsGrid.value, color: sc?.value }}>{stat.value}</Typography>
                <Typography sx={statsGrid.label}>{stat.label}</Typography>
                <Typography sx={statsGrid.subLabel}>{stat.subLabel}</Typography>
              </Box>
              <Box sx={{ ...statsGrid.cornerDot, background: sc?.accent }} />
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

export default AdminManagementStatsGrid;
