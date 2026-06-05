import React from "react";
import {
  Box, FormControl, InputLabel, Select, MenuItem,
  CircularProgress, SxProps, Theme,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";

interface DateFilterStrings {
  LABEL:      string;
  TODAY:      string;
  THIS_WEEK:  string;
  THIS_MONTH: string;
  CUSTOM:     string;
  START_DATE: string;
  END_DATE:   string;
  VALUES: { DAY: string; WEEK: string; MONTH: string; CUSTOM: string };
}

interface DashboardDateFilterProps {
  filterType:       string;
  onFilterChange:   (v: string) => void;
  customStartDate:  string;
  onStartChange:    (v: string) => void;
  customEndDate:    string;
  onEndChange:      (v: string) => void;
  strings:          DateFilterStrings;
  loading?:         boolean;
  containerSx?:     SxProps<Theme>;
  selectSx?:        SxProps<Theme>;
  menuProps?:       React.ComponentProps<typeof Select>["MenuProps"];
  menuItemSx?:      SxProps<Theme>;
  textFieldSx?:     SxProps<Theme>;
}

/** DD-MM-YYYY → YYYY-MM-DD  (for the native date input value) */
const toInputValue = (ddmmyyyy: string): string => {
  if (!ddmmyyyy || ddmmyyyy.length !== 10) return "";
  const [dd, mm, yyyy] = ddmmyyyy.split("-");
  return `${yyyy}-${mm}-${dd}`;
};

/** YYYY-MM-DD → DD-MM-YYYY  (for state / API) */
const toApiDate = (yyyymmdd: string): string => {
  if (!yyyymmdd) return "";
  const [yyyy, mm, dd] = yyyymmdd.split("-");
  return `${dd}-${mm}-${yyyy}`;
};

const toDayjsValue = (ddmmyyyy: string) => {
  const input = toInputValue(ddmmyyyy);
  return input ? dayjs(input) : null;
};

function DashboardDateFilter({
  filterType, onFilterChange,
  customStartDate, onStartChange,
  customEndDate, onEndChange,
  strings: s,
  loading,
  containerSx,
  selectSx,
  menuProps,
  menuItemSx,
  textFieldSx,
}: DashboardDateFilterProps) {
  return (
    <Box sx={{ display: "flex", gap: 2, alignItems: "center", ...containerSx }}>
      <FormControl size="small" sx={{ minWidth: 150, ...selectSx }}>
        <InputLabel>{s.LABEL}</InputLabel>
        <Select
          value={filterType}
          label={s.LABEL}
          onChange={(e) => onFilterChange(e.target.value)}
          MenuProps={menuProps}
        >
          <MenuItem value={s.VALUES.DAY}    sx={menuItemSx}>{s.TODAY}</MenuItem>
          <MenuItem value={s.VALUES.WEEK}   sx={menuItemSx}>{s.THIS_WEEK}</MenuItem>
          <MenuItem value={s.VALUES.MONTH}  sx={menuItemSx}>{s.THIS_MONTH}</MenuItem>
          <MenuItem value={s.VALUES.CUSTOM} sx={menuItemSx}>{s.CUSTOM}</MenuItem>
        </Select>
      </FormControl>

      {filterType === s.VALUES.CUSTOM && (
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="en-gb">
          <DatePicker
            label={s.START_DATE}
            format="DD/MM/YYYY"
            value={toDayjsValue(customStartDate)}
            onChange={(value) => onStartChange(value ? toApiDate(value.format("YYYY-MM-DD")) : "")}
            slotProps={{
              textField: {
                size: "small",
                sx: textFieldSx,
              },
            }}
          />
          <DatePicker
            label={s.END_DATE}
            format="DD/MM/YYYY"
            value={toDayjsValue(customEndDate)}
            onChange={(value) => onEndChange(value ? toApiDate(value.format("YYYY-MM-DD")) : "")}
            slotProps={{
              textField: {
                size: "small",
                sx: textFieldSx,
              },
            }}
          />
        </LocalizationProvider>
      )}

      {loading && <CircularProgress size={24} />}
    </Box>
  );
}

export default DashboardDateFilter;
