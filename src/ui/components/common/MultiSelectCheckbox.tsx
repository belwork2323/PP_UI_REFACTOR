import { Box } from "@mui/material";
import {
  Checkbox,
  ListItemText,
  MenuItem,
  SelectChangeEvent,
  TextField,
  type SelectProps,
  type SxProps,
  type Theme,
} from "@mui/material";
import type { InputProps } from "@ui/components/common/Input";
import {
  APP_CONTROL_FONT_SIZE,
  appDropdownInputProps,
  appDropdownLabelProps,
  appDropdownMenuProps,
  appDropdownPlaceholderSx,
  appDropdownSx,
} from "./fieldStyles";

export type MultiSelectOption = string | { value: string; label: string };

export interface MultiSelectProps extends Omit<
  InputProps,
  "select" | "children" | "value" | "onChange"
> {
  options: MultiSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  showCheckbox?: boolean;
  renderChips?: boolean;
  MenuProps?: SelectProps["MenuProps"];
}

const menuItemSx = {
  minHeight: 36,
  py: 0.5,
  px: 1.25,
  fontSize: APP_CONTROL_FONT_SIZE,
  gap: 0.75,
};

const checkboxSx = {
  p: 0.5,
  "& .MuiSvgIcon-root": { fontSize: "1.15rem" },
};

const listItemTextSx = {
  m: 0,
  "& .MuiListItemText-primary": {
    fontSize: APP_CONTROL_FONT_SIZE,
    lineHeight: 1.4,
  },
};

const normalizeOptions = (options: MultiSelectOption[]) =>
  options.map((option) =>
    typeof option === "string"
      ? { value: option, label: option }
      : { value: String(option.value ?? ""), label: String(option.label ?? option.value ?? "") },
  );

export default function MultiSelect({
  options,
  value,
  onChange,
  showCheckbox = true,
  renderChips: _renderChips = false,
  label,
  placeholder = "Select",
  InputLabelProps,
  SelectProps,
  MenuProps,
  sx,
  ...props
}: MultiSelectProps) {
  const normalizedOptions = normalizeOptions(options);
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

  return (
    <TextField
      fullWidth
      select
      size="small"
      variant="outlined"
      label={label}
      value={value}
      {...props}
      inputProps={appDropdownInputProps}
      InputLabelProps={{
        ...appDropdownLabelProps,
        ...InputLabelProps,
      }}
      SelectProps={{
        multiple: true,
        displayEmpty: true,
        MenuProps: {
          ...appDropdownMenuProps,
          ...MenuProps,
          PaperProps: {
            ...appDropdownMenuProps.PaperProps,
            ...MenuProps?.PaperProps,
            sx: {
              ...appDropdownMenuProps.PaperProps?.sx,
              ...(typeof MenuProps?.PaperProps?.sx === "object" &&
              !Array.isArray(MenuProps.PaperProps.sx)
                ? MenuProps.PaperProps.sx
                : {}),
              "& .MuiMenuItem-root": {
                fontSize: APP_CONTROL_FONT_SIZE,
                minHeight: 36,
              },
            },
          },
        },
        ...SelectProps,
        value,
        onChange: handleChange,
        renderValue: (selected) => {
          const values = selected as string[];

          if (values.length === 0) {
            return (
              <Box component="span" sx={appDropdownPlaceholderSx}>
                {placeholder}
              </Box>
            );
          }

          return values.map((item) => labelByValue.get(item) ?? item).join(", ");
        },
      }}
      sx={[appDropdownSx, sx] as SxProps<Theme>}
    >
      <MenuItem value="__select_all__" sx={menuItemSx}>
        {showCheckbox && (
          <Checkbox
            size="small"
            checked={allSelected}
            indeterminate={value.length > 0 && !allSelected}
            sx={checkboxSx}
          />
        )}
        <ListItemText primary="Select All" sx={listItemTextSx} />
      </MenuItem>
      {normalizedOptions.map((option) => (
        <MenuItem key={option.value} value={option.value} sx={menuItemSx}>
          {showCheckbox && (
            <Checkbox size="small" checked={value.includes(option.value)} sx={checkboxSx} />
          )}
          <ListItemText primary={option.label} sx={listItemTextSx} />
        </MenuItem>
      ))}
    </TextField>
  );
}
