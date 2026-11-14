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
  /** Floating-label batch-list filter styling (matches subdepartment filter panels). */
  filterPanel?: boolean;
  InputLabelProps?: TextFieldProps["InputLabelProps"];
  id?: string;
  name?: string;
  onOpen?: SelectProps["onOpen"];
  SelectProps?: Omit<SelectProps, "displayEmpty" | "renderValue" | "MenuProps">;
  startAdornment?: ReactNode;
  /** Applied on the OutlinedInput — use for border/chrome that must beat MUI theme defaults. */
  inputSx?: SxProps<Theme>;
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
  filterPanel = false,
  startAdornment,
  inputSx,
}: AppDropdownProps) => {
  const resolvedPlaceholder = loading && loadingPlaceholder ? loadingPlaceholder : placeholder;
  const hasPlaceholder = Boolean(resolvedPlaceholder);
  const sxList = [
    ...(filterPanel ? [{ mb: 0 }] : [compact ? appDenseControlSx : appDropdownSx]),
    ...(sx == null ? [] : Array.isArray(sx) ? sx : [sx]),
  ];

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
      fullWidth={filterPanel ? true : fullWidth}
      size={size}
      variant="outlined"
      label={label}
      value={value}
      onChange={(event) => onChange(String(event.target.value))}
      disabled={disabled || loading}
      required={required}
      helperText={helperText}
      error={error}
      InputLabelProps={
        filterPanel
          ? { shrink: true, ...InputLabelProps }
          : { ...appDropdownLabelProps, ...InputLabelProps }
      }
      inputProps={filterPanel ? { style: { fontSize: "0.72rem" } } : appDropdownInputProps}
      InputProps={{
        ...(startAdornment ? { startAdornment } : {}),
        ...(inputSx ? { sx: inputSx } : {}),
      }}
      SelectProps={{
        displayEmpty: hasPlaceholder,
        renderValue: resolveRenderValue,
        MenuProps: {
          ...appDropdownMenuProps,
          ...MenuProps,
          PaperProps: {
            ...appDropdownMenuProps.PaperProps,
            ...MenuProps?.PaperProps,
            sx: [
              appDropdownMenuProps.PaperProps?.sx,
              ...(MenuProps?.PaperProps?.sx
                ? Array.isArray(MenuProps.PaperProps.sx)
                  ? MenuProps.PaperProps.sx
                  : [MenuProps.PaperProps.sx]
                : []),
            ],
          },
        },
        onOpen,
        ...selectProps,
      }}
      sx={sxList as SxProps<Theme>}
    >
      {hasPlaceholder ? (
        <MenuItem value="">
          <em>{resolvedPlaceholder}</em>
        </MenuItem>
      ) : null}
      {children ??
        options?.map((option) => (
          <MenuItem key={option.value} value={option.value} disabled={option.disabled} sx={itemSx}>
            {option.label}
          </MenuItem>
        ))}
    </TextField>
  );
};

export default AppDropdown;
