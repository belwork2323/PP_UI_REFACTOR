import { Box, Button, Stack, Typography } from "@mui/material";
import {
  buildDivisionNavGroups,
  getDivisionNavSubHint,
  getSubNavCount,
  getSubNavKey,
  getSubNavLabel,
  shouldShowSubNav,
  type QcDivisionNavGroup,
} from "../../../../../hooks/user/qualityControl/qcDivisionNav";
import { QC_DIVISION_BRAND } from "../../../../../app/theme/custom_themes/user/qualityControl/tokens";
import { STRINGS } from "../../../../../app/config/strings";

const S = STRINGS.QUALITY_CONTROL.QC_DIVISION;

type QCDivisionNavPanelProps = {
  entries: import("../../../../../hooks/user/qualityControl/qcDivisionEntryTypes").QcDivisionEntry[];
  activeGroupIndex: number;
  activeSubIndex: number;
  onActiveGroupIndexChange: (index: number) => void;
  onActiveSubIndexChange: (index: number) => void;
};

const QCDivisionNavPanel = ({
  entries,
  activeGroupIndex,
  activeSubIndex,
  onActiveGroupIndexChange,
  onActiveSubIndexChange,
}: QCDivisionNavPanelProps) => {
  const BRAND = QC_DIVISION_BRAND;
  const groups = buildDivisionNavGroups(entries);

  if (!groups.length) return null;

  const safeGroupIndex = Math.min(Math.max(activeGroupIndex, 0), groups.length - 1);
  const activeGroup = groups[safeGroupIndex] ?? groups[0];
  const subNavCount = getSubNavCount(activeGroup);
  const safeSubIndex = Math.min(Math.max(activeSubIndex, 0), Math.max(0, subNavCount - 1));
  const showSubNav = shouldShowSubNav(activeGroup);
  const isMotorNav = activeGroup?.kind === "motor-based";
  const currentMotorLabel = isMotorNav ? getSubNavLabel(activeGroup, safeSubIndex) : "";

  const handleGroupChange = (index: number) => {
    onActiveGroupIndexChange(index);
    onActiveSubIndexChange(0);
  };

  const handleMotorStep = (nextIndex: number) => {
    onActiveSubIndexChange(Math.min(Math.max(nextIndex, 0), Math.max(0, subNavCount - 1)));
  };

  return (
    <Stack spacing={1.25} sx={{ mt: 2 }}>
      <Typography sx={{ fontSize: "0.84rem", fontWeight: 800, color: BRAND.primary }}>
        {S.DIVISION_SECTION_TITLE}
      </Typography>

      <Box
        sx={{
          border: `1px solid ${BRAND.border}`,
          borderRadius: 2,
          px: 1,
          py: 1,
          background: BRAND.surface,
        }}
      >
        <Typography sx={{ fontSize: "0.76rem", fontWeight: 700, color: BRAND.primary, mb: 0.4 }}>
          {S.DIVISION_NAV_TITLE}
        </Typography>
        <Typography sx={{ fontSize: "0.72rem", color: BRAND.textSub, mb: 0.9 }}>
          {S.DIVISION_NAV_HINT}
        </Typography>
        <Stack direction="row" spacing={1} sx={{ overflowX: "auto", pb: 0.5 }}>
          {groups.map((group, index) => {
            const active = index === safeGroupIndex;
            return (
              <Button
                key={group.flowKey}
                size="small"
                variant={active ? "contained" : "outlined"}
                onClick={() => handleGroupChange(index)}
                sx={{ whiteSpace: "nowrap", flexShrink: 0, textTransform: "none" }}
              >
                {group.label}
              </Button>
            );
          })}
        </Stack>
      </Box>

      {showSubNav ? (
        <Box
          sx={{
            border: `1px solid ${BRAND.border}`,
            borderRadius: 2,
            px: 1,
            py: 1,
            background: BRAND.surface,
          }}
        >
          <Typography sx={{ fontSize: "0.76rem", fontWeight: 700, color: BRAND.primary, mb: 0.4 }}>
            {isMotorNav ? S.MOTOR_NAV_TITLE : S.SUBDIVISION_NAV_TITLE}
          </Typography>
          <Typography sx={{ fontSize: "0.72rem", color: BRAND.textSub, mb: 0.9 }}>
            {getDivisionNavSubHint(activeGroup)}
          </Typography>

          {isMotorNav && subNavCount > 0 ? (
            <Box
              sx={{
                border: `1px solid ${BRAND.border}`,
                borderRadius: 1.5,
                px: 1.2,
                py: 1,
                mb: 1,
                background: "#fff",
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Button
                  variant="outlined"
                  size="small"
                  disabled={safeSubIndex === 0}
                  onClick={() => handleMotorStep(safeSubIndex - 1)}
                  sx={{ textTransform: "none", minWidth: 72 }}
                >
                  {S.DIVISION_NAV_BACK}
                </Button>
                <Stack alignItems="center" spacing={0.2} sx={{ px: 1, minWidth: 0 }}>
                  <Typography
                    sx={{
                      fontSize: "0.86rem",
                      fontWeight: 800,
                      color: BRAND.primary,
                      textAlign: "center",
                    }}
                  >
                    {currentMotorLabel}
                  </Typography>
                  {subNavCount > 1 ? (
                    <Typography sx={{ fontSize: "0.72rem", fontWeight: 600, color: BRAND.textSub }}>
                      {S.MOTOR_NAV_COUNTER.replace("{current}", String(safeSubIndex + 1)).replace(
                        "{total}",
                        String(subNavCount),
                      )}
                    </Typography>
                  ) : null}
                </Stack>
                <Button
                  variant="outlined"
                  size="small"
                  disabled={safeSubIndex >= subNavCount - 1}
                  onClick={() => handleMotorStep(safeSubIndex + 1)}
                  sx={{ textTransform: "none", minWidth: 72 }}
                >
                  {S.DIVISION_NAV_NEXT}
                </Button>
              </Stack>
            </Box>
          ) : null}

          {isMotorNav ? (
            <Stack direction="row" spacing={1} sx={{ overflowX: "auto", pb: 0.5 }}>
              {activeGroup.motorTabs.map((tab, index) => {
                const active = index === safeSubIndex;
                return (
                  <Button
                    key={tab.motorId}
                    size="small"
                    variant={active ? "contained" : "outlined"}
                    onClick={() => onActiveSubIndexChange(index)}
                    sx={{ whiteSpace: "nowrap", flexShrink: 0, textTransform: "none" }}
                  >
                    {tab.motorId}
                  </Button>
                );
              })}
            </Stack>
          ) : (
            <Stack direction="row" spacing={1} sx={{ overflowX: "auto", pb: 0.5 }}>
              {Array.from({ length: subNavCount }).map((_, index) => {
                const active = index === safeSubIndex;
                return (
                  <Button
                    key={getSubNavKey(activeGroup as QcDivisionNavGroup, index)}
                    size="small"
                    variant={active ? "contained" : "outlined"}
                    onClick={() => onActiveSubIndexChange(index)}
                    sx={{ whiteSpace: "nowrap", flexShrink: 0, textTransform: "none" }}
                  >
                    {getSubNavLabel(activeGroup as QcDivisionNavGroup, index)}
                  </Button>
                );
              })}
            </Stack>
          )}
        </Box>
      ) : null}
    </Stack>
  );
};

export default QCDivisionNavPanel;
