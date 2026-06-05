import { Box, Typography } from "@mui/material";
import type { ElementType } from "react";
import getDepartmentHeaderTheme from "../../../app/theme/custom_themes/common/departmentHeader_theme";
import { icons }               from "../../../app/theme/icons";
import { useThemeStore }       from "../../../app/store/themeStore";
import { STRINGS }             from "../../../app/config/strings";

const S = STRINGS.DEPARTMENT_HEADER;

type DepartmentHeaderStats = {
  allocated: number;
  completed: number;
  draft: number;
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
// Displays identity info (dept / sub-dept / user) on the left and
// batch-count stats on the right.
//
// Props:
//   deptName        string  — e.g. "Sourcing Department"
//   subDeptName     string  — e.g. "Raw Material Procurement"
//   userName        string  — logged-in user's display name
//   userRole        string  — e.g. "Approver"
//   stats           object  — { allocated, completed, draft, pending }
// ─────────────────────────────────────────────────────────────────────────────

const DepartmentHeader = ({
  icon,
  deptName    = S.DEFAULT_DEPT,
  subDeptName = S.DEFAULT_SUB_DEPT,
  userName    = S.DEFAULT_USER,
  userRole    = S.DEFAULT_ROLE,
  stats       = { allocated: 0, completed: 0, draft: 0, pending: 0 },
  statItems,
}: DepartmentHeaderProps) => {
  const mode = useThemeStore((s) => s.mode);
  const t    = getDepartmentHeaderTheme(mode);
  const HeaderIcon = (icon ?? icons.apartment) as typeof icons.apartment;

  const defaultStats: DepartmentHeaderStatItem[] = [
    { key: "allocated", label: S.STAT_ALLOCATED, value: stats.allocated },
    { key: "completed", label: S.STAT_COMPLETED, value: stats.completed },
    { key: "draft",     label: S.STAT_DRAFT,     value: stats.draft     },
    { key: "pending",   label: S.STAT_PENDING,   value: stats.pending   },
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
              <HeaderIcon fontSize="medium" />
            </Box>

            {/* Dept name + sub-dept + user chips */}
            <Box sx={t.identityText}>

              <Typography sx={t.subDeptName}>
                {subDeptName}
              </Typography>

              <Typography sx={t.deptName}>
                {deptName}
              </Typography>

              {/* User + Role chips */}
              <Box sx={t.userRow}>

                {/* Username chip */}
                <Box sx={t.userChip}>
                  <icons.person sx={t.userIcon} />
                  <Typography sx={t.userChipLabel}>{S.LABEL_USER}</Typography>
                  <Typography sx={t.userChipValue}>{userName}</Typography>
                </Box>

                {/* Role chip */}
                <Box sx={t.userChip}>
                  <icons.security sx={t.userIcon} />
                  <Typography sx={t.userChipLabel}>{S.LABEL_ROLE}</Typography>
                  <Typography sx={t.userChipValue}>{userRole}</Typography>
                </Box>

              </Box>
            </Box>
          </Box>

          {/* ── RIGHT: Batch stats ── */}
          <Box sx={{
            ...t.statsGrid,
            gridTemplateColumns: {
              xs: "repeat(2, 1fr)",
              sm: statsColumnCount <= 4 ? "repeat(2, 1fr)" : "repeat(3, 1fr)",
              md: `repeat(${Math.min(statsColumnCount, 5)}, 1fr)`,
            },
          }}>
            {displayStats.map(({ key, label, value }) => (
              <Box key={key} sx={t.statTile(key)}>
                <Typography sx={t.statTileValue}>{value}</Typography>
                <Typography sx={t.statTileLabel}>{label}</Typography>
              </Box>
            ))}
          </Box>

        </Box>

        {/* ── Thin divider ── */}
        <Box sx={t.divider} />

      </Box>
    </Box>
  );
};

export default DepartmentHeader;