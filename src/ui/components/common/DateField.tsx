import type { SxProps, Theme } from "@mui/material";
import { DatePicker, DateTimePicker, TimePicker } from "@mui/x-date-pickers";
import dayjs, { Dayjs } from "dayjs";
import {
  AppDatePickerProvider,
  appDatePickerFieldSlots,
  buildAppDatePickerSlotProps,
  parseUiDate,
  UI_DATE_FORMAT,
} from "./datePickerShared";
import {
  formatToUiDate,
  UI_DATETIME_SECONDS_FORMAT,
  UI_DATE_PLACEHOLDER,
} from "../../../utils/dateUtils";
import { toUiDateTime, toUiTime } from "../../../data/models/user/castingCuringFieldCodec";
import { WorkflowReadOnlyText } from "./WorkflowReadOnlyText";
import React from "react";

const UI_TIME_PLACEHOLDER = "HH:mm";

export type DateFieldProps = {
  label?: string | React.ReactNode;
  value?: string;
  onChange?: (next: string) => void;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  error?: boolean;
  helperText?: string;
  compact?: boolean;
  placeholder?: string;
  minDate?: string;
  minTime?: string;
  sx?: object;
  inputSx?: object;
  inputRef?: React.Ref<HTMLInputElement>;
};

export const DateField = React.forwardRef<HTMLInputElement, DateFieldProps>(
  (
    {
      label,
      value = "",
      onChange,
      disabled = false,
      readOnly = false,
      required = false,
      error = false,
      helperText,
      compact = false,
      placeholder,
      minDate,
      sx,
      inputSx,
      inputRef,
    },
    ref,
  ) => {
    if (readOnly) {
      return <WorkflowReadOnlyText value={value ? formatToUiDate(value) : ""} />;
    }

    const dateValue = parseUiDate(value);
    const minDateValue = minDate ? parseUiDate(minDate) ?? undefined : undefined;

    // String labels use shared appDropdownLabelProps via DatePickerTextField.
    // Native MUI `required` draws the asterisk (same as AppTextField / AppDropdown).
    const pickerSlotProps = buildAppDatePickerSlotProps({
      required: typeof label === "string" ? required : false,
      error,
      helperText,
      compact,
      placeholder: placeholder ?? UI_DATE_PLACEHOLDER,
      sx,
      inputSx,
    });

    return (
      <AppDatePickerProvider>
        <DatePicker
          {...appDatePickerFieldSlots}
          label={label}
          format={UI_DATE_FORMAT}
          value={dateValue}
          minDate={minDateValue}
          disabled={disabled}
          onChange={(next: Dayjs | null) => {
            if (onChange) {
              onChange(next && next.isValid() ? next.format(UI_DATE_FORMAT) : "");
            }
          }}
          slotProps={{
            ...pickerSlotProps,
            textField: {
              ...pickerSlotProps.textField,
              inputRef: ref ?? inputRef,
              inputProps: { readOnly: true },
            },
          }}
          sx={{ width: "100%", ...sx }}
        />
      </AppDatePickerProvider>
    );
  },
);

DateField.displayName = "DateField";

export const TimeField = ({
  label,
  value,
  onChange,
  minTime,
  disabled,
  readOnly = false,
  required,
  error,
  helperText,
  compact,
  placeholder,
  sx,
  inputSx,
}: DateFieldProps) => {
  if (readOnly) {
    return <WorkflowReadOnlyText value={value ? toUiTime(value) : ""} />;
  }

  const parsedMinTime = minTime ? dayjs(toUiTime(minTime) || minTime, "HH:mm") : null;

  return (
    <AppDatePickerProvider>
      <TimePicker
        {...appDatePickerFieldSlots}
        label={label}
        value={value ? dayjs(toUiTime(value) || String(value), "HH:mm") : null}
        minTime={parsedMinTime?.isValid() ? parsedMinTime : undefined}
        disabled={disabled}
        onChange={(next) => onChange(next ? next.format("HH:mm") : "")}
        slotProps={buildAppDatePickerSlotProps({
          required,
          error,
          helperText,
          compact,
          placeholder: placeholder ?? UI_TIME_PLACEHOLDER,
          sx,
          inputSx,
        })}
        sx={{ width: "100%" }}
      />
    </AppDatePickerProvider>
  );
};

export const DateTimeField = ({
  label,
  value,
  onChange,
  disabled,
  readOnly = false,
  required,
  error,
  helperText,
  compact,
  placeholder,
  minDate,
  sx,
  inputSx,
}: DateFieldProps) => {
  if (readOnly) {
    return <WorkflowReadOnlyText value={value ? toUiDateTime(value) : ""} />;
  }

  const minDateValue = minDate
    ? parseUiDate(toUiDateTime(minDate) || minDate) ?? undefined
    : undefined;
  const minDateTimeRaw = String(minDate ?? "").trim();
  const minDateTimeUi = minDateTimeRaw ? toUiDateTime(minDateTimeRaw) : "";
  const minDateTimeSeconds =
    minDateTimeRaw.match(/[T ]\d{1,2}:\d{2}:(\d{2})/)?.[1] ?? "00";
  const minDateTimeValue = minDateTimeUi
    ? dayjs(
        `${minDateTimeUi}:${minDateTimeSeconds}`,
        UI_DATETIME_SECONDS_FORMAT,
        true,
      )
    : null;
  const uiDateTime = toUiDateTime(value);
  const seconds = String(value ?? "").match(/[T ]\d{1,2}:\d{2}:(\d{2})/)?.[1] ?? "00";
  const dateTimeValue = uiDateTime
    ? dayjs(`${uiDateTime}:${seconds}`, UI_DATETIME_SECONDS_FORMAT, true)
    : null;
  const pickerSlotProps = buildAppDatePickerSlotProps({
    required,
    error,
    helperText,
    compact,
    placeholder: placeholder ?? `${UI_DATE_PLACEHOLDER} ${UI_TIME_PLACEHOLDER}:ss`,
    sx,
    inputSx,
  });

  return (
    <AppDatePickerProvider>
      <DateTimePicker
        {...appDatePickerFieldSlots}
        label={label}
        format={UI_DATETIME_SECONDS_FORMAT}
        value={dateTimeValue?.isValid() ? dateTimeValue : null}
        minDate={minDateValue}
        minDateTime={minDateTimeValue?.isValid() ? minDateTimeValue : undefined}
        ampm={false}
        timeSteps={{ hours: 1, minutes: 1, seconds: 1 }}
        views={["year", "month", "day", "hours", "minutes", "seconds"]}
        disabled={disabled}
        onChange={(next) =>
          onChange(next ? next.format(UI_DATETIME_SECONDS_FORMAT) : "")
        }
        slotProps={{
          ...pickerSlotProps,
          textField: {
            ...pickerSlotProps.textField,
            inputProps: { readOnly: true },
          },
        }}
        sx={{ width: "100%" }}
      />
    </AppDatePickerProvider>
  );
};

export { default as FlowBarDateField } from "./FlowBarDateField";
export type { FlowBarDateFieldProps, FlowBarDateFieldTheme } from "./FlowBarDateField";

export default DateField;
