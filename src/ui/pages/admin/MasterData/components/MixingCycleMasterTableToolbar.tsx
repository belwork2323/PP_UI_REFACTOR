import { Box, InputAdornment, TextField } from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import { icons } from "@app/theme/icons";
import { STRINGS } from "@app/config/strings";
import AppDropdown from "@ui/components/common/AppDropdown";
import RefreshIconButton from "@ui/components/common/RefreshIconButton";
import type { AppDropdownOption } from "@ui/components/common/AppDropdown";

const S = STRINGS.MASTER_DATA;

type Props = {
  search: string;
  onSearchChange: (value: string) => void;
  motorStageFilter: string;
  onMotorStageFilterChange: (value: string) => void;
  motorStageOptions: AppDropdownOption[];
  motorStageLoading?: boolean;
  onRefresh: () => void;
  refreshDisabled?: boolean;
  t: any;
};

const MixingCycleMasterTableToolbar = ({
  search,
  onSearchChange,
  motorStageFilter,
  onMotorStageFilterChange,
  motorStageOptions,
  motorStageLoading = false,
  onRefresh,
  refreshDisabled = false,
  t,
}: Props) => {
  const searchTheme = t.batchListShell?.inputs;

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
        placeholder={S.MIXING_CYCLES.SEARCH_PLACEHOLDER}
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
      <Box sx={{ minWidth: 180, maxWidth: 240, flex: "0 0 220px" }}>
        <AppDropdown
          label={S.MIXING_CYCLES.MOTOR_STAGE_FILTER_LABEL}
          value={motorStageFilter}
          onChange={onMotorStageFilterChange}
          options={motorStageOptions}
          loading={motorStageLoading}
          placeholder={S.MIXING_CYCLES.MOTOR_STAGE_FILTER_PLACEHOLDER}
          filterPanel
          fullWidth
          sx={{ ...t.filterPanel?.field, mb: 0 }}
          itemSx={t.filterPanel?.menuItem}
          InputLabelProps={{ shrink: true }}
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

export default MixingCycleMasterTableToolbar;
