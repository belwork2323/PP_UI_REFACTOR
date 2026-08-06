import type { ReactNode } from "react";
import { Box } from "@mui/material";
import { MIXING_BRAND } from "../../../../../app/theme/custom_themes/user/manufacturing/mixing_theme";
import {
  UserWorkflowNavPanel,
  UserWorkflowTabNav,
  type UserWorkflowNavTab,
} from "../../../../components/custom/UserWorkflowStepPager";

const BRAND = MIXING_BRAND;

export type MixingNavTab = UserWorkflowNavTab;

type MixingCardNavigationProps = {
  sectionTitle: string;
  sectionHint: string;
  /** Optional override; kept for call-site compatibility (unused after pager removal). */
  counterLabel?: string;
  tabs: MixingNavTab[];
  activeIndex: number;
  onActiveIndexChange: (index: number) => void;
  isTabDisabled?: (tab: MixingNavTab, index: number) => boolean;
  tabTooltip?: (tab: MixingNavTab, index: number) => string | undefined;
  children: ReactNode;
};

const MixingCardNavigation = ({
  sectionTitle,
  sectionHint,
  tabs,
  activeIndex,
  onActiveIndexChange,
  isTabDisabled,
  tabTooltip,
  children,
}: MixingCardNavigationProps) => {
  const safeIndex = Math.min(Math.max(activeIndex, 0), Math.max(tabs.length - 1, 0));
  const palette = {
    primary: BRAND.mx,
    primaryLight: BRAND.mxLight,
    border: BRAND.border,
    surface: BRAND.surface,
    textSub: BRAND.textSub,
    text: BRAND.text,
  };

  const enabledIndexes = tabs
    .map((_, index) => index)
    .filter((index) => !(isTabDisabled?.(tabs[index], index) ?? false));
  const enabledPos = enabledIndexes.indexOf(safeIndex);

  const goToEnabled = (direction: -1 | 1) => {
    if (enabledIndexes.length === 0) return;
    const currentPos = Math.max(0, enabledPos);
    const nextPos = Math.min(
      enabledIndexes.length - 1,
      Math.max(0, currentPos + direction),
    );
    onActiveIndexChange(enabledIndexes[nextPos]);
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
      <UserWorkflowNavPanel palette={palette}>
        <UserWorkflowTabNav
          title={sectionTitle}
          hint={sectionHint}
          tabs={tabs}
          activeIndex={safeIndex}
          onActiveIndexChange={onActiveIndexChange}
          palette={palette}
          showStepArrows
          onStepBack={() => goToEnabled(-1)}
          onStepNext={() => goToEnabled(1)}
          disableStepBack={enabledPos <= 0}
          disableStepNext={enabledPos < 0 || enabledPos >= enabledIndexes.length - 1}
          isTabDisabled={isTabDisabled}
          tabTooltip={tabTooltip}
        />
      </UserWorkflowNavPanel>

      <Box key={tabs[safeIndex]?.id}>{children}</Box>
    </Box>
  );
};

export default MixingCardNavigation;
