import type { ReactNode } from "react";
import { Box } from "@mui/material";
import { STRINGS } from "../../../../../app/config/strings";
import { MIXING_BRAND } from "../../../../../app/theme/custom_themes/user/manufacturing/mixing_theme";
import UserWorkflowStepPager, {
  UserWorkflowNavPanel,
  UserWorkflowTabNav,
  type UserWorkflowNavTab,
} from "../../../../components/custom/UserWorkflowStepPager";

const S = STRINGS.MANUFACTURING.MIXING;
const BRAND = MIXING_BRAND;

export type MixingNavTab = UserWorkflowNavTab;

type MixingCardNavigationProps = {
  sectionTitle: string;
  sectionHint: string;
  /** Optional override; defaults to the active tab label (e.g. Premix 1). */
  counterLabel?: string;
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
  const activeTabLabel = tabs[safeIndex]?.label?.trim() || "";
  const resolvedCounter = counterLabel?.trim() || activeTabLabel;
  const palette = {
    primary: BRAND.mx,
    primaryLight: BRAND.mxLight,
    border: BRAND.border,
    surface: BRAND.surface,
    textSub: BRAND.textSub,
    text: BRAND.text,
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
      <UserWorkflowStepPager
        current={safeIndex + 1}
        total={tabs.length}
        counterLabel={resolvedCounter}
        backLabel={S.NAV_BACK}
        nextLabel={S.NAV_NEXT}
        onBack={() => onActiveIndexChange(Math.max(0, safeIndex - 1))}
        onNext={() => onActiveIndexChange(Math.min(tabs.length - 1, safeIndex + 1))}
        disableBack={safeIndex <= 0}
        disableNext={safeIndex >= tabs.length - 1}
        palette={palette}
      />

      <UserWorkflowNavPanel palette={palette}>
        <UserWorkflowTabNav
          title={sectionTitle}
          hint={sectionHint}
          tabs={tabs}
          activeIndex={safeIndex}
          onActiveIndexChange={onActiveIndexChange}
          palette={palette}
        />
      </UserWorkflowNavPanel>

      <Box key={tabs[safeIndex]?.id}>{children}</Box>
    </Box>
  );
};

export default MixingCardNavigation;
