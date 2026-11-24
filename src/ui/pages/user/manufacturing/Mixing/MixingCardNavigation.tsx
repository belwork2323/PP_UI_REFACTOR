import type { ReactNode } from "react";
import { Box } from "@mui/material";
import { MIXING_BRAND } from "../../../../../app/theme/custom_themes/user/manufacturing/mixing_theme";
import { UserWorkflowNavPanel } from "../../../../components/custom/UserWorkflowStepPager";
import {
  WorkflowUnitStatusTabNav,
  type WorkflowUnitStatusItem,
} from "../../../../components/custom/WorkflowUnitStatusTabNav";
import type { PremixStatusThemeConfig } from "../RawMaterial/components/PremixStatusChip";

const BRAND = MIXING_BRAND;

type MixingCardNavigationProps = {
  sectionTitle: string;
  sectionHint: string;
  units: WorkflowUnitStatusItem[];
  activeId: string | null;
  onActiveIdChange: (id: string) => void;
  getStatus: (id: string) => string | null | undefined;
  statusConfig: PremixStatusThemeConfig;
  isUnitDisabled?: (id: string) => boolean;
  unitTooltip?: (id: string) => string | undefined;
  children: ReactNode;
};

const MixingCardNavigation = ({
  sectionTitle,
  sectionHint,
  units,
  activeId,
  onActiveIdChange,
  getStatus,
  statusConfig,
  isUnitDisabled,
  unitTooltip,
  children,
}: MixingCardNavigationProps) => {
  const palette = {
    primary: BRAND.mx,
    primaryLight: BRAND.mxLight,
    border: BRAND.border,
    surface: BRAND.surface,
    textSub: BRAND.textSub,
    text: BRAND.text,
  };

  const enabledIds = units
    .map((unit) => unit.id)
    .filter((id) => !(isUnitDisabled?.(id) ?? false));
  const enabledPos = enabledIds.indexOf(activeId ?? "");

  const goToEnabled = (direction: -1 | 1) => {
    if (enabledIds.length === 0) return;
    const currentPos = Math.max(0, enabledPos);
    const nextPos = Math.min(
      enabledIds.length - 1,
      Math.max(0, currentPos + direction),
    );
    const nextId = enabledIds[nextPos];
    if (nextId) onActiveIdChange(nextId);
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
      <UserWorkflowNavPanel palette={palette}>
        <WorkflowUnitStatusTabNav
          title={sectionTitle}
          hint={sectionHint}
          units={units}
          activeId={activeId}
          onActiveIdChange={onActiveIdChange}
          getStatus={getStatus}
          statusConfig={statusConfig}
          palette={palette}
          showStepArrows
          onStepBack={() => goToEnabled(-1)}
          onStepNext={() => goToEnabled(1)}
          disableStepBack={enabledPos <= 0}
          disableStepNext={enabledPos < 0 || enabledPos >= enabledIds.length - 1}
          isUnitDisabled={isUnitDisabled}
          unitTooltip={unitTooltip}
        />
      </UserWorkflowNavPanel>

      <Box key={activeId ?? undefined}>{children}</Box>
    </Box>
  );
};

export default MixingCardNavigation;