import React, { useState, useMemo } from "react";
import {
  TextField,
  MenuItem,
  Checkbox,
  ListItemText,
  Box,
  Chip,
  InputAdornment,
  OutlinedInput,
  SelectChangeEvent,
  SxProps,
  Theme,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";

export interface DropdownOption {
  value: string;
  label: string;
}

export interface MultiSelectWithSearchProps {
  options: DropdownOption[] | string[];
  value: string[];
  onChange: (values: string[]) => void;
  showCheckbox?: boolean;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  InputLabelProps?: object;
  SelectProps?: object;
  MenuProps?: any;
  sx?: SxProps<Theme>;
  [key: string]: any;
  hideSelectWhenDisabled?: boolean;
}

const normalizeOptions = (options: DropdownOption[] | string[]): DropdownOption[] => {
  if (!Array.isArray(options)) return [];
  return options.map((opt) => (typeof opt === "string" ? { value: opt, label: opt } : opt));
};

export default function MultiSelectWithSearch({
  options,
  value,
  onChange,
  showCheckbox = true,
  label,
  placeholder = "Select",
  disabled = false,
  InputLabelProps,
  SelectProps,
  MenuProps,
  sx,
  hideSelectWhenDisabled = false,
  ...props
}: MultiSelectWithSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const normalizedOptions = normalizeOptions(options);

  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return normalizedOptions;
    return normalizedOptions.filter((option) =>
      option.label.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [normalizedOptions, searchQuery]);

  const optionValues = normalizedOptions.map((option) => option.value);
  const labelByValue = new Map(normalizedOptions.map((option) => [option.value, option.label]));
  const allSelected = value.length === optionValues.length && optionValues.length > 0;

  const handleChange = (event: SelectChangeEvent<string[]>) => {
    const values = event.target.value as string[];

    if (values.includes("__select_all__")) {
      onChange(allSelected ? [] : [...optionValues]);
      return;
    }

    onChange(values);
  };

  const handleRemoveItem = (valueToRemove: string) => {
    if (disabled) return;
    onChange(value.filter((v) => v !== valueToRemove));
  };

  return (
    <Box sx={{ width: "100%" }}>
      {!(disabled && hideSelectWhenDisabled) && (
        <TextField
          fullWidth
          select
          size="small"
          variant="outlined"
          label={label}
          value={value}
          disabled={disabled}
          {...props}
          InputLabelProps={{
            shrink: true, // ← forces label to stay on top
            ...InputLabelProps,
          }}
          SelectProps={{
            multiple: true,
            displayEmpty: true,
            onClose: () => setSearchQuery(""),
            MenuProps: {
              ...MenuProps,
              PaperProps: {
                ...MenuProps?.PaperProps,
                sx: {
                  ...(typeof MenuProps?.PaperProps?.sx === "object" &&
                  !Array.isArray(MenuProps?.PaperProps?.sx)
                    ? MenuProps.PaperProps.sx
                    : {}),
                  maxHeight: 320,
                },
              },
            },
            ...SelectProps,
            value,
            onChange: handleChange,
            renderValue: () => {
              return (
                <Box component="span" sx={{ color: "text.disabled" }}>
                  {placeholder}
                </Box>
              );
            },
          }}
          sx={sx}
        >
          {/* Sticky Search Input Box inside Dropdown */}
          <Box
            sx={{
              px: 2,
              py: 1.5,
              position: "sticky",
              top: 0,
              bgcolor: "background.paper",
              zIndex: 1,
              borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
            }}
            onKeyDown={(e) => e.stopPropagation()}
            onKeyUp={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <OutlinedInput
              size="small"
              fullWidth
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              startAdornment={
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" sx={{ color: "text.secondary" }} />
                </InputAdornment>
              }
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              sx={{ fontSize: "0.875rem" }}
            />
          </Box>

          {/* Select All Option */}
          {!searchQuery && (
            <MenuItem value="__select_all__" sx={{ minHeight: 36 }}>
              {showCheckbox && (
                <Checkbox
                  size="small"
                  checked={allSelected}
                  indeterminate={value.length > 0 && !allSelected}
                  sx={{ p: 0.5, mr: 1 }}
                />
              )}
              <ListItemText
                primary="Select All"
                primaryTypographyProps={{ fontSize: "0.875rem" }}
              />
            </MenuItem>
          )}

          {/* Filtered Options List */}
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => (
              <MenuItem key={option.value} value={option.value} sx={{ minHeight: 36 }}>
                {showCheckbox && (
                  <Checkbox
                    size="small"
                    checked={value.includes(option.value)}
                    sx={{ p: 0.5, mr: 1 }}
                  />
                )}
                <ListItemText
                  primary={option.label}
                  primaryTypographyProps={{ fontSize: "0.875rem" }}
                />
              </MenuItem>
            ))
          ) : (
            <MenuItem disabled sx={{ minHeight: 36 }}>
              <ListItemText
                primary="No results found"
                primaryTypographyProps={{ fontSize: "0.875rem", fontStyle: "italic" }}
              />
            </MenuItem>
          )}
        </TextField>
      )}
      {value.length > 0 && (
        <Box sx={{ mt: disabled && hideSelectWhenDisabled ? 0 : 1 }}>
          <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 0.5 }}>
            {!hideSelectWhenDisabled && (
              <>
                {value.length} {value.length === 1 ? "item" : "items"} selected
              </>
            )}
          </Typography>
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 0.75,
              alignItems: "center",
            }}
          >
            {value.map((itemValue) => {
              const itemLabel = labelByValue.get(itemValue) ?? itemValue;
              return (
                <Chip
                  key={itemValue}
                  label={itemLabel}
                  size="small"
                  {...(disabled ? {} : { onDelete: () => handleRemoveItem(itemValue) })}
                  sx={{
                    borderRadius: "6px",
                    backgroundColor: (theme) => theme.palette.action.selected,
                    ...(!disabled && {
                      "& .MuiChip-deleteIcon": {
                        fontSize: "1rem",
                        color: "text.secondary",
                        "&:hover": {
                          color: "error.main",
                        },
                      },
                    }),
                  }}
                />
              );
            })}
          </Box>
        </Box>
      )}
    </Box>
  );
}
