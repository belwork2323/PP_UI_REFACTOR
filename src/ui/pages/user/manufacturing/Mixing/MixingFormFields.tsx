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

export const MixingFieldLabel = ({
  children,
  required = false,
  sx = {},
}: {
  children: React.ReactNode;
  required?: boolean;
  sx?: object;
}) => (
  <Typography
    sx={{
      fontWeight: 700,
      fontSize: "0.72rem",
      color: MIXING_BRAND.textSub,
      mb: 0.6,
      display: "block",
      ...sx,
    }}
  >
    {children}
    {required && (
      <Box component="span" sx={{ color: "error.main", ml: 0.5 }}>
        *
      </Box>
    )}
  </Typography>
);

export interface MixingSelectFieldProps {
  label?: string;
  value: string;
  onChange: (value: any) => void;
  options: { value: string; label: string }[] | string[];
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
  required?: boolean;
}

export const MixingSelectField = ({
  label,
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
  error = false,
  helperText,
  required = false,
}: MixingSelectFieldProps) => {
  const normalized = options.map((option) =>
    typeof option === "string" ? { value: option, label: option } : option,
  );

  return (
    <Box>
      {label ? <MixingFieldLabel required={required}>{label}</MixingFieldLabel> : null}
      <AppDropdown
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        options={normalized}
        renderValue={(selected) => renderSelectValue(selected, placeholder, normalized)}
        error={error}
        sx={{
          mb: 0,
          ...mixingFieldSx,
          ...(error && {
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: "error.main",
            },
          }),
        }}
      />
      {error && helperText ? (
        <Typography
          variant="caption"
          sx={{
            color: "error.main",
            fontSize: "0.72rem",
            mt: 0.5,
            ml: 0.25,
            display: "block",
            fontWeight: 500,
          }}
        >
          {helperText}
        </Typography>
      ) : null}
    </Box>
  );
};

export type MixingTextFieldProps = {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  disabled?: boolean;
  multiline?: boolean;
  minRows?: number;
  type?: string;
  error?: boolean;
  helperText?: string;
  required?: boolean;
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
  error = false,
  helperText,
  required = false,
}: MixingTextFieldProps) => (
  <Box>
    {label ? <MixingFieldLabel required={required}>{label}</MixingFieldLabel> : null}
    <TextField
      size="small"
      fullWidth
      disabled={disabled}
      multiline={multiline}
      minRows={minRows}
      type={type}
      value={value}
      placeholder={placeholder}
      error={error}
      helperText={helperText}
      onChange={(event) => onChange(event.target.value)}
      sx={mixingFieldSx}
    />
  </Box>
);

export const MixingTableInput = ({
  inputRef,
  value,
  onChange,
  placeholder,
  disabled = false,
  error = false,
  helperText,
  required = false,
}: {
  inputRef?: React.Ref<HTMLInputElement>;
  value: string | number;
  onChange: (value: string | number) => void;
  placeholder: string;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
  required?: boolean;
}) => (
  <TextField
    size="small"
    fullWidth
    value={value}
    placeholder={placeholder}
    disabled={disabled}
    error={error}
    helperText={helperText}
    onChange={(event) => onChange(event.target.value)}
    sx={mixingTableInputSx}
    required={required}
    inputRef={inputRef}
  />
);
