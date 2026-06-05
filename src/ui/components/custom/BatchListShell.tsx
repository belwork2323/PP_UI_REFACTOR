import { type ElementType, type ReactNode } from "react";

import FilterListRoundedIcon from "@mui/icons-material/FilterListRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import {
  Box,
  Chip,
  CircularProgress,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import AppButton from "../common/Button";

export type BatchListShellFilterField = {
  field: string;
  label: string;
  minWidth?: number;
  options: string[];
};

export type BatchListShellStatusMeta = Record<
  string,
  {
    color?: string;
    label?: string;
  }
>;

type BatchListShellTheme = {
  sections: {
    emptyWrap: Record<string, unknown>;
    filterContainer: Record<string, unknown>;
    filterStack: Record<string, unknown>;
    listWrap: Record<string, unknown>;
    loadingWrap: Record<string, unknown>;
    resultsWrap: Record<string, unknown>;
    root: Record<string, unknown>;
    statusStack: Record<string, unknown>;
  };
  empty: {
    icon: Record<string, unknown>;
    subtitle: Record<string, unknown>;
    title: Record<string, unknown>;
  };
  inputs: {
    filter: Record<string, unknown>;
    menuItem: Record<string, unknown>;
    search: Record<string, unknown>;
    startIcon: {
      filter: Record<string, unknown>;
      search: Record<string, unknown>;
    };
  };
  loading: {
    spinner: Record<string, unknown>;
  };
  results: {
    icon: Record<string, unknown>;
    text: Record<string, unknown>;
  };
  statusTab: {
    button: (isActive: boolean, meta?: BatchListShellStatusMeta[string]) => Record<string, unknown>;
    countChip: (isActive: boolean, meta?: BatchListShellStatusMeta[string]) => Record<string, unknown>;
  };
};

type BatchListShellProps = {
  activeStatus: string;
  children: ReactNode;
  emptyIcon: ElementType;
  emptySubtitle: string;
  emptyTitle: string;
  filterFields?: BatchListShellFilterField[];
  filterValues?: Record<string, string>;
  hasItems: boolean;
  loading?: boolean;
  onFilterChange?: (field: string, value: string) => void;
  onSearchChange: (value: string) => void;
  onStatusChange?: (value: string) => void;
  resultIcon: ElementType;
  resultText: string;
  /** Renders at the end of the search field row (e.g. filter toggle) */
  searchBarEnd?: ReactNode;
  /** Renders below the search / filter row inside the filter card */
  filterExtension?: ReactNode;
  searchPlaceholder: string;
  searchValue: string;
  /** Renders on the same row as status filter tabs (e.g. primary action button) */
  statusToolbarEnd?: ReactNode;
  statusCounts?: Record<string, number>;
  statusMeta?: BatchListShellStatusMeta;
  statusTabs?: string[];
  theme: BatchListShellTheme;
};

const BatchListShell = ({
  activeStatus,
  children,
  emptyIcon: EmptyIcon,
  emptySubtitle,
  emptyTitle,
  filterFields = [],
  filterValues = {},
  hasItems,
  loading = false,
  onFilterChange,
  onSearchChange,
  onStatusChange,
  resultIcon: ResultIcon,
  resultText,
  searchPlaceholder,
  searchValue,
  searchBarEnd,
  filterExtension,
  statusCounts = {},
  statusMeta = {},
  statusTabs = [],
  statusToolbarEnd,
  theme,
}: BatchListShellProps) => {
  return (
    <Box sx={theme.sections.root}>
      {statusTabs.length > 0 ? (
        <Stack {...theme.sections.statusStack} alignItems="center" justifyContent="space-between">
          <Stack direction="row" flexWrap="wrap" gap={1.5} sx={{ flex: 1, minWidth: 0 }}>
            {statusTabs.map((tab) => {
              const meta = statusMeta[tab];
              const isActive = activeStatus === tab;

              return (
                <AppButton
                  key={tab}
                  fullWidth={false}
                  size="small"
                  variant={isActive ? "contained" : "outlined"}
                  onClick={() => onStatusChange?.(tab)}
                  endIcon={
                    <Chip
                      label={statusCounts[tab] ?? 0}
                      size="small"
                      sx={theme.statusTab.countChip(isActive, meta)}
                    />
                  }
                  sx={theme.statusTab.button(isActive, meta)}
                >
                  {meta?.label ?? tab}
                </AppButton>
              );
            })}
          </Stack>
          {statusToolbarEnd ? (
            <Box sx={{ flexShrink: 0, display: "flex", alignItems: "center", ml: { xs: 0, sm: "auto" } }}>{statusToolbarEnd}</Box>
          ) : null}
        </Stack>
      ) : null}

      <Box sx={theme.sections.filterContainer}>
        <Stack {...theme.sections.filterStack}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ flex: { sm: 1 }, minWidth: { xs: "100%", sm: 260 } }}>
            <TextField
              size="small"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(event) => onSearchChange(event.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRoundedIcon sx={theme.inputs.startIcon.search} />
                  </InputAdornment>
                ),
              }}
              sx={{ ...theme.inputs.search, flex: 1, minWidth: 0 }}
            />
            {searchBarEnd}
          </Stack>

          {filterFields.map(({ field, label, minWidth, options }) => (
            <TextField
              key={field}
              select
              size="small"
              label={label}
              value={filterValues[field] ?? options[0] ?? ""}
              onChange={(event) => onFilterChange?.(field, event.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <FilterListRoundedIcon sx={theme.inputs.startIcon.filter} />
                  </InputAdornment>
                ),
              }}
              sx={{ ...theme.inputs.filter, minWidth: minWidth ?? theme.inputs.filter.minWidth }}
            >
              {options.map((option) => (
                <MenuItem key={option} value={option} sx={theme.inputs.menuItem}>
                  {option}
                </MenuItem>
              ))}
            </TextField>
          ))}

          <Box sx={theme.sections.resultsWrap}>
            <ResultIcon sx={theme.results.icon} />
            <Typography sx={theme.results.text}>{resultText}</Typography>
          </Box>
        </Stack>
        {filterExtension}
      </Box>

      {loading && !hasItems ? (
        <Box sx={theme.sections.loadingWrap}>
          <CircularProgress size={24} sx={theme.loading.spinner} />
        </Box>
      ) : null}

      {hasItems ? <Box sx={theme.sections.listWrap}>{children}</Box> : null}

      {!loading && !hasItems ? (
        <Box sx={theme.sections.emptyWrap}>
          <EmptyIcon sx={theme.empty.icon} />
          <Typography sx={theme.empty.title}>{emptyTitle}</Typography>
          <Typography sx={theme.empty.subtitle}>{emptySubtitle}</Typography>
        </Box>
      ) : null}
    </Box>
  );
};

export default BatchListShell;