import React from "react";
import {
  Box,
  Button,
  CircularProgress,
  MenuItem,
  SxProps,
  Theme,
  type SelectProps,
} from "@mui/material";
import AppDropdown from "@ui/components/common/AppDropdown";
import DateRangeRow from "@ui/components/common/DateRangeRow";
import { APP_CONTROL_HEIGHT } from "@ui/components/common/fieldStyles";

export interface DateFilterStrings {
  LABEL: string;
  LAST_SIX_MONTHS: string;
  LAST_ONE_YEAR: string;
  CUSTOM: string;
  START_DATE: string;
  END_DATE: string;
  APPLY?: string;
  CLEAR?: string;
  VALUES: { SIX_MONTHS: string; ONE_YEAR: string; CUSTOM: string };
}

/** Default date filter for admin / system manager dashboards. */
export const DEFAULT_DATE_FILTER_TYPE = "one_year";

interface DashboardDateFilterProps {
  filterType: string;
  onFilterChange: (v: string) => void;
  customStartDate: string;
  onStartChange: (v: string) => void;
  customEndDate: string;
  onEndChange: (v: string) => void;
  /** Called when Apply is clicked for a complete custom range. */
  onApplyCustom?: () => void;
  /** Resets the date filter to the default range (last one year). */
  onClearFilter?: () => void;
  strings: DateFilterStrings;
  loading?: boolean;
  containerSx?: SxProps<Theme>;
  selectSx?: SxProps<Theme>;
  menuProps?: SelectProps["MenuProps"];
  menuItemSx?: SxProps<Theme>;
  textFieldSx?: SxProps<Theme>;
  applyButtonSx?: SxProps<Theme>;
  clearButtonSx?: SxProps<Theme>;
}

/** Human-readable label for the active date filter (e.g. chip on FilterToggleButton). */
export function getDateFilterDisplayLabel(
  filterType: string,
  strings: Pick<
    DateFilterStrings,
    "LAST_SIX_MONTHS" | "LAST_ONE_YEAR" | "CUSTOM" | "VALUES"
  >,
): string {
  if (filterType === strings.VALUES.SIX_MONTHS) return strings.LAST_SIX_MONTHS;
  if (filterType === strings.VALUES.ONE_YEAR) return strings.LAST_ONE_YEAR;
  if (filterType === strings.VALUES.CUSTOM) return strings.CUSTOM;
  return filterType;
}

const actionButtonSx: SxProps<Theme> = {
  textTransform: "none",
  fontWeight: 700,
  px: 1.75,
  height: APP_CONTROL_HEIGHT,
  minHeight: APP_CONTROL_HEIGHT,
  py: 0,
  fontSize: "0.8125rem",
  flexShrink: 0,
};

function DashboardDateFilter({
  filterType,
  onFilterChange,
  customStartDate,
  onStartChange,
  customEndDate,
  onEndChange,
  onApplyCustom,
  onClearFilter,
  strings: s,
  loading,
  containerSx,
  selectSx,
  menuProps,
  menuItemSx,
  textFieldSx,
  applyButtonSx,
  clearButtonSx,
}: DashboardDateFilterProps) {
  const isCustom = filterType === s.VALUES.CUSTOM;
  const isDefaultFilter = filterType === s.VALUES.ONE_YEAR;
  const canApplyCustom =
    isCustom &&
    customStartDate.length === 10 &&
    customEndDate.length === 10 &&
    Boolean(onApplyCustom);

  return (
    <Box
      sx={
        {
          ...(containerSx as object),
          display: "flex",
          flexDirection: "row",
          gap: 1.5,
          alignItems: "flex-end",
          flexWrap: { xs: "wrap", sm: "nowrap" },
        } as any
      }
    >
      <AppDropdown
        label={s.LABEL}
        value={filterType}
        onChange={onFilterChange}
        disabled={loading}
        fullWidth={false}
        renderValue={(value) => getDateFilterDisplayLabel(value, s)}
        MenuProps={menuProps}
        itemSx={menuItemSx}
        sx={
          {
            minWidth: 150,
            mb: 0,
            flexShrink: 0,
            ...(selectSx as object),
          } as any
        }
      >
        <MenuItem value={s.VALUES.SIX_MONTHS} sx={menuItemSx}>
          {s.LAST_SIX_MONTHS}
        </MenuItem>
        <MenuItem value={s.VALUES.ONE_YEAR} sx={menuItemSx}>
          {s.LAST_ONE_YEAR}
        </MenuItem>
        <MenuItem value={s.VALUES.CUSTOM} sx={menuItemSx}>
          {s.CUSTOM}
        </MenuItem>
      </AppDropdown>

      {isCustom && (
        <DateRangeRow
          from={customStartDate}
          to={customEndDate}
          onFromChange={onStartChange}
          onToChange={onEndChange}
          fromLabel={s.START_DATE}
          toLabel={s.END_DATE}
          separatorLabel="-"
          showLeadingIcon={false}
          nowrap
          alignInputs="filter"
          controlHeight={APP_CONTROL_HEIGHT}
          datePickerSx={{ mb: 0, ...(textFieldSx as object) }}
        />
      )}

      {isCustom && onApplyCustom && (
        <Button
          variant="contained"
          size="small"
          disabled={!canApplyCustom || loading}
          onClick={onApplyCustom}
          startIcon={loading ? <CircularProgress size={14} color="inherit" /> : undefined}
          sx={
            {
              ...(actionButtonSx as object),
              ...(applyButtonSx as object),
            } as any
          }
        >
          {s.APPLY ?? "Apply Filter"}
        </Button>
      )}

      {onClearFilter && (
        <Button
          variant="outlined"
          size="small"
          disabled={loading || isDefaultFilter}
          onClick={onClearFilter}
          sx={
            {
              ...(actionButtonSx as object),
              ...(clearButtonSx as object),
            } as any
          }
        >
          {s.CLEAR ?? "Clear Filter"}
        </Button>
      )}
    </Box>
  );
}

export default DashboardDateFilter;
