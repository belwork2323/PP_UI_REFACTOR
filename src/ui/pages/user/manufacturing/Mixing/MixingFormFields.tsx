import type { ReactNode } from "react";
import { Box, TextField, Typography } from "@mui/material";
import AppDropdown from "../../../../components/common/AppDropdown";
import { MIXING_BRAND } from "../../../../../app/theme/custom_themes/user/manufacturing/mixing_theme";

const BRAND = MIXING_BRAND;

export const mixingPlaceholderSx = {
  color: BRAND.textSub,
  opacity: 0.72,
  fontWeight: 400,
  fontSize: "0.68rem",
  lineHeight: 1.4,
};

export const mixingFieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: 1.5,
    background: BRAND.surface,
    fontSize: "0.78rem",
    "& fieldset": { borderColor: BRAND.border },
    "&:hover fieldset": { borderColor: BRAND.mxLight },
    "&.Mui-focused fieldset": { borderColor: BRAND.mx, borderWidth: 2 },
    "&.Mui-focused": { background: "#fff" },
  },
  "& .MuiInputBase-input": {
    fontWeight: 500,
    color: BRAND.text,
    fontSize: "0.78rem",
    "&::placeholder": mixingPlaceholderSx,
    "&::-webkit-input-placeholder": mixingPlaceholderSx,
    "&::-moz-placeholder": mixingPlaceholderSx,
  },
  "& .MuiSelect-select": {
    fontSize: "0.78rem",
  },
};

export const mixingTableInputSx = {
  ...mixingFieldSx,
  "& .MuiOutlinedInput-root": {
    ...mixingFieldSx["& .MuiOutlinedInput-root"],
    background: "#fff",
  },
};

const renderSelectValue = (
  selected: unknown,
  _placeholder: string,
  options: { value: string; label: string }[],
) => {
  const value = String(selected ?? "");
  const match = options.find((option) => option.value === value);
  return match?.label ?? value;
};

export const MixingFieldLabel = ({ children }: { children: ReactNode }) => (
  <Typography sx={{ fontWeight: 700, fontSize: "0.72rem", color: BRAND.textSub, mb: 0.6 }}>
    {children}
  </Typography>
);

type MixingSelectFieldProps = {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[] | string[];
  placeholder: string;
  disabled?: boolean;
};

export const MixingSelectField = ({
  label,
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
}: MixingSelectFieldProps) => {
  const normalized = options.map((option) =>
    typeof option === "string" ? { value: option, label: option } : option,
  );

  return (
    <Box>
      {label ? <MixingFieldLabel>{label}</MixingFieldLabel> : null}
      <AppDropdown
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        options={normalized}
        renderValue={(selected) => renderSelectValue(selected, placeholder, normalized)}
        sx={{ mb: 0, ...mixingFieldSx }}
      />
    </Box>
  );
};

type MixingTextFieldProps = {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  disabled?: boolean;
  multiline?: boolean;
  minRows?: number;
  type?: string;
};

export const MixingTextField = ({
  label,
  value,
  onChange,
  placeholder,
  disabled = false,
  multiline = false,
  minRows,
  type = "text",
}: MixingTextFieldProps) => (
  <Box>
    {label ? <MixingFieldLabel>{label}</MixingFieldLabel> : null}
    <TextField
      size="small"
      fullWidth
      disabled={disabled}
      multiline={multiline}
      minRows={minRows}
      type={type}
      value={value}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
      sx={mixingFieldSx}
    />
  </Box>
);

export const MixingTableInput = ({
  value,
  onChange,
  placeholder,
  disabled = false,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  disabled?: boolean;
}) => (
  <TextField
    size="small"
    fullWidth
    value={value}
    placeholder={placeholder}
    disabled={disabled}
    onChange={(event) => onChange(event.target.value)}
    sx={mixingTableInputSx}
  />
);
