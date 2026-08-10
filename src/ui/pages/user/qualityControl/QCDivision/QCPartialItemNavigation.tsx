import { useMemo } from "react";
import { Box, Chip } from "@mui/material";
import { QC_DIVISION_BRAND } from "../../../../../app/theme/custom_themes/user/qualityControl/tokens";
import {
  PARTIAL_ITEM_STATUS_CHIP,
  getPartialNavHint,
  getPartialNavTitle,
  type QcPartialNavItem,
} from "../../../../../hooks/user/qualityControl/qcDivisionApprovalUnits";
import {
  UserWorkflowTabNav,
  type UserWorkflowNavTab,
} from "../../../../components/custom/UserWorkflowStepPager";

type QCPartialItemNavigationProps = {
  items: QcPartialNavItem[];
  activeIndex: number;
  onActiveIndexChange: (index: number) => void;
  loading?: boolean;
  isTabEnabled?: (index: number) => boolean;
  getTabDisabledReason?: (index: number) => string | undefined;
};

const QCPartialItemNavigation = ({
  items,
  activeIndex,
  onActiveIndexChange,
  loading = false,
  isTabEnabled,
  getTabDisabledReason,
}: QCPartialItemNavigationProps) => {
  const BRAND = QC_DIVISION_BRAND;
  if (!items.length) return null;

  const safeIndex = Math.min(Math.max(activeIndex, 0), items.length - 1);
  const title = getPartialNavTitle(items);
  const hint = getPartialNavHint(items);

  const navTabs = useMemo<UserWorkflowNavTab[]>(
    () =>
      items.map((item, index) => {
        const tone = PARTIAL_ITEM_STATUS_CHIP[item.status];
        const active = index === safeIndex;
        return {
          id: item.id,
          label: item.label,
          endAdornment: (
            <Chip
              label={tone.label}
              size="small"
              sx={{
                height: 18,
                fontSize: "0.62rem",
                fontWeight: 700,
                background: active ? "rgba(255,255,255,0.22)" : tone.bg,
                color: active ? "#fff" : tone.color,
                border: active
                  ? "1px solid rgba(255,255,255,0.35)"
                  : `1px solid ${tone.border}`,
                "& .MuiChip-label": { px: 0.6 },
              }}
            />
          ),
        };
      }),
    [items, safeIndex],
  );

  const navPalette = {
    primary: BRAND.primary,
    primaryLight: BRAND.primaryLight,
    border: BRAND.border,
    surface: BRAND.surface,
    textSub: BRAND.textSub,
    text: BRAND.text,
  };

  return (
    <Box
      sx={{
        mt: 2,
        opacity: loading ? 0.7 : 1,
        border: `1px solid ${BRAND.border}`,
        borderRadius: 2,
        px: 1.25,
        py: 1.1,
        background: BRAND.surface,
      }}
    >
      <UserWorkflowTabNav
        title={title}
        hint={hint}
        tabs={navTabs}
        activeIndex={safeIndex}
        onActiveIndexChange={onActiveIndexChange}
        palette={navPalette}
        showStepArrows
        wrapTabs
        disableStepBack={loading || safeIndex <= 0}
        disableStepNext={loading || safeIndex >= items.length - 1}
        isTabDisabled={(_tab, index) =>
          loading || (isTabEnabled ? !isTabEnabled(index) : false)
        }
        tabTooltip={(_tab, index) =>
          loading ? undefined : getTabDisabledReason?.(index)
        }
      />
    </Box>
  );
};

export default QCPartialItemNavigation;
