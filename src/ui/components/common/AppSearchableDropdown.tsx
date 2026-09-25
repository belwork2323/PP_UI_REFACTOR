import {
  Autocomplete,
  TextField,
  type AutocompleteRenderOptionState,
  type FilterOptionsState,
  type SxProps,
  type Theme,
} from "@mui/material";
import { useMemo, type HTMLAttributes, type ReactNode } from "react";
import {
  appDenseControlSx,
  appDropdownInputProps,
  appDropdownLabelProps,
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
  /** Floating-label filter styling (matches AppDropdown filterPanel / other master toolbars). */
  filterPanel?: boolean;
  sx?: SxProps<Theme>;
  getOptionLabel?: (option: AppDropdownOption) => string;
  filterOptions?: (
    options: AppDropdownOption[],
    state: FilterOptionsState<AppDropdownOption>,
  ) => AppDropdownOption[];
  renderOption?: (
    props: HTMLAttributes<HTMLLIElement>,
    option: AppDropdownOption,
    state: AutocompleteRenderOptionState,
  ) => ReactNode;
};

const defaultGetOptionLabel = (option: AppDropdownOption) => String(option.label ?? "");

const defaultFilterOptions = (
  options: AppDropdownOption[],
  state: FilterOptionsState<AppDropdownOption>,
  getOptionLabel: (option: AppDropdownOption) => string,
) => {
  const q = state.inputValue.trim().toLowerCase();
  if (!q) return options;
  return options.filter((option) => {
    const label = getOptionLabel(option).toLowerCase();
    const value = String(option.value ?? "").toLowerCase();
    return label.includes(q) || value.includes(q);
  });
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
  filterPanel = false,
  sx,
  getOptionLabel = defaultGetOptionLabel,
  filterOptions,
  renderOption,
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
      fullWidth={filterPanel ? true : fullWidth}
      disabled={disabled || loading}
      options={safeOptions}
      value={selectedOption}
      onChange={(_event, option) => onChange(option?.value ?? "")}
      getOptionLabel={getOptionLabel}
      isOptionEqualToValue={(option, current) => option.value === current.value}
      filterOptions={
        filterOptions ??
        ((opts, state) => defaultFilterOptions(opts, state, getOptionLabel))
      }
      renderOption={renderOption}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={resolvedPlaceholder}
          required={required}
          helperText={helperText}
          error={error}
          InputLabelProps={
            filterPanel
              ? { ...params.InputLabelProps, shrink: true }
              : { ...params.InputLabelProps, ...appDropdownLabelProps }
          }
          inputProps={{
            ...params.inputProps,
            ...(filterPanel ? { style: { fontSize: "0.72rem" } } : appDropdownInputProps),
          }}
          sx={
            (filterPanel
              ? [{ mb: 0 }, sx]
              : [compact ? appDenseControlSx : appDropdownSx]) as SxProps<Theme>
          }
        />
      )}
      slotProps={{
        listbox: { sx: { maxHeight: 280 } },
      }}
      noOptionsText="No matches"
      sx={filterPanel ? { mb: 0 } : sx}
    />
  );
};

export default AppSearchableDropdown;
