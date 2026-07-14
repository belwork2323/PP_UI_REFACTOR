import { useThemeStore } from "@/app/store/themeStore";
import { getSharedTheme } from "@/app/theme/custom_themes/shared/shared_theme";
import {
  Checkbox,
  Chip,
  ListItemText,
  MenuItem,
  SelectChangeEvent,
  TextField,
} from "@mui/material";
import Input, { InputProps } from "@ui/components/common/Input";

export interface MultiSelectProps extends Omit<
  InputProps,
  "select" | "children" | "value" | "onChange"
> {
  options: string[];
  value: string[];
  onChange: (value: string[]) => void;
  showCheckbox?: boolean;
  renderChips?: boolean;
}

export default function MultiSelect({
  options,
  value,
  onChange,
  showCheckbox = true,
  renderChips = false,
  label,
  placeholder = "Select",
  ...props
}: MultiSelectProps) {
  const mode = useThemeStore((state) => state.mode);
  const t = getSharedTheme(mode);
  const allSelected = value.length === options.length && options.length > 0;

  const handleSelectAll = () => {
    onChange(allSelected ? [] : [...options]);
  };
  const handleChange = (event: SelectChangeEvent<string[]>) => {
    const values = event.target.value as string[];

    if (values.includes("__select_all__")) {
      onChange(allSelected ? [] : [...options]);
      return;
    }

    onChange(values);
  };

  return (
    <TextField
      fullWidth
      select
      label={label}
      value={value}
      sx={t.adminManagement.input} // or adminManagement.input

      SelectProps={{
        multiple: true,
        displayEmpty: true,
        MenuProps: t.adminManagement.menuPaper,

        value,
        onChange: handleChange,
        renderValue: (selected) => {
          const values = selected as string[];

          if (values.length === 0) {
            return placeholder;
          }

          return values.join(", ");
        },
      }}
    >
      <MenuItem value="__select_all__">
        <Checkbox checked={allSelected} indeterminate={value.length > 0 && !allSelected} />
        <ListItemText primary="Select All" />
      </MenuItem>
      {options.map((option) => (
        <MenuItem key={option} value={option}>
          <Checkbox checked={value.includes(option)} />
          <ListItemText primary={option} />
        </MenuItem>
      ))}
    </TextField>
  );
}
