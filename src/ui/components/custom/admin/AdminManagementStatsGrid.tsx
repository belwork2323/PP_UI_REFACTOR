import type { ReactNode } from "react";
import { Box } from "@mui/material";
import AdminStatCard from "@ui/components/custom/admin/AdminStatCard";

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
            <AdminStatCard
              key={stat.label}
              label={stat.label}
              subLabel={stat.subLabel}
              value={stat.value}
              icon={stat.icon}
              accent={sc?.accent ?? ""}
              iconBg={sc?.iconBg ?? ""}
              iconBorder={sc?.iconBorder}
              iconColor={sc?.iconColor ?? ""}
              valueColor={sc?.value ?? ""}
              theme={statsGrid}
            />
          );
        })}
      </Box>
    </Box>
  );
};

export default AdminManagementStatsGrid;
