import { TextField, type SxProps, type TextFieldProps, type Theme } from "@mui/material";
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
  type,
  ...props
}: AppTextFieldProps) => (
  <TextField
    fullWidth
    size="small"
    variant="outlined"
    type={type}
    InputLabelProps={{ ...appDropdownLabelProps, ...InputLabelProps }}
    inputProps={{ ...appDropdownInputProps, ...inputProps }}
    sx={
      [
        compact ? appDenseControlSx : appDropdownSx,
        type === "number" && {
          "& input[type=number]": { MozAppearance: "textfield" },
          "& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button":
            {
              WebkitAppearance: "none",
              margin: 0,
            },
        },
        inputSx,
        sx,
      ] as SxProps<Theme>
    }
    {...props}
  />
);

export default AppTextField;
