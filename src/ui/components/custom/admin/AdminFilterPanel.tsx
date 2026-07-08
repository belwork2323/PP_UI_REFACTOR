import type { ReactNode } from "react";
import { Button, Stack } from "@mui/material";
import FilterPanelHeader from "@ui/components/common/FilterPanelHeader";

type AdminFilterPanelProps = {
  title: string;
  activeFilterCount: number;
  onClear: () => void;
  clearLabel: string;
  onClose: () => void;
  onApply: () => void;
  closeLabel: string;
  applyLabel: string;
  children: ReactNode;
  theme: {
    filterToggle: {
      filterPanelHeader: object;
      filterBtnIcon: object;
      filterLabel: object;
      filterBadge: object;
      clearChip: object;
    };
    filterPanel: {
      extension: object;
      closeButton: object;
      applyButton: object;
    };
  };
};

const AdminFilterPanel = ({
  title,
  activeFilterCount,
  onClear,
  clearLabel,
  onClose,
  onApply,
  closeLabel,
  applyLabel,
  children,
  theme,
}: AdminFilterPanelProps) => {
  const { filterToggle, filterPanel } = theme;

  return (
    <Stack spacing={1.5} sx={filterPanel.extension}>
      <FilterPanelHeader
        title={title}
        count={activeFilterCount}
        onClear={onClear}
        clearLabel={clearLabel}
        containerSx={filterToggle.filterPanelHeader}
        iconSx={filterToggle.filterBtnIcon}
        labelSx={filterToggle.filterLabel}
        badgeSx={filterToggle.filterBadge}
        clearChipSx={filterToggle.clearChip}
      />

      {children}

      <Stack direction="row" justifyContent="flex-end" spacing={1}>
        <Button variant="outlined" size="small" onClick={onClose} sx={filterPanel.closeButton}>
          {closeLabel}
        </Button>
        <Button variant="contained" size="small" onClick={onApply} sx={filterPanel.applyButton}>
          {applyLabel}
        </Button>
      </Stack>
    </Stack>
  );
};

export default AdminFilterPanel;
