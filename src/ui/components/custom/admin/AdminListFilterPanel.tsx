import type { ReactNode } from "react";
import { Button, Stack } from "@mui/material";
import FilterPanelHeader from "@ui/components/common/FilterPanelHeader";

type AdminListFilterPanelProps = {
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
      filterPanelIcon: object;
      filterPanelLabel: object;
      filterPanelBadge: object;
      filterPanelClearChip: object;
    };
    filterPanel: {
      extension: object;
      fieldsRow: object;
      closeButton: object;
      applyButton: object;
    };
  };
};

const AdminListFilterPanel = ({
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
}: AdminListFilterPanelProps) => {
  const { filterToggle, filterPanel } = theme;

  return (
    <Stack spacing={1.5} sx={filterPanel.extension}>
      <FilterPanelHeader
        title={title}
        count={activeFilterCount}
        onClear={onClear}
        clearLabel={clearLabel}
        containerSx={filterToggle.filterPanelHeader}
        iconSx={filterToggle.filterPanelIcon}
        labelSx={filterToggle.filterPanelLabel}
        badgeSx={filterToggle.filterPanelBadge}
        clearChipSx={filterToggle.filterPanelClearChip}
      />

      <Stack
        direction={{ xs: "column", lg: "row" }}
        spacing={1.25}
        flexWrap="wrap"
        useFlexGap
        alignItems="flex-end"
        sx={filterPanel.fieldsRow}
      >
        {children}
      </Stack>

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

export default AdminListFilterPanel;
