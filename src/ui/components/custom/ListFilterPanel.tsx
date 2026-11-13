import { useMemo, type ReactNode } from "react";
import { Stack, type StackProps } from "@mui/material";
import { RefreshRounded } from "@mui/icons-material";

import { STRINGS } from "@app/config/strings";
import {
  getListFilterPanelTheme,
  type ListFilterPanelPalette,
} from "@app/theme/custom_themes/shared/listFilterPanel_theme";
import AppButton from "@ui/components/common/Button";
import FilterPanelHeader from "@ui/components/common/FilterPanelHeader";
import FilterToggleButton from "@ui/components/common/FilterToggleButton";
import RefreshIconButton from "@ui/components/common/RefreshIconButton";

const BL = STRINGS.SOURCING.BATCH_LIST;

type ListFilterToolbarProps = {
  palette: ListFilterPanelPalette;
  activeCount: number;
  isOpen: boolean;
  onToggle: () => void;
  /** Refresh button is hidden when omitted. */
  onRefresh?: () => void;
  refreshDisabled?: boolean;
};

/** Filter toggle plus refresh button shown at the end of a list search bar. */
export const ListFilterToolbar = ({
  palette,
  activeCount,
  isOpen,
  onToggle,
  onRefresh,
  refreshDisabled = false,
}: ListFilterToolbarProps) => {
  const { toggle } = useMemo(() => getListFilterPanelTheme(palette), [palette]);

  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <FilterToggleButton
        label={BL.FILTERS_TOGGLE}
        count={activeCount}
        isOpen={isOpen}
        onClick={onToggle}
        sx={toggle.button(isOpen || activeCount > 0)}
        iconSx={toggle.icon}
        textSx={toggle.text}
        badgeSx={toggle.badge}
        chevronSx={toggle.chevron}
      />
      {onRefresh ? (
        <RefreshIconButton
          onClick={onRefresh}
          disabled={refreshDisabled}
          tooltip={BL.REFRESH_TOOLTIP}
          icon={<RefreshRounded fontSize="small" />}
        />
      ) : null}
    </Stack>
  );
};

const DEFAULT_FIELD_ROW_PROPS: StackProps = {
  direction: { xs: "column", lg: "row" },
  spacing: 1.25,
  flexWrap: "wrap",
  useFlexGap: true,
};

type ListFilterPanelProps = {
  palette: ListFilterPanelPalette;
  title: string;
  activeCount: number;
  onClear: () => void;
  onClose: () => void;
  onApply: () => void;
  /** Layout of the row wrapping the filter fields. */
  fieldRowProps?: StackProps;
  applyButtonSx?: Record<string, unknown>;
  /** The subdepartment's filter fields. */
  children: ReactNode;
};

/** Collapsible list filter panel: header with clear chip, field row, close / apply actions. */
const ListFilterPanel = ({
  palette,
  title,
  activeCount,
  onClear,
  onClose,
  onApply,
  fieldRowProps = DEFAULT_FIELD_ROW_PROPS,
  applyButtonSx,
  children,
}: ListFilterPanelProps) => {
  const { panel } = useMemo(() => getListFilterPanelTheme(palette), [palette]);

  return (
    <Stack spacing={1.5} sx={panel.root}>
      <FilterPanelHeader
        title={title}
        count={activeCount}
        onClear={onClear}
        clearLabel={BL.FILTERS_CLEAR}
        containerSx={panel.header.container}
        iconSx={panel.header.icon}
        labelSx={panel.header.label}
        badgeSx={panel.header.badge}
        clearChipSx={panel.header.clearChip}
      />

      <Stack {...fieldRowProps}>{children}</Stack>

      <Stack direction="row" justifyContent="flex-end" spacing={1}>
        <AppButton
          variant="outlined"
          size="small"
          fullWidth={false}
          onClick={onClose}
          sx={panel.closeButton}
        >
          {BL.FILTERS_CLOSE_PANEL}
        </AppButton>
        <AppButton
          variant="contained"
          size="small"
          fullWidth={false}
          onClick={onApply}
          sx={applyButtonSx ?? panel.applyButton}
        >
          {BL.FILTERS_APPLY}
        </AppButton>
      </Stack>
    </Stack>
  );
};

export default ListFilterPanel;
