import React from "react";
import { FormControl, InputLabel, Select, MenuItem, SxProps, Theme } from "@mui/material";

export type FilterSelectOption = { value: string; label: string };

interface FilterSelectProps {
  label: string;
  value: string;
  onChange: (e: any) => void;
  /** Simple string options (value and label are the same). */
  options?: string[];
  /** Value/label options — preferred when the API needs an id. */
  optionItems?: FilterSelectOption[];
  sx?: SxProps<Theme>;
  menuProps?: React.ComponentProps<typeof Select>["MenuProps"];
  itemSx?: SxProps<Theme>;
  showAllOption?: boolean;
  /** Override for the “All …” menu item text. */
  allOptionLabel?: string;
}

function defaultAllOptionLabel(label: string): string {
  const trimmed = label.trim();
  if (!trimmed) return "All";
  if (/y$/i.test(trimmed) && !/[aeiou]y$/i.test(trimmed)) {
    return `All ${trimmed.slice(0, -1)}ies`;
  }
  if (/s$/i.test(trimmed)) {
    return `All ${trimmed}`;
  }
  return `All ${trimmed}s`;
}

const FilterSelect = ({
  label,
  value,
  onChange,
  options = [],
  optionItems,
  sx = {},
  menuProps,
  itemSx,
  showAllOption = true,
  allOptionLabel,
}: FilterSelectProps) => {
  const items: FilterSelectOption[] =
    optionItems ?? options.map((option) => ({ value: option, label: option }));

  return (
    <FormControl size="small" sx={{ minWidth: 140, ...sx }}>
      <InputLabel>{label}</InputLabel>
      <Select value={value} label={label} onChange={onChange} MenuProps={menuProps}>
        {showAllOption && (
          <MenuItem value="All">{allOptionLabel ?? defaultAllOptionLabel(label)}</MenuItem>
        )}
        {items.map((item) => (
          <MenuItem key={item.value} value={item.value} sx={itemSx}>
            {item.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default FilterSelect;
