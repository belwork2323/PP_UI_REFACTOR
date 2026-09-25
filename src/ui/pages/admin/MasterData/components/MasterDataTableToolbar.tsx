import { Box, InputAdornment, TextField } from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import type { HTMLAttributes, ReactNode } from "react";
import { icons } from "@app/theme/icons";
import { STRINGS } from "@app/config/strings";
import RefreshIconButton from "@ui/components/common/RefreshIconButton";
import AppSearchableDropdown from "@ui/components/common/AppSearchableDropdown";
import type { AppDropdownOption } from "@ui/components/common/AppDropdown";

const S = STRINGS.MASTER_DATA;

type Props = {
  search: string;
  onSearchChange: (value: string) => void;
  onRefresh: () => void;
  refreshDisabled?: boolean;
  searchPlaceholder?: string;
  t: any;
  showMotorStageFilters?: boolean;
  projectFilter?: string;
  onProjectFilterChange?: (value: string) => void;
  projectOptions?: AppDropdownOption[];
  projectLoading?: boolean;
  motorStageFilter?: string;
  onMotorStageFilterChange?: (value: string) => void;
  motorStageOptions?: AppDropdownOption[];
  motorStageLoading?: boolean;
  renderProjectOption?: (
    props: HTMLAttributes<HTMLLIElement>,
    option: AppDropdownOption,
  ) => ReactNode;
};

const MasterDataTableToolbar = ({
  search,
  onSearchChange,
  onRefresh,
  refreshDisabled = false,
  searchPlaceholder,
  t,
  showMotorStageFilters = false,
  projectFilter = "",
  onProjectFilterChange,
  projectOptions = [],
  projectLoading = false,
  motorStageFilter = "",
  onMotorStageFilterChange,
  motorStageOptions = [],
  motorStageLoading = false,
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
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder={searchPlaceholder ?? S.TOOLBAR.SEARCH_PLACEHOLDER}
        sx={{
          ...(searchTheme?.search ?? t.searchField),
          m: 0,
          mb: 0,
          mt: 0,
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
      {showMotorStageFilters ? (
        <>
          <Box sx={{ minWidth: 200, maxWidth: 280, flex: "0 0 240px" }}>
            <AppSearchableDropdown
              label={S.MOTOR_STAGES.PROJECT_FILTER_LABEL}
              value={projectFilter}
              onChange={(value) => onProjectFilterChange?.(value)}
              options={projectOptions}
              loading={projectLoading}
              placeholder={S.MOTOR_STAGES.PROJECT_FILTER_PLACEHOLDER}
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
              label={S.MOTOR_STAGES.MOTOR_STAGE_FILTER_LABEL}
              value={motorStageFilter}
              onChange={(value) => onMotorStageFilterChange?.(value)}
              options={motorStageOptions}
              loading={motorStageLoading}
              placeholder={S.MOTOR_STAGES.MOTOR_STAGE_FILTER_PLACEHOLDER}
              filterPanel
              fullWidth
              size="small"
              sx={filterFieldSx}
            />
          </Box>
        </>
      ) : null}
      <RefreshIconButton
        onClick={onRefresh}
        disabled={refreshDisabled}
        tooltip="Refresh"
        icon={<icons.projectMgmt.refresh />}
      />
    </Box>
  );
};

export default MasterDataTableToolbar;
