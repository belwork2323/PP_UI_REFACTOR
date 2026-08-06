import React from "react";
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  SxProps,
  Theme,
} from "@mui/material";
import DateRangeRow from "@ui/components/common/DateRangeRow";

export interface DateFilterStrings {
  LABEL: string;
  TODAY: string;
  THIS_WEEK: string;
  THIS_MONTH: string;
  CUSTOM: string;
  START_DATE: string;
  END_DATE: string;
  APPLY?: string;
  CLEAR?: string;
  VALUES: { DAY: string; WEEK: string; MONTH: string; CUSTOM: string };
}

interface DashboardDateFilterProps {
  filterType: string;
  onFilterChange: (v: string) => void;
  customStartDate: string;
  onStartChange: (v: string) => void;
  customEndDate: string;
  onEndChange: (v: string) => void;
  /** Called when Apply is clicked for a complete custom range. */
  onApplyCustom?: () => void;
  /** Resets the date filter to the default month range. */
  onClearFilter?: () => void;
  strings: DateFilterStrings;
  loading?: boolean;
  containerSx?: SxProps<Theme>;
  selectSx?: SxProps<Theme>;
  menuProps?: React.ComponentProps<typeof Select>["MenuProps"];
  menuItemSx?: SxProps<Theme>;
  textFieldSx?: SxProps<Theme>;
  applyButtonSx?: SxProps<Theme>;
  clearButtonSx?: SxProps<Theme>;
}

/** Human-readable label for the active date filter (e.g. chip on FilterToggleButton). */
export function getDateFilterDisplayLabel(
  filterType: string,
  strings: Pick<DateFilterStrings, "TODAY" | "THIS_WEEK" | "THIS_MONTH" | "CUSTOM" | "VALUES">,
): string {
  if (filterType === strings.VALUES.DAY) return strings.TODAY;
  if (filterType === strings.VALUES.WEEK) return strings.THIS_WEEK;
  if (filterType === strings.VALUES.MONTH) return strings.THIS_MONTH;
  if (filterType === strings.VALUES.CUSTOM) return strings.CUSTOM;
  return filterType;
}

const FILTER_CONTROL_HEIGHT = 36;

const heightOverrideSx = {
  "& .MuiOutlinedInput-root": {
    height: FILTER_CONTROL_HEIGHT,
    minHeight: FILTER_CONTROL_HEIGHT,
  },
  "& .MuiInputBase-input": {
    py: 0,
    fontSize: "0.8125rem",
  },
  "& .MuiInputLabel-root": {
    fontSize: "0.8125rem",
  },
  "& .MuiInputLabel-root:not(.MuiInputLabel-shrink)": {
    transform: "translate(14px, 8px) scale(1)",
  },
  "& .MuiSelect-select": {
    display: "flex",
    alignItems: "center",
    py: 0,
    boxSizing: "border-box",
  },
};

const actionButtonSx: SxProps<Theme> = {
  textTransform: "none",
  fontWeight: 700,
  px: 1.75,
  height: FILTER_CONTROL_HEIGHT,
  minHeight: FILTER_CONTROL_HEIGHT,
  py: 0,
  fontSize: "0.8125rem",
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
  const isDefaultMonth = filterType === s.VALUES.MONTH;
  const canApplyCustom =
    isCustom &&
    customStartDate.length === 10 &&
    customEndDate.length === 10 &&
    Boolean(onApplyCustom);

  return (
    <Box
      sx={
        {
          display: "flex",
          gap: 1.5,
          alignItems: "center",
          flexWrap: "wrap",
          ...(containerSx as object),
        } as any
      }
    >
      <FormControl
        size="small"
        sx={
          {
            minWidth: 150,
            my: 0,
            // Theme colors first, then force medium control height last
            // so nested `& .MuiOutlinedInput-root` from selectSx cannot wipe height.
            ...(selectSx as object),
            ...heightOverrideSx,
          } as any
        }
      >
        <InputLabel>{s.LABEL}</InputLabel>
        <Select
          value={filterType}
          label={s.LABEL}
          onChange={(e) => onFilterChange(e.target.value)}
          MenuProps={menuProps}
          disabled={loading}
        >
          <MenuItem value={s.VALUES.DAY} sx={menuItemSx}>
            {s.TODAY}
          </MenuItem>
          <MenuItem value={s.VALUES.MONTH} sx={menuItemSx}>
            {s.THIS_MONTH}
          </MenuItem>
          <MenuItem value={s.VALUES.CUSTOM} sx={menuItemSx}>
            {s.CUSTOM}
          </MenuItem>
        </Select>
      </FormControl>

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
          controlHeight={FILTER_CONTROL_HEIGHT}
          datePickerSx={textFieldSx}
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
          disabled={loading || isDefaultMonth}
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
