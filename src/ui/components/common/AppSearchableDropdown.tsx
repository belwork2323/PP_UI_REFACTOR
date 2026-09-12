import { Autocomplete, TextField, type SxProps, type Theme } from "@mui/material";
import { useMemo } from "react";
import {
  appDenseControlSx,
  appDropdownInputProps,
  appDropdownLabelProps,
  appDropdownPlaceholderSx,
  appDropdownSx,
} from "./fieldStyles";
import type { AppDropdownOption } from "./AppDropdown";

export type AppSearchableDropdownProps = {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options?: AppDropdownOption[];
  placeholder?: string;
  loading?: boolean;
  loadingPlaceholder?: string;
  disabled?: boolean;
  required?: boolean;
  helperText?: string;
  error?: boolean;
  fullWidth?: boolean;
  size?: "small" | "medium";
  compact?: boolean;
  sx?: SxProps<Theme>;
};

const AppSearchableDropdown = ({
  label,
  value,
  onChange,
  options = [],
  placeholder,
  loading = false,
  loadingPlaceholder = "Loading...",
  disabled = false,
  required = false,
  helperText,
  error = false,
  fullWidth = true,
  size = "small",
  compact = false,
  sx,
}: AppSearchableDropdownProps) => {
  const resolvedPlaceholder = loading && loadingPlaceholder ? loadingPlaceholder : placeholder;
  const safeOptions = Array.isArray(options) ? options : [];

  const selectedOption = useMemo(
    () => safeOptions.find((option) => option.value === value) ?? null,
    [safeOptions, value],
  );

  return (
    <Autocomplete
      size={size}
      fullWidth={fullWidth}
      disabled={disabled || loading}
      options={safeOptions}
      value={selectedOption}
      onChange={(_event, option) => onChange(option?.value ?? "")}
      getOptionLabel={(option) => String(option.label ?? "")}
      isOptionEqualToValue={(option, current) => option.value === current.value}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={resolvedPlaceholder}
          required={required}
          helperText={helperText}
          error={error}
          InputLabelProps={appDropdownLabelProps}
          inputProps={{ ...params.inputProps, ...appDropdownInputProps }}
          sx={compact ? appDenseControlSx : appDropdownSx}
        />
      )}
      slotProps={{
        listbox: { sx: { maxHeight: 280 } },
      }}
      noOptionsText="No matches"
      sx={sx}
    />
  );
};

export default AppSearchableDropdown;
