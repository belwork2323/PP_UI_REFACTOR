import { Box, Typography } from "@mui/material";
import type { ElementType } from "react";
import getDepartmentHeaderTheme from "../../../app/theme/custom_themes/common/departmentHeader_theme";
import { icons } from "../../../app/theme/icons";
import { useThemeStore } from "../../../app/store/themeStore";
import { STRINGS } from "../../../app/config/strings";

const S = STRINGS.DEPARTMENT_HEADER;

type DepartmentHeaderStats = {
  allocated: number;
  approved: number;
  rejected: number;
  pending: number;
};

export type DepartmentHeaderStatItem = {
  key: string;
  label: string;
  value: number;
};

type DepartmentHeaderProps = {
  icon?: ElementType;
  deptName?: string;
  subDeptName?: string;
  userName?: string;
  userRole?: string;
  stats?: DepartmentHeaderStats;
  statItems?: DepartmentHeaderStatItem[];
};

// ─────────────────────────────────────────────────────────────────────────────
// DepartmentHeader
//
// Details card rendered immediately below AppHeader.
// Displays identity info (dept / sub-dept) on the left and
// batch-count stats on the right.
//
// Props:
//   deptName        string  — e.g. "Sourcing Department"
//   subDeptName     string  — e.g. "Raw Material Sourcing"
//   stats           object  — { allocated, approved, rejected, pending }
// ─────────────────────────────────────────────────────────────────────────────

const DepartmentHeader = ({
  icon,
  deptName = S.DEFAULT_DEPT,
  subDeptName = S.DEFAULT_SUB_DEPT,
  stats = { allocated: 0, approved: 0, rejected: 0, pending: 0 },
  statItems,
}: DepartmentHeaderProps) => {
  const mode = useThemeStore((s) => s.mode);
  const t = getDepartmentHeaderTheme(mode);
  const HeaderIcon = (icon ?? icons.apartment) as typeof icons.apartment;

  const defaultStats: DepartmentHeaderStatItem[] = [
    { key: "allocated", label: S.STAT_ALLOCATED, value: stats.allocated },
    { key: "approved", label: S.STAT_APPROVED, value: stats.approved },
    { key: "rejected", label: S.STAT_REJECTED, value: stats.rejected },
    { key: "pending", label: S.STAT_PENDING, value: stats.pending },
  ];

  const displayStats = statItems ?? defaultStats;
  const statsColumnCount = displayStats.length;

  return (
    <Box sx={t.wrapper}>
      <Box sx={t.card}>
        {/* ── Decorative accent circles ── */}
        <Box sx={t.decorCircle} />
        <Box sx={t.decorCircleSmall} />

        {/* ── Main content row ── */}
        <Box sx={t.topRow}>
          {/* ── LEFT: Identity ── */}
          <Box sx={t.identityBlock}>
            {/* Icon badge */}
            <Box sx={t.iconBadge}>
              <HeaderIcon fontSize="small" />
            </Box>

            {/* Dept name + sub-dept */}
            <Box sx={t.identityText}>
              <Typography sx={t.subDeptName}>{subDeptName}</Typography>
              <Typography sx={t.deptName}>{deptName}</Typography>
            </Box>
          </Box>

          {/* ── RIGHT: Batch stats ── */}
          <Box
            sx={{
              ...t.statsGrid,
              gridTemplateColumns: {
                xs: "repeat(2, 1fr)",
                sm: statsColumnCount <= 4 ? "repeat(2, 1fr)" : "repeat(3, 1fr)",
                md: `repeat(${Math.min(statsColumnCount, 5)}, 1fr)`,
              },
            }}
          >
            {displayStats.map(({ key, label, value }) => (
              <Box key={key} sx={t.statTile(key)}>
                <Typography sx={t.statTileValue}>{value}</Typography>
                <Typography sx={t.statTileLabel}>{label}</Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default DepartmentHeader;
