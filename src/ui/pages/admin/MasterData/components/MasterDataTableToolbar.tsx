import { Box, InputAdornment, TextField } from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import { icons } from "@app/theme/icons";
import { STRINGS } from "@app/config/strings";
import RefreshIconButton from "@ui/components/common/RefreshIconButton";

const S = STRINGS.MASTER_DATA;

type Props = {
  search: string;
  onSearchChange: (value: string) => void;
  onRefresh: () => void;
  refreshDisabled?: boolean;
  searchPlaceholder?: string;
  t: any;
};

const MasterDataTableToolbar = ({
  search,
  onSearchChange,
  onRefresh,
  refreshDisabled = false,
  searchPlaceholder,
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
          minWidth: 0,
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchRoundedIcon sx={searchTheme?.startIcon?.search} />
            </InputAdornment>
          ),
        }}
      />
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
