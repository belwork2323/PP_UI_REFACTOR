import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { type Dayjs } from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import "dayjs/locale/en-gb";
import { createContext, useContext, type ReactNode } from "react";
import { TextField, type SxProps, type Theme, type TextFieldProps } from "@mui/material";
import {
  appDatePickerCompactFieldSx,
  appDatePickerCompactPopupSlotProps,
  appDatePickerFieldSx,
  appDatePickerPopupSlotProps,
  appDropdownLabelProps,
} from "./fieldStyles";
import {
  UI_DATE_FORMAT,
  UI_DATE_PARSE_FORMATS,
  UI_DATE_PLACEHOLDER,
} from "../../../utils/dateUtils";

dayjs.extend(customParseFormat);
dayjs.locale("en-gb");

/** Dedicated text field for date pickers — avoids FormInput's 40px dropdown padding. */
const DatePickerTextField = ({ sx, InputLabelProps, ...props }: TextFieldProps) => (
  <TextField
    fullWidth
    size="small"
    variant="outlined"
    InputLabelProps={{ ...appDropdownLabelProps, ...InputLabelProps }}
    sx={sx}
    {...props}
  />
);

export const appDatePickerFieldSlots = {
  enableAccessibleFieldDOMStructure: false as const,
  slots: { textField: DatePickerTextField },
};

/** True when an ancestor already mounted LocalizationProvider — avoids N nested providers per cell. */
const AppDatePickerContext = createContext(false);

export const AppDatePickerProvider = ({ children }: { children: ReactNode }) => {
  const alreadyProvided = useContext(AppDatePickerContext);
  if (alreadyProvided) {
    return <>{children}</>;
  }
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="en-gb">
      <AppDatePickerContext.Provider value={true}>{children}</AppDatePickerContext.Provider>
    </LocalizationProvider>
  );
};

export const parseUiDate = (value: string): Dayjs | null => {
  if (!value) return null;
  const parsed = dayjs(value, [...UI_DATE_PARSE_FORMATS], true);
  if (parsed.isValid()) return parsed;
  const fallback = dayjs(value);
  return fallback.isValid() ? fallback : null;
};

export type AppDatePickerTextFieldProps = {
  required?: boolean;
  error?: boolean;
  helperText?: string;
  compact?: boolean;
  placeholder?: string;
  /** Extra styles merged onto the date text field. */
  sx?: SxProps<Theme>;
  /** Alias for additional field CSS (merged after base theme, before `sx`). */
  inputSx?: SxProps<Theme>;
};

export const buildAppDatePickerSlotProps = ({
  required,
  error,
  helperText,
  compact,
  placeholder = UI_DATE_PLACEHOLDER,
  sx,
  inputSx,
}: AppDatePickerTextFieldProps) => ({
  ...(compact ? appDatePickerCompactPopupSlotProps : appDatePickerPopupSlotProps),
  field: {
    openPickerButtonPosition: "start" as const,
  },
  inputAdornment: {
    position: "start" as const,
    disableTypography: true,
    sx: {
      m: 0,
      ml: 0,
      mr: "2px",
      height: "auto",
      maxHeight: "none",
    },
  },
  textField: {
    required,
    error,
    helperText,
    placeholder,
    sx: [
      compact ? appDatePickerCompactFieldSx : appDatePickerFieldSx,
      inputSx,
      sx,
    ] as SxProps<Theme>,
  },
});

export { UI_DATE_FORMAT, UI_DATE_PLACEHOLDER };
