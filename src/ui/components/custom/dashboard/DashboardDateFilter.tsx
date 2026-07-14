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

interface DateFilterStrings {
  LABEL: string;
  TODAY: string;
  THIS_WEEK: string;
  THIS_MONTH: string;
  CUSTOM: string;
  START_DATE: string;
  END_DATE: string;
  APPLY?: string;
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
  strings: DateFilterStrings;
  loading?: boolean;
  containerSx?: SxProps<Theme>;
  selectSx?: SxProps<Theme>;
  menuProps?: React.ComponentProps<typeof Select>["MenuProps"];
  menuItemSx?: SxProps<Theme>;
  textFieldSx?: SxProps<Theme>;
  applyButtonSx?: SxProps<Theme>;
}

function DashboardDateFilter({
  filterType,
  onFilterChange,
  customStartDate,
  onStartChange,
  customEndDate,
  onEndChange,
  onApplyCustom,
  strings: s,
  loading,
  containerSx,
  selectSx,
  menuProps,
  menuItemSx,
  textFieldSx,
  applyButtonSx,
}: DashboardDateFilterProps) {
  const isCustom = filterType === s.VALUES.CUSTOM;
  const canApplyCustom =
    isCustom && customStartDate.length === 10 && customEndDate.length === 10 && Boolean(onApplyCustom);

  return (
    <Box sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap", ...containerSx }}>
      <FormControl size="small" sx={{ minWidth: 150, ...selectSx }}>
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
        <>
          <DateRangeRow
            from={customStartDate}
            to={customEndDate}
            onFromChange={onStartChange}
            onToChange={onEndChange}
            fromLabel={s.START_DATE}
            toLabel={s.END_DATE}
            separatorLabel="-"
            datePickerSx={textFieldSx}
          />
          {onApplyCustom && (
            <Button
              variant="contained"
              size="small"
              disabled={!canApplyCustom || loading}
              onClick={onApplyCustom}
              startIcon={loading ? <CircularProgress size={14} color="inherit" /> : undefined}
              sx={{ textTransform: "none", fontWeight: 700, px: 2, ...applyButtonSx }}
            >
              {s.APPLY ?? "Apply Filter"}
            </Button>
          )}
        </>
      )}
    </Box>
  );
}

export default DashboardDateFilter;
