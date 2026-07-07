import type { ReactNode } from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import { NDT_FLOW_LABELS } from "../../../../../hooks/user/qualityControl/ndtFlowConfig";

const BRAND = {
  primary: "#1B4F72",
  primaryLight: "#2E86C1",
  border: "#D5D8DC",
  surface: "#F4F6F8",
  textSub: "#5D6D7E",
};

type NDTMotorNavigationProps = {
  tabs: Array<{ id: string; label: string }>;
  activeIndex: number;
  onActiveIndexChange: (index: number) => void;
  children: ReactNode;
};

const NDTMotorNavigation = ({
  tabs,
  activeIndex,
  onActiveIndexChange,
  children,
}: NDTMotorNavigationProps) => {
  const L = NDT_FLOW_LABELS;
  const safeIndex = Math.min(Math.max(activeIndex, 0), Math.max(tabs.length - 1, 0));
  const atStart = safeIndex <= 0;
  const atEnd = safeIndex >= tabs.length - 1;

  return (
    <Stack spacing={1}>
      {tabs.length > 1 ? (
        <>
          <Box
            sx={{
              border: `1px solid ${BRAND.border}`,
              borderRadius: 2,
              px: 1.2,
              py: 0.75,
              background: BRAND.surface,
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Button
                variant="outlined"
                size="small"
                disabled={atStart}
                onClick={() => onActiveIndexChange(Math.max(0, safeIndex - 1))}
                sx={{ textTransform: "none", minWidth: 72 }}
              >
                {L.navBack}
              </Button>
              <Typography sx={{ fontSize: "0.8rem", fontWeight: 700, color: BRAND.primary }}>
                {L.motorCardTitle} {safeIndex + 1} of {tabs.length}
              </Typography>
              <Button
                variant="outlined"
                size="small"
                disabled={atEnd}
                onClick={() => onActiveIndexChange(Math.min(tabs.length - 1, safeIndex + 1))}
                sx={{ textTransform: "none", minWidth: 72 }}
              >
                {L.navNext}
              </Button>
            </Stack>
          </Box>

          <Box
            sx={{
              border: `1px solid ${BRAND.border}`,
              borderRadius: 2,
              px: 1,
              py: 0.75,
              background: BRAND.surface,
            }}
          >
            <Typography sx={{ fontSize: "0.74rem", fontWeight: 700, color: BRAND.primary, mb: 0.3 }}>
              {L.motorNavTitle}
            </Typography>
            <Typography sx={{ fontSize: "0.7rem", color: BRAND.textSub, mb: 0.75 }}>
              {L.motorNavHint}
            </Typography>
            <Stack direction="row" spacing={0.75} sx={{ overflowX: "auto", pb: 0.25 }}>
              {tabs.map((tab, index) => (
                <Button
                  key={tab.id}
                  size="small"
                  variant={index === safeIndex ? "contained" : "outlined"}
                  onClick={() => onActiveIndexChange(index)}
                  sx={{
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                    textTransform: "none",
                    fontSize: "0.72rem",
                    py: 0.35,
                    ...(index === safeIndex
                      ? {
                          background: `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.primaryLight})`,
                          "&:hover": { background: `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.primaryLight})` },
                        }
                      : {}),
                  }}
                >
                  {tab.label}
                </Button>
              ))}
            </Stack>
          </Box>
        </>
      ) : null}

      <Box key={tabs[safeIndex]?.id}>{children}</Box>
    </Stack>
  );
};

export default NDTMotorNavigation;
