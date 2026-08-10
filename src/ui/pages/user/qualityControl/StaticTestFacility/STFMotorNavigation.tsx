import type { ReactNode } from "react";
import { Box, Stack } from "@mui/material";
import { STF_FLOW_LABELS } from "../../../../../hooks/user/qualityControl/stfFlowConfig";
import { STATIC_TEST_FACILITY_BRAND } from "../../../../../app/theme/custom_themes/user/qualityControl/tokens";
import {
  UserWorkflowNavPanel,
  UserWorkflowTabNav,
} from "../../../../components/custom/UserWorkflowStepPager";

type STFMotorNavigationProps = {
  tabs: Array<{ id: string; label: string }>;
  activeIndex: number;
  onActiveIndexChange: (index: number) => void;
  motorType: "MAIN_MOTOR" | "BEM";
  theme: any;
  children: ReactNode;
};

const STFMotorNavigation = ({
  tabs,
  activeIndex,
  onActiveIndexChange,
  motorType,
  theme,
  children,
}: STFMotorNavigationProps) => {
  const L = STF_FLOW_LABELS;
  const brand = STATIC_TEST_FACILITY_BRAND;
  const palette = theme.palette;
  const safeIndex = Math.min(Math.max(activeIndex, 0), Math.max(tabs.length - 1, 0));
  const cardTitle = motorType === "BEM" ? L.bemCardTitle : L.motorCardTitle;

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
                  {cardTitle} {safeIndex + 1} of {tabs.length}
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

export default STFMotorNavigation;
