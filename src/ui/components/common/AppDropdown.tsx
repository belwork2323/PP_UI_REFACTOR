import type { ReactNode } from "react";
import {
  Box,
  MenuItem,
  TextField,
  type SelectProps,
  type SxProps,
  type Theme,
  type TextFieldProps,
} from "@mui/material";
import {
  appDenseControlSx,
  appDropdownInputProps,
  appDropdownLabelProps,
  appDropdownMenuProps,
  appDropdownPlaceholderSx,
  appDropdownSx,
} from "./fieldStyles";

export type AppDropdownOption = {
  value: string;
  label: ReactNode;
  disabled?: boolean;
};

export type AppDropdownProps = {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options?: AppDropdownOption[];
  placeholder?: string;
  loading?: boolean;
  loadingPlaceholder?: string;
  disabled?: boolean;
  required?: boolean;
  helperText?: ReactNode;
  error?: boolean;
  fullWidth?: boolean;
  size?: "small" | "medium";
  renderValue?: (value: string) => ReactNode;
  children?: ReactNode;
  MenuProps?: SelectProps["MenuProps"];
  itemSx?: SxProps<Theme>;
  sx?: SxProps<Theme>;
  compact?: boolean;
  InputLabelProps?: TextFieldProps["InputLabelProps"];
  id?: string;
  name?: string;
  onOpen?: SelectProps["onOpen"];
  SelectProps?: Omit<SelectProps, "displayEmpty" | "renderValue" | "MenuProps">;
};

const AppDropdown = ({
  label,
  value,
  onChange,
  options,
  placeholder,
  loading = false,
  loadingPlaceholder = "Loading...",
  disabled = false,
  required = false,
  helperText,
  error = false,
  fullWidth = true,
  size = "small",
  renderValue,
  children,
  MenuProps,
  itemSx,
  sx,
  InputLabelProps,
  id,
  name,
  onOpen,
  SelectProps: selectProps,
  compact = false,
}: AppDropdownProps) => {
  const resolvedPlaceholder =
    loading && loadingPlaceholder ? loadingPlaceholder : placeholder;
  const hasPlaceholder = Boolean(resolvedPlaceholder);

  const resolveRenderValue = (selected: unknown) => {
    const selectedValue = String(selected ?? "");
    if (!selectedValue) {
      return (
        <Box component="span" sx={appDropdownPlaceholderSx}>
          {resolvedPlaceholder}
        </Box>
      );
    }

    if (renderValue) {
      return renderValue(selectedValue);
    }

    if (options?.length) {
      const match = options.find((option) => option.value === selectedValue);
      if (match) return match.label;
    }

    return selectedValue;
  };

  return (
    <TextField
      id={id}
      name={name}
      select
      fullWidth={fullWidth}
      size={size}
      variant="outlined"
      label={label}
      value={value}
      onChange={(event) => onChange(String(event.target.value))}
      disabled={disabled || loading}
      required={required}
      helperText={helperText}
      error={error}
      InputLabelProps={{ ...appDropdownLabelProps, ...InputLabelProps }}
      inputProps={appDropdownInputProps}
      SelectProps={{
        displayEmpty: hasPlaceholder,
        renderValue: resolveRenderValue,
        MenuProps: { ...appDropdownMenuProps, ...MenuProps },
        onOpen,
        ...selectProps,
      }}
      sx={
        [compact ? appDenseControlSx : appDropdownSx, sx] as SxProps<Theme>
      }
    >
      {hasPlaceholder ? (
        <MenuItem value="">
          <em>{resolvedPlaceholder}</em>
        </MenuItem>
      ) : null}
      {children ??
        options?.map((option) => (
          <MenuItem
            key={option.value}
            value={option.value}
            disabled={option.disabled}
            sx={itemSx}
          >
            {option.label}
          </MenuItem>
        ))}
    </TextField>
  );
};

export default AppDropdown;
