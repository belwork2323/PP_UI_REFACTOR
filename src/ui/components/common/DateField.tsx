import { Box, Tooltip } from "@mui/material";
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
const DEFAULT_DATETIME_PLACEHOLDER = `${UI_DATE_PLACEHOLDER} ${UI_TIME_PLACEHOLDER}:ss`;
const DATE_TIME_DEPENDENCY_TOOLTIP =
  "Select the related start/from date and time first to enable this field.";

const withDateTimeDependencyTooltip = (picker: React.ReactElement, blocked: boolean) =>
  blocked ? (
    <Tooltip title={DATE_TIME_DEPENDENCY_TOOLTIP} arrow>
      <Box sx={{ display: "block", width: "100%" }}>{picker}</Box>
    </Tooltip>
  ) : (
    picker
  );

const resolveDateTimePlaceholder = (placeholder?: string): string => {
  const resolved = placeholder || DEFAULT_DATETIME_PLACEHOLDER;
  if (/HH:mm:ss/i.test(resolved)) return resolved;
  return resolved.replace(/HH:mm/i, "HH:mm:ss");
};

const parseUiDateTimeValue = (value: unknown) => {
  const uiDateTime = toUiDateTime(value);
  if (!uiDateTime) return null;
  const withSeconds = /^\d{2}-\d{2}-\d{4} \d{2}:\d{2}:\d{2}$/.test(uiDateTime)
    ? uiDateTime
    : `${uiDateTime}:00`;
  return dayjs(withSeconds, UI_DATETIME_SECONDS_FORMAT, true);
};

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
  maxDate?: string;
  minTime?: string;
  requiresMinDateTime?: boolean;
  blockedByDateTimeDependency?: boolean;
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
      maxDate,
      blockedByDateTimeDependency = false,
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
    const minDateValue = minDate ? (parseUiDate(minDate) ?? undefined) : undefined;
    const maxDateValue = maxDate ? (parseUiDate(maxDate) ?? undefined) : undefined;

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

    const picker = (
      <DatePicker
        {...appDatePickerFieldSlots}
        label={label}
        format={UI_DATE_FORMAT}
        value={dateValue}
        minDate={minDateValue}
        maxDate={maxDateValue}
        disabled={disabled || blockedByDateTimeDependency}
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
    );

    return (
      <AppDatePickerProvider>
        {withDateTimeDependencyTooltip(picker, blockedByDateTimeDependency)}
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
  blockedByDateTimeDependency = false,
}: DateFieldProps) => {
  if (readOnly) {
    return <WorkflowReadOnlyText value={value ? toUiTime(value) : ""} />;
  }

  const parsedMinTime = minTime ? dayjs(toUiTime(minTime) || minTime, "HH:mm") : null;

  const picker = (
    <TimePicker
      {...appDatePickerFieldSlots}
      label={label}
      value={value ? dayjs(toUiTime(value) || String(value), "HH:mm") : null}
      minTime={parsedMinTime?.isValid() ? parsedMinTime : undefined}
      disabled={disabled || blockedByDateTimeDependency}
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
  );

  return (
    <AppDatePickerProvider>
      {withDateTimeDependencyTooltip(picker, blockedByDateTimeDependency)}
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
  requiresMinDateTime = false,
  sx,
  inputSx,
}: DateFieldProps) => {
  if (readOnly) {
    return <WorkflowReadOnlyText value={value ? toUiDateTime(value) : ""} />;
  }

  const minDateValue = minDate
    ? (parseUiDate(toUiDateTime(minDate) || minDate) ?? undefined)
    : undefined;
  const minDateTimeValue = parseUiDateTimeValue(minDate);
  const dateTimeValue = parseUiDateTimeValue(value);
  const waitingForStartDateTime = requiresMinDateTime && !minDateTimeValue?.isValid();
  const pickerSlotProps = buildAppDatePickerSlotProps({
    required,
    error,
    helperText,
    compact,
    placeholder: resolveDateTimePlaceholder(placeholder),
    sx,
    inputSx: [{ minWidth: compact ? 220 : 240 }, inputSx],
  });

  const picker = (
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
      disabled={disabled || waitingForStartDateTime}
      onChange={(next) => {
        if (!next) {
          onChange("");
          return;
        }

        const nextDateTime =
          minDateTimeValue?.isValid() &&
          next.isSame(minDateTimeValue, "day") &&
          (!dateTimeValue?.isValid() || next.isBefore(minDateTimeValue))
            ? minDateTimeValue
            : next;
        onChange(nextDateTime.format(UI_DATETIME_SECONDS_FORMAT));
      }}
      slotProps={{
        ...pickerSlotProps,
        textField: {
          ...pickerSlotProps.textField,
          inputProps: { readOnly: true },
        },
      }}
      sx={{ width: "100%" }}
    />
  );

  return (
    <AppDatePickerProvider>
      {withDateTimeDependencyTooltip(picker, waitingForStartDateTime)}
    </AppDatePickerProvider>
  );
};

export { default as FlowBarDateField } from "./FlowBarDateField";
export type { FlowBarDateFieldProps, FlowBarDateFieldTheme } from "./FlowBarDateField";

export default DateField;
