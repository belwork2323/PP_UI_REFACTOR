import type { ReactNode } from "react";
import { alpha, Box, MenuItem, TextField, Typography } from "@mui/material";
import { DateTimeField } from "../../../../../components/common/DateField";

type RmpPalette = {
  primary?: string;
  primaryLight?: string;
  border?: string;
  surface?: string;
  pageBg?: string;
  text?: string;
  textSub?: string;
  danger?: string;
};

const buildFieldSx = (palette: RmpPalette, hasError = false) => ({
  "& .MuiOutlinedInput-root": {
    borderRadius: 2,
    background: palette.pageBg ?? "#fff",
    fontSize: "0.78rem",
    transition: "all 0.2s ease",
    "& fieldset": {
      borderColor: hasError ? palette.danger : alpha(palette.border ?? "#D5D8DC", 0.95),
    },
    "&:hover fieldset": {
      borderColor: hasError ? palette.danger : alpha(palette.primaryLight ?? "#2E86C1", 0.55),
    },
    "&.Mui-focused fieldset": {
      borderColor: hasError ? palette.danger : palette.primaryLight ?? "#2E86C1",
      borderWidth: 2,
    },
    "&.Mui-disabled": {
      background: alpha(palette.surface ?? "#F4F6F8", 0.85),
    },
  },
  "& .MuiInputBase-input": {
    fontWeight: 500,
    color: palette.text,
    fontSize: "0.78rem",
    "&::placeholder": {
      color: palette.textSub,
      opacity: 0.72,
      fontSize: "0.72rem",
    },
  },
  "& .MuiSelect-select": {
    fontSize: "0.78rem",
    py: 1,
  },
  "& .MuiFormHelperText-root": {
    fontSize: "0.68rem",
    mx: 0,
    mt: 0.4,
  },
});

const buildTableFieldSx = (palette: RmpPalette, hasError = false) => ({
  ...buildFieldSx(palette, hasError),
  mb: 0,
  minWidth: 0,
});

const placeholderSx = (palette: RmpPalette) => ({
  color: palette.textSub,
  opacity: 0.72,
  fontSize: "0.72rem",
  fontWeight: 400,
});

export const WeightmentFieldLabel = ({
  children,
  palette,
}: {
  children: ReactNode;
  palette: RmpPalette;
}) => (
  <Typography
    sx={{
      fontSize: "0.72rem",
      fontWeight: 700,
      letterSpacing: "0.03em",
      color: palette.primary ?? palette.text,
      mb: 0.65,
      display: "block",
    }}
  >
    {children}
  </Typography>
);

type WeightmentTextFieldProps = {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  type?: string;
  error?: boolean;
  helperText?: string;
  palette: RmpPalette;
  width?: number | string | Record<string, number | string>;
};

export const WeightmentTextField = ({
  label,
  value,
  onChange,
  placeholder,
  disabled = false,
  readOnly = false,
  type = "text",
  error = false,
  helperText,
  palette,
  width = "100%",
}: WeightmentTextFieldProps) => (
  <Box sx={{ width, flexShrink: 0 }}>
    {label ? <WeightmentFieldLabel palette={palette}>{label}</WeightmentFieldLabel> : null}
    <TextField
      size="small"
      fullWidth
      disabled={disabled}
      type={type}
      value={value}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
      error={error}
      helperText={helperText}
      InputProps={{ readOnly }}
      InputLabelProps={type === "datetime-local" ? { shrink: true } : undefined}
      sx={buildFieldSx(palette, error)}
    />
  </Box>
);

type WeightmentSelectFieldProps = {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
  palette: RmpPalette;
};

export const WeightmentSelectField = ({
  label,
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
  error = false,
  helperText,
  palette,
}: WeightmentSelectFieldProps) => (
  <Box>
    {label ? <WeightmentFieldLabel palette={palette}>{label}</WeightmentFieldLabel> : null}
    <TextField
      select
      size="small"
      fullWidth
      disabled={disabled}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      error={error}
      helperText={helperText}
      sx={buildFieldSx(palette, error)}
      SelectProps={{
        displayEmpty: true,
        renderValue: (selected) => {
          const raw = String(selected ?? "");
          if (!raw) {
            return (
              <Typography component="span" sx={placeholderSx(palette)}>
                {placeholder}
              </Typography>
            );
          }
          return options.find((option) => option.value === raw)?.label ?? raw;
        },
      }}
    >
      <MenuItem value="">{placeholder}</MenuItem>
      {options.map((option) => (
        <MenuItem key={option.value} value={option.value}>
          {option.label}
        </MenuItem>
      ))}
    </TextField>
  </Box>
);

export const WeightmentTableInput = ({
  value,
  onChange,
  placeholder,
  type = "text",
  disabled = false,
  readOnly = false,
  error = false,
  helperText,
  palette,
  selectOptions,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
  readOnly?: boolean;
  error?: boolean;
  helperText?: string;
  palette: RmpPalette;
  selectOptions?: { value: string; label: string; disabled?: boolean }[];
}) => {
  if (selectOptions) {
    return (
      <TextField
        select
        size="small"
        fullWidth
        disabled={disabled}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        error={error}
        helperText={helperText}
        sx={buildTableFieldSx(palette, error)}
        SelectProps={{
          displayEmpty: true,
          renderValue: (selected) => {
            const raw = String(selected ?? "");
            if (!raw) {
              return (
                <Typography component="span" sx={placeholderSx(palette)}>
                  {placeholder ?? "—"}
                </Typography>
              );
            }
            return selectOptions.find((option) => option.value === raw)?.label ?? raw;
          },
        }}
      >
        <MenuItem value="">{placeholder ?? "—"}</MenuItem>
        {selectOptions.map((option) => (
          <MenuItem key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </MenuItem>
        ))}
      </TextField>
    );
  }

  if (type === "datetime") {
    return (
      <DateTimeField
        value={value}
        onChange={onChange}
        disabled={disabled}
        compact
      />
    );
  }

  return (
    <TextField
      size="small"
      fullWidth
      disabled={disabled}
      type={type}
      value={value}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
      error={error}
      helperText={helperText}
      InputProps={{ readOnly }}
      InputLabelProps={type === "datetime-local" ? { shrink: true } : undefined}
      sx={buildTableFieldSx(palette, error)}
    />
  );
};
