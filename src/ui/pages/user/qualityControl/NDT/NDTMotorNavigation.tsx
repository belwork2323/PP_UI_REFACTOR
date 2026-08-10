import type { ReactNode } from "react";
import { Box, Stack } from "@mui/material";
import { NDT_FLOW_LABELS } from "../../../../../hooks/user/qualityControl/ndtFlowConfig";
import getQualityControlTheme from "../../../../../app/theme/custom_themes/user/qualityControl/qualityControl_theme";
import {
  UserWorkflowNavPanel,
  UserWorkflowTabNav,
} from "../../../../components/custom/UserWorkflowStepPager";

type NDTMotorNavigationProps = {
  tabs: Array<{ id: string; label: string }>;
  activeIndex: number;
  onActiveIndexChange: (index: number) => void;
  theme: ReturnType<typeof getQualityControlTheme>;
  children: ReactNode;
};

const NDTMotorNavigation = ({
  tabs,
  activeIndex,
  onActiveIndexChange,
  theme,
  children,
}: NDTMotorNavigationProps) => {
  const L = NDT_FLOW_LABELS;
  const brand = theme.qualityControl.ndt.brand;
  const palette = theme.palette;
  const safeIndex = Math.min(Math.max(activeIndex, 0), Math.max(tabs.length - 1, 0));

  const navPalette = {
    primary: brand.primary,
    primaryLight: brand.primaryLight,
    border: palette.border,
    surface: palette.surface,
    textSub: palette.textSub,
    text: palette.text,
  };

  return (
    <Stack spacing={1.25}>
      {tabs.length > 0 ? (
        <UserWorkflowNavPanel palette={navPalette}>
          <UserWorkflowTabNav
            title={L.motorNavTitle}
            hint={L.motorNavHint}
            tabs={tabs}
            activeIndex={safeIndex}
            onActiveIndexChange={onActiveIndexChange}
            palette={navPalette}
            showStepArrows
            wrapTabs
            titleEndAdornment={
              tabs.length > 1 ? (
                <Box component="span" sx={{ fontSize: "0.72rem", fontWeight: 600, color: palette.textSub }}>
                  {L.motorCardTitle} {safeIndex + 1} of {tabs.length}
                </Box>
              ) : null
            }
          />
        </UserWorkflowNavPanel>
      ) : null}

      <Box key={tabs[safeIndex]?.id}>{children}</Box>
    </Stack>
  );
};

export default NDTMotorNavigation;
