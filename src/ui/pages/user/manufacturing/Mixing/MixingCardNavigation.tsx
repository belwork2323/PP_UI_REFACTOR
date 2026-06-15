import type { ReactNode } from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import { STRINGS } from "../../../../../app/config/strings";
import { MIXING_BRAND } from "../../../../../app/theme/custom_themes/user/manufacturing/mixing_theme";

const S = STRINGS.MANUFACTURING.MIXING;
const BRAND = MIXING_BRAND;

export type MixingNavTab = {
  id: string;
  label: string;
};

type MixingCardNavigationProps = {
  sectionTitle: string;
  sectionHint: string;
  counterLabel: string;
  tabs: MixingNavTab[];
  activeIndex: number;
  onActiveIndexChange: (index: number) => void;
  children: ReactNode;
};

const MixingCardNavigation = ({
  sectionTitle,
  sectionHint,
  counterLabel,
  tabs,
  activeIndex,
  onActiveIndexChange,
  children,
}: MixingCardNavigationProps) => {
  const safeIndex = Math.min(Math.max(activeIndex, 0), Math.max(tabs.length - 1, 0));
  const atStart = safeIndex <= 0;
  const atEnd = safeIndex >= tabs.length - 1;

  return (
    <Stack spacing={1.25}>
      <Box
        sx={{
          border: `1px solid ${BRAND.border}`,
          borderRadius: 2,
          px: 1.2,
          py: 1,
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
            {S.NAV_BACK}
          </Button>
          <Typography sx={{ fontSize: "0.82rem", fontWeight: 700, color: BRAND.mx }}>
            {counterLabel}
          </Typography>
          <Button
            variant="outlined"
            size="small"
            disabled={atEnd}
            onClick={() => onActiveIndexChange(Math.min(tabs.length - 1, safeIndex + 1))}
            sx={{ textTransform: "none", minWidth: 72 }}
          >
            {S.NAV_NEXT}
          </Button>
        </Stack>
      </Box>

      <Box
        sx={{
          border: `1px solid ${BRAND.border}`,
          borderRadius: 2,
          px: 1,
          py: 1,
          background: BRAND.surface,
        }}
      >
        <Typography sx={{ fontSize: "0.76rem", fontWeight: 700, color: BRAND.mx, mb: 0.4 }}>
          {sectionTitle}
        </Typography>
        <Typography sx={{ fontSize: "0.72rem", color: BRAND.textSub, mb: 0.9 }}>
          {sectionHint}
        </Typography>
        <Stack direction="row" spacing={1} sx={{ overflowX: "auto", pb: 0.5 }}>
          {tabs.map((tab, index) => {
            const active = index === safeIndex;
            return (
              <Button
                key={tab.id}
                size="small"
                variant={active ? "contained" : "outlined"}
                onClick={() => onActiveIndexChange(index)}
                sx={{
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                  textTransform: "none",
                  ...(active
                    ? {
                        background: `linear-gradient(135deg, ${BRAND.mx}, ${BRAND.mxLight})`,
                        "&:hover": { background: `linear-gradient(135deg, ${BRAND.mx}, ${BRAND.mxLight})` },
                      }
                    : { borderColor: BRAND.border, color: BRAND.text }),
                }}
              >
                {tab.label}
              </Button>
            );
          })}
        </Stack>
      </Box>

      <Box key={tabs[safeIndex]?.id}>{children}</Box>
    </Stack>
  );
};

export default MixingCardNavigation;
