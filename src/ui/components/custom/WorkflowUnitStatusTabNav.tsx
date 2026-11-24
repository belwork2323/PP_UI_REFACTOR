import { useMemo, type ReactNode } from "react";
import PremixStatusChip, {
  type PremixStatusThemeConfig,
} from "../../pages/user/manufacturing/RawMaterial/components/PremixStatusChip";
import {
  UserWorkflowTabNav,
  type UserWorkflowNavPalette,
  type UserWorkflowNavTab,
} from "./UserWorkflowStepPager";

export type WorkflowUnitStatusItem = {
  id: string;
  label: string;
};

export type WorkflowUnitStatusTabNavProps = {
  title: string;
  hint?: string;
  units: WorkflowUnitStatusItem[];
  activeId: string | null;
  onActiveIdChange: (id: string) => void;
  getStatus: (id: string) => string | null | undefined;
  statusConfig: PremixStatusThemeConfig;
  palette: UserWorkflowNavPalette;
  titleEndAdornment?: ReactNode;
  showStepArrows?: boolean;
  wrapTabs?: boolean;
  isUnitDisabled?: (id: string) => boolean;
  unitTooltip?: (id: string) => string | undefined;
  mb?: number | string;
  onStepBack?: () => void;
  onStepNext?: () => void;
  disableStepBack?: boolean;
  disableStepNext?: boolean;
};

/**
 * Shared unit/motor/premix/mix-card tab strip with always-visible status chips.
 * UI is common across subdepartments; callers only pass units + status data.
 */
export const WorkflowUnitStatusTabNav = ({
  title,
  hint,
  units,
  activeId,
  onActiveIdChange,
  getStatus,
  statusConfig,
  palette,
  titleEndAdornment,
  showStepArrows,
  wrapTabs,
  isUnitDisabled,
  unitTooltip,
  mb,
  onStepBack,
  onStepNext,
  disableStepBack,
  disableStepNext,
}: WorkflowUnitStatusTabNavProps) => {
  const activeIndex = useMemo(() => {
    if (!units.length) return 0;
    const idx = units.findIndex((u) => u.id === activeId);
    return idx >= 0 ? idx : 0;
  }, [activeId, units]);

  const tabs = useMemo<UserWorkflowNavTab[]>(
    () =>
      units.map((unit) => {
        const status = String(getStatus(unit.id) ?? "").trim() || "TO_BE_INITIATED";
        return {
          id: unit.id,
          label: unit.label,
          endAdornment: (
            <PremixStatusChip
              status={status as any}
              statusConfig={statusConfig}
              variant="embedded"
              onAccent={unit.id === activeId}
            />
          ),
        };
      }),
    [activeId, getStatus, statusConfig, units],
  );

  return (
    <UserWorkflowTabNav
      title={title}
      hint={hint}
      tabs={tabs}
      activeIndex={activeIndex}
      onActiveIndexChange={(index) => {
        const next = units[index];
        if (next) onActiveIdChange(next.id);
      }}
      palette={palette}
      mb={mb}
      titleEndAdornment={titleEndAdornment}
      showStepArrows={showStepArrows}
      wrapTabs={wrapTabs}
      onStepBack={onStepBack}
      onStepNext={onStepNext}
      disableStepBack={disableStepBack}
      disableStepNext={disableStepNext}
      isTabDisabled={
        isUnitDisabled
          ? (tab) => isUnitDisabled(tab.id)
          : undefined
      }
      tabTooltip={
        unitTooltip
          ? (tab) => unitTooltip(tab.id)
          : undefined
      }
    />
  );
};

export default WorkflowUnitStatusTabNav;
