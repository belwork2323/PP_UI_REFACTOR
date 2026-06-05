import React from "react";
import { FormControl, InputLabel, Select, MenuItem, SxProps, Theme } from "@mui/material";

interface FilterSelectProps {
  label: string;
  value: string;
  onChange: (e: any) => void;
  options: string[];
  sx?: SxProps<Theme>;
  menuProps?: React.ComponentProps<typeof Select>["MenuProps"];
  itemSx?: SxProps<Theme>;
  showAllOption?: boolean;
}

const FilterSelect = ({
  label, value, onChange, options,
  sx = {}, menuProps, itemSx, showAllOption = true,
}: FilterSelectProps) => (
  <FormControl size="small" sx={{ minWidth: 140, ...sx }}>
    <InputLabel>{label}</InputLabel>
    <Select value={value} label={label} onChange={onChange} MenuProps={menuProps}>
      {showAllOption && <MenuItem value="All">All {label}s</MenuItem>}
      {options.map((option) => (
        <MenuItem key={option} value={option} sx={itemSx}>
          {option}
        </MenuItem>
      ))}
    </Select>
  </FormControl>
);

export default FilterSelect;