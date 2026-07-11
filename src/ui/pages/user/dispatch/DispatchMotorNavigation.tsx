import type { ReactNode } from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import { DISPATCH_FLOW_LABELS } from "../../../../hooks/user/dispatch/dispatchFlowConfig";
import { DISPATCH_BRAND } from "../../../../app/theme/custom_themes/user/dispatch/dispatch_theme";

type DispatchMotorNavigationProps = {
  tabs: Array<{ id: string; label: string }>;
  activeIndex: number;
  onActiveIndexChange: (index: number) => void;
  theme: {
    palette: {
      border: string;
      surface: string;
      primary: string;
      textSub: string;
      primaryLight?: string;
    };
  };
  children: ReactNode;
};

const DispatchMotorNavigation = ({
  tabs,
  activeIndex,
  onActiveIndexChange,
  theme,
  children,
}: DispatchMotorNavigationProps) => {
  const L = DISPATCH_FLOW_LABELS;
  const brand = DISPATCH_BRAND;
  const palette = theme.palette;
  const safeIndex = Math.min(Math.max(activeIndex, 0), Math.max(tabs.length - 1, 0));
  const atStart = safeIndex <= 0;
  const atEnd = safeIndex >= tabs.length - 1;

  return (
    <Stack spacing={1.25}>
      {tabs.length > 1 ? (
        <Box
          sx={{
            border: `1px solid ${palette.border}`,
            borderRadius: 2,
            px: 1.5,
            py: 1.1,
            background: palette.surface,
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}>
            <Button
              variant="outlined"
              size="small"
              disabled={atStart}
              onClick={() => onActiveIndexChange(Math.max(0, safeIndex - 1))}
              sx={{ textTransform: "none", minWidth: 80, fontWeight: 700 }}
            >
              {L.navBack}
            </Button>
            <Typography sx={{ fontSize: "0.84rem", fontWeight: 700, color: palette.primary }}>
              {L.motorCardTitle} {safeIndex + 1} of {tabs.length}
            </Typography>
            <Button
              variant="outlined"
              size="small"
              disabled={atEnd}
              onClick={() => onActiveIndexChange(Math.min(tabs.length - 1, safeIndex + 1))}
              sx={{ textTransform: "none", minWidth: 80, fontWeight: 700 }}
            >
              {L.navNext}
            </Button>
          </Stack>
        </Box>
      ) : null}

      {tabs.length > 0 ? (
        <Box
          sx={{
            border: `1px solid ${palette.border}`,
            borderRadius: 2,
            px: 1.5,
            py: 1.1,
            background: palette.surface,
          }}
        >
          <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: palette.primary, mb: 0.5 }}>
            {L.motorNavTitle}
          </Typography>
          <Typography sx={{ fontSize: "0.74rem", color: palette.textSub, mb: 1 }}>
            {L.motorNavHint}
          </Typography>
          <Stack direction="row" spacing={1} sx={{ overflowX: "auto", pb: 0.5 }}>
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
                  fontWeight: 700,
                  ...(index === safeIndex
                    ? {
                        background: `linear-gradient(135deg, ${brand.primary}, ${brand.primaryLight})`,
                        "&:hover": {
                          background: `linear-gradient(135deg, ${brand.primary}, ${brand.primaryLight})`,
                        },
                      }
                    : {}),
                }}
              >
                {tab.label}
              </Button>
            ))}
          </Stack>
        </Box>
      ) : null}

      <Box key={tabs[safeIndex]?.id}>{children}</Box>
    </Stack>
  );
};

export default DispatchMotorNavigation;
