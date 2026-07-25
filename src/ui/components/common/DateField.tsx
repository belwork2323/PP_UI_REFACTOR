import { DatePicker, DateTimePicker, TimePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import type { SxProps, Theme } from "@mui/material";
import {
  AppDatePickerProvider,
  appDatePickerFieldSlots,
  buildAppDatePickerSlotProps,
  parseUiDate,
  UI_DATE_FORMAT,
} from "./datePickerShared";
import { UI_DATETIME_FORMAT } from "../../../utils/dateUtils";

export type DateFieldProps = {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  error?: boolean;
  helperText?: string;
  compact?: boolean;
  placeholder?: string;
  /** Extra CSS merged onto the date text field. */
  sx?: SxProps<Theme>;
  /** Alias for additional field CSS (merged after `sx`). */
  inputSx?: SxProps<Theme>;
};

export const DateField = ({
  label,
  value,
  onChange,
  disabled,
  required,
  error,
  helperText,
  compact,
  placeholder,
  sx,
  inputSx,
}: DateFieldProps) => (
  <AppDatePickerProvider>
    <DatePicker
      {...appDatePickerFieldSlots}
      label={label}
      format={UI_DATE_FORMAT}
      value={parseUiDate(value)}
      disabled={disabled}
      onChange={(next) => onChange(next ? next.format(UI_DATE_FORMAT) : "")}
      slotProps={buildAppDatePickerSlotProps({
        required,
        error,
        helperText,
        compact,
        placeholder,
        sx,
        inputSx,
      })}
      sx={{ width: "100%" }}
    />
  </AppDatePickerProvider>
);

export const TimeField = ({
  label,
  value,
  onChange,
  disabled,
  required,
  error,
  helperText,
  compact,
  placeholder,
  sx,
  inputSx,
}: DateFieldProps) => (
  <AppDatePickerProvider>
    <TimePicker
      {...appDatePickerFieldSlots}
      label={label}
      value={value ? dayjs(value, "HH:mm") : null}
      disabled={disabled}
      onChange={(next) => onChange(next ? next.format("HH:mm") : "")}
      slotProps={buildAppDatePickerSlotProps({
        required,
        error,
        helperText,
        compact,
        placeholder,
        sx,
        inputSx,
      })}
      sx={{ width: "100%" }}
    />
  </AppDatePickerProvider>
);

export const DateTimeField = ({
  label,
  value,
  onChange,
  disabled,
  required,
  error,
  helperText,
  compact,
  placeholder,
  sx,
  inputSx,
}: DateFieldProps) => (
  <AppDatePickerProvider>
    <DateTimePicker
      {...appDatePickerFieldSlots}
      label={label}
      format={UI_DATETIME_FORMAT}
      value={parseUiDate(value)}
      disabled={disabled}
      onChange={(next) => onChange(next ? next.format(UI_DATETIME_FORMAT) : "")}
      slotProps={buildAppDatePickerSlotProps({
        required,
        error,
        helperText,
        compact,
        placeholder,
        sx,
        inputSx,
      })}
      sx={{ width: "100%" }}
    />
  </AppDatePickerProvider>
);

export { default as FlowBarDateField } from "./FlowBarDateField";
export type { FlowBarDateFieldProps, FlowBarDateFieldTheme } from "./FlowBarDateField";

export default DateField;
