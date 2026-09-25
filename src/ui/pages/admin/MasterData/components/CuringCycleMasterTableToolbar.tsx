import { Box, InputAdornment, TextField } from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import type { HTMLAttributes, ReactNode } from "react";
import { icons } from "@app/theme/icons";
import { STRINGS } from "@app/config/strings";
import AppSearchableDropdown from "@ui/components/common/AppSearchableDropdown";
import RefreshIconButton from "@ui/components/common/RefreshIconButton";
import type { AppDropdownOption } from "@ui/components/common/AppDropdown";

const S = STRINGS.MASTER_DATA;

type Props = {
  search: string;
  onSearchChange: (value: string) => void;
  projectFilter: string;
  onProjectFilterChange: (value: string) => void;
  projectOptions: AppDropdownOption[];
  projectLoading?: boolean;
  motorStageFilter: string;
  onMotorStageFilterChange: (value: string) => void;
  motorStageOptions: AppDropdownOption[];
  motorStageLoading?: boolean;
  onRefresh: () => void;
  refreshDisabled?: boolean;
  t: any;
  renderProjectOption?: (
    props: HTMLAttributes<HTMLLIElement>,
    option: AppDropdownOption,
  ) => ReactNode;
};

const CuringCycleMasterTableToolbar = ({
  search,
  onSearchChange,
  projectFilter,
  onProjectFilterChange,
  projectOptions,
  projectLoading = false,
  motorStageFilter,
  onMotorStageFilterChange,
  motorStageOptions,
  motorStageLoading = false,
  onRefresh,
  refreshDisabled = false,
  t,
  renderProjectOption,
}: Props) => {
  const searchTheme = t.batchListShell?.inputs;
  const filterFieldSx = { ...t.filterPanel?.field, mb: 0 };

  return (
    <Box
      sx={{
        ...t.tableSearchBar,
        display: "flex",
        alignItems: "center",
        gap: 1,
        flexWrap: "wrap",
      }}
    >
      <TextField
        size="small"
        fullWidth
        margin="none"
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder={S.CURING_CYCLES.SEARCH_PLACEHOLDER}
        sx={{
          ...(searchTheme?.search ?? t.searchField),
          m: 0,
          flex: 1,
          minWidth: 220,
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchRoundedIcon sx={searchTheme?.startIcon?.search} />
            </InputAdornment>
          ),
        }}
      />
      <Box sx={{ minWidth: 200, maxWidth: 280, flex: "0 0 240px" }}>
        <AppSearchableDropdown
          label={S.CURING_CYCLES.PROJECT_FILTER_LABEL}
          value={projectFilter}
          onChange={onProjectFilterChange}
          options={projectOptions}
          loading={projectLoading}
          placeholder={S.CURING_CYCLES.PROJECT_FILTER_PLACEHOLDER}
          filterPanel
          fullWidth
          size="small"
          sx={filterFieldSx}
          renderOption={
            renderProjectOption
              ? (props, option) => renderProjectOption(props, option)
              : undefined
          }
        />
      </Box>
      <Box sx={{ minWidth: 160, maxWidth: 220, flex: "0 0 180px" }}>
        <AppSearchableDropdown
          label={S.CURING_CYCLES.MOTOR_STAGE_FILTER_LABEL}
          value={motorStageFilter}
          onChange={onMotorStageFilterChange}
          options={motorStageOptions}
          loading={motorStageLoading}
          placeholder={S.CURING_CYCLES.MOTOR_STAGE_FILTER_PLACEHOLDER}
          filterPanel
          fullWidth
          size="small"
          sx={filterFieldSx}
        />
      </Box>
      <RefreshIconButton
        onClick={onRefresh}
        disabled={refreshDisabled}
        tooltip="Refresh"
        icon={<icons.projectMgmt.refresh />}
      />
    </Box>
  );
};

export default CuringCycleMasterTableToolbar;
