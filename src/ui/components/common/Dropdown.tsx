import { MenuItem } from "@mui/material";
import Input, { type InputProps } from "./Input";

type DropdownOption =
  | string
  | { label: string; value: string | number | boolean | null | undefined };

type DropdownProps = Omit<InputProps, "select" | "children"> & {
  options?: DropdownOption[];
};

const Dropdown = ({
  label,
  value,
  onChange,
  options = [],
  fullWidth = true,
  sx,
  ...rest
}: DropdownProps) => {
  return (
    <Input
      select
      label={label}
      value={value}
      onChange={onChange}
      fullWidth={fullWidth}
      sx={sx}
      {...rest}
    >
      {options.map((option, index) => {
        // Normalize option to always have value & label
        const optValue =
          option && typeof option === "object" && "value" in option
            ? option.value
            : option;

        const optLabel =
          option && typeof option === "object" && "label" in option
            ? option.label
            : String(option ?? "");

        // Prefer value as key, fallback to index (safe when value is unique)
        const key = optValue != null ? optValue : `opt-${index}`;

        return (
          <MenuItem key={key} value={optValue}>
            {optLabel}
          </MenuItem>
        );
      })}
    </Input>
  );
};

export default Dropdown;