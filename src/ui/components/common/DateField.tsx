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
import { formatToUiDate, UI_DATETIME_FORMAT, UI_DATE_PLACEHOLDER } from "../../../utils/dateUtils";
import { toUiDateTime, toUiTime } from "../../../data/models/user/castingCuringFieldCodec";
import { WorkflowReadOnlyText } from "./WorkflowReadOnlyText";
import React, { ReactNode } from "react";
import { FieldLabelWithAsterisk } from "./FieldLabelWithAsterisk";

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

    const formattedLabel =
      typeof label === "string" && required ? (
        <FieldLabelWithAsterisk label={label} required />
      ) : (
        label
      );

    return (
      <AppDatePickerProvider>
        <DatePicker
          {...appDatePickerFieldSlots}
          label={formattedLabel}
          format={UI_DATE_FORMAT}
          value={dateValue}
          disabled={disabled}
          onChange={(next: Dayjs | null) => {
            if (onChange) {
              onChange(next && next.isValid() ? next.format(UI_DATE_FORMAT) : "");
            }
          }}
          slotProps={buildAppDatePickerSlotProps({
            required: false, // Set to false here so native MUI doesn't draw a duplicate/non-red asterisk
            error,
            helperText,
            compact,
            placeholder: placeholder ?? UI_DATE_PLACEHOLDER,
            sx,
            inputSx,
            inputRef: ref,
          })}
          sx={{ width: "100%", ...sx }}
        />
      </AppDatePickerProvider>
    );
  },
);

export const TimeField = ({
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
  sx,
  inputSx,
}: DateFieldProps) => {
  if (readOnly) {
    return <WorkflowReadOnlyText value={value ? toUiTime(value) : ""} />;
  }

  return (
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
  sx,
  inputSx,
}: DateFieldProps) => {
  if (readOnly) {
    return <WorkflowReadOnlyText value={value ? toUiDateTime(value) : ""} />;
  }

  return (
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
          placeholder: placeholder ?? `${UI_DATE_PLACEHOLDER} ${UI_TIME_PLACEHOLDER}`,
          sx,
          inputSx,
        })}
        sx={{ width: "100%" }}
      />
    </AppDatePickerProvider>
  );
};

export { default as FlowBarDateField } from "./FlowBarDateField";
export type { FlowBarDateFieldProps, FlowBarDateFieldTheme } from "./FlowBarDateField";

export default DateField;
