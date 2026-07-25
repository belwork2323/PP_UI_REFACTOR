import React from "react";
import { SxProps, Theme } from "@mui/material";
import AppDropdown, { type AppDropdownOption } from "./AppDropdown";

export type FilterSelectOption = { value: string; label: string };

interface FilterSelectProps {
  label: string;
  value: string;
  onChange: (e: { target: { value: string } }) => void;
  /** Simple string options (value and label are the same). */
  options?: string[];
  /** Value/label options — preferred when the API needs an id. */
  optionItems?: FilterSelectOption[];
  sx?: SxProps<Theme>;
  menuProps?: React.ComponentProps<typeof AppDropdown>["MenuProps"];
  itemSx?: SxProps<Theme>;
  showAllOption?: boolean;
  /** Override for the “All …” menu item text. */
  allOptionLabel?: string;
  compact?: boolean;
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
  compact = false,
}: FilterSelectProps) => {
  const items: FilterSelectOption[] =
    optionItems ?? options.map((option) => ({ value: option, label: option }));

  const dropdownOptions: AppDropdownOption[] = [
    ...(showAllOption
      ? [{ value: "All", label: allOptionLabel ?? defaultAllOptionLabel(label) }]
      : []),
    ...items.map((item) => ({ value: item.value, label: item.label })),
  ];

  return (
    <AppDropdown
      label={label}
      value={value}
      onChange={(nextValue) => onChange({ target: { value: nextValue } })}
      options={dropdownOptions}
      compact={compact}
      sx={{ minWidth: 140, ...sx }}
      MenuProps={menuProps}
      itemSx={itemSx}
    />
  );
};

export default FilterSelect;
