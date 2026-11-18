import { TextField, useTheme, type SxProps, type TextFieldProps, type Theme } from "@mui/material";
import {
  appDenseControlSx,
  appDropdownInputProps,
  appDropdownLabelProps,
  appDropdownSx,
} from "./fieldStyles";

export type AppTextFieldProps = TextFieldProps & {
  /** Use shared compact height (matches AppDropdown / DateField compact). */
  compact?: boolean;
  /** Extra field CSS merged after the base theme. */
  inputSx?: SxProps<Theme>;
  /** Floating-label batch-list filter styling (matches subdepartment filter panels). */
  filterPanel?: boolean;
};

/**
 * Project standard text field — same theme as AppDropdown / DateField.
 * Use `compact` in tables and dense rows so heights stay aligned.
 */
const AppTextField = ({
  sx,
  inputSx,
  InputLabelProps,
  inputProps,
  compact = false,
  filterPanel = false,
  type,
  ...props
}: AppTextFieldProps) => {
  const muiTheme = useTheme();
  const isDark = muiTheme.palette.mode === "dark";
  const textColor = isDark ? "#f0f2f8" : undefined;
  const placeholderColor = isDark ? "rgba(240,242,248,0.65)" : undefined;

  const baseInputStyle = filterPanel
    ? { fontSize: "0.72rem" }
    : { ...(appDropdownInputProps.style ?? {}) };

  const darkInputStyle = textColor
    ? {
        color: textColor,
        WebkitTextFillColor: textColor,
        caretColor: textColor,
      }
    : {};

  return (
    <TextField
      fullWidth={filterPanel !== false}
      size="small"
      variant="outlined"
      type={type}
      InputLabelProps={
        filterPanel ? InputLabelProps : { ...appDropdownLabelProps, ...InputLabelProps }
      }
      inputProps={{
        ...(!filterPanel ? appDropdownInputProps : {}),
        ...inputProps,
        style: {
          ...baseInputStyle,
          ...darkInputStyle,
          ...(inputProps?.style ?? {}),
        },
      }}
      sx={
        [
          filterPanel ? { mb: 0 } : compact ? appDenseControlSx : appDropdownSx,
          type === "number" && {
            "& input[type=number]": { MozAppearance: "textfield" },
            "& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button":
              {
                WebkitAppearance: "none",
                margin: 0,
              },
          },
          isDark && {
            "& .MuiInputBase-input, & .MuiOutlinedInput-input": {
              color: `${textColor} !important`,
              WebkitTextFillColor: `${textColor} !important`,
              caretColor: textColor,
              "&::placeholder, &::-webkit-input-placeholder": {
                color: `${placeholderColor} !important`,
                WebkitTextFillColor: `${placeholderColor} !important`,
                opacity: 1,
              },
            },
          },
          inputSx,
          sx,
        ] as SxProps<Theme>
      }
      {...props}
    />
  );
};

export default AppTextField;
