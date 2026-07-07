import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker, DateTimePicker, TimePicker } from "@mui/x-date-pickers";
import dayjs, { type Dayjs } from "dayjs";
import type { ReactNode } from "react";
import FormInput from "./FormInput";

type DateFieldProps = {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  error?: boolean;
  helperText?: string;
  compact?: boolean;
};

const pickerTextFieldProps = (
  props: Pick<DateFieldProps, "required" | "error" | "helperText" | "compact">,
) => ({
  required: props.required,
  error: props.error,
  helperText: props.helperText,
  sx: props.compact
    ? {
        mb: 0,
        width: "100%",
        minWidth: 0,
        "& .MuiInputBase-root:not(.MuiInputBase-multiline)": {
          minHeight: 36,
          height: 36,
        },
        "& .MuiInputBase-input:not(textarea)": {
          px: 0.75,
          fontSize: "0.72rem",
        },
        "& .MuiInputAdornment-root .MuiIconButton-root": {
          p: 0.25,
        },
      }
    : undefined,
});

const pickerFieldProps = {
  enableAccessibleFieldDOMStructure: false as const,
  slots: { textField: FormInput },
};

const PickerProvider = ({ children }: { children: ReactNode }) => (
  <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="en-gb">
    {children}
  </LocalizationProvider>
);

const parseDate = (value: string): Dayjs | null => {
  if (!value) return null;
  const parsed = dayjs(value, ["DD-MM-YYYY", "DD-MM-YYYY HH:mm", "YYYY-MM-DD"], true);
  return parsed.isValid() ? parsed : null;
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
}: DateFieldProps) => (
  <PickerProvider>
    <DatePicker
      {...pickerFieldProps}
      label={label}
      value={parseDate(value)}
      disabled={disabled}
      onChange={(next) => onChange(next ? next.format("DD-MM-YYYY") : "")}
      slotProps={{
        textField: pickerTextFieldProps({ required, error, helperText, compact }),
      }}
    />
  </PickerProvider>
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
}: DateFieldProps) => (
  <PickerProvider>
    <TimePicker
      {...pickerFieldProps}
      label={label}
      value={value ? dayjs(value, "HH:mm") : null}
      disabled={disabled}
      onChange={(next) => onChange(next ? next.format("HH:mm") : "")}
      slotProps={{
        textField: pickerTextFieldProps({ required, error, helperText, compact }),
      }}
    />
  </PickerProvider>
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
}: DateFieldProps) => (
  <PickerProvider>
    <DateTimePicker
      {...pickerFieldProps}
      label={label}
      value={parseDate(value)}
      disabled={disabled}
      onChange={(next) => onChange(next ? next.format("DD-MM-YYYY HH:mm") : "")}
      slotProps={{
        textField: pickerTextFieldProps({ required, error, helperText, compact }),
      }}
    />
  </PickerProvider>
);

export default DateField;
