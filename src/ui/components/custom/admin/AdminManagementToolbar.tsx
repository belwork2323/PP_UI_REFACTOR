import type { ReactNode } from "react";
import { Box, Button, Fade, Stack } from "@mui/material";
import Input from "@ui/components/common/Input";
import { icons } from "@app/theme/icons";

type AdminManagementToolbarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  searchIcon?: ReactNode;
  filterStartIcon?: ReactNode;
  filterOpen: boolean;
  onFilterToggle: () => void;
  filtersButtonLabel: string;
  filterContent?: ReactNode;
  toolbarEnd?: ReactNode;
  theme: {
    toolbar: {
      wrapper: object;
      searchField: object;
      searchIcon?: object;
      filterButtonActive: object;
      filterButtonInactive: object;
      filterRow: object;
    };
  };
};

const AdminManagementToolbar = ({
  search,
  onSearchChange,
  searchPlaceholder,
  searchIcon,
  filterStartIcon,
  filterOpen,
  onFilterToggle,
  filtersButtonLabel,
  filterContent,
  toolbarEnd,
  theme,
}: AdminManagementToolbarProps) => {
  const { toolbar } = theme;

  return (
    <Box sx={toolbar.wrapper}>
      <Input
        size="small"
        placeholder={searchPlaceholder}
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        sx={toolbar.searchField}
        icon={searchIcon ?? <icons.userMgmt.search sx={toolbar.searchIcon} />}
      />

      <Button
        variant={filterOpen ? "contained" : "outlined"}
        startIcon={filterStartIcon ?? <icons.userMgmt.filter />}
        onClick={onFilterToggle}
        sx={filterOpen ? toolbar.filterButtonActive : toolbar.filterButtonInactive}
      >
        {filtersButtonLabel}
      </Button>

      {toolbarEnd}

      {filterOpen && filterContent && (
        <Fade in>
          <Stack direction="row" sx={toolbar.filterRow}>
            {filterContent}
          </Stack>
        </Fade>
      )}
    </Box>
  );
};

export default AdminManagementToolbar;
