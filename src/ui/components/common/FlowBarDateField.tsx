import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { Box, Typography } from "@mui/material";
import type { SxProps, Theme } from "@mui/material";
import {
  AppDatePickerProvider,
  appDatePickerFieldSlots,
  buildAppDatePickerSlotProps,
  parseUiDate,
  UI_DATE_FORMAT,
  UI_DATE_PLACEHOLDER,
} from "./datePickerShared";

export type FlowBarDateFieldTheme = {
  selectField?: (width?: number | string) => object;
  selectLabel?: object;
  selectInput?: (hasValue: boolean, accentColor?: string) => object;
};

const resolveInputSx = (
  flowBar: FlowBarDateFieldTheme | undefined,
  hasValue: boolean,
  accentColor: string,
  inputSx?: SxProps<Theme>,
): SxProps<Theme> => {
  const themed = flowBar?.selectInput
    ? flowBar.selectInput.length >= 2
      ? flowBar.selectInput(hasValue, accentColor)
      : flowBar.selectInput(hasValue)
    : {};

  return [
    themed as object,
    {
      "& .MuiInputBase-input": {
        fontWeight: hasValue ? 600 : 500,
        py: 1,
        fontSize: "0.82rem",
      },
    },
    inputSx,
  ] as SxProps<Theme>;
};

export interface FlowBarDateFieldProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  width?: number | string;
  flowBar?: any;
  accentColor?: string;
  inputSx?: SxProps<Theme>;
  sx?: SxProps<Theme>;
  error?: boolean;
  helperText?: string;
  required?: boolean;
}

export const FlowBarDateField = ({
  label,
  value,
  onChange,
  disabled = false,
  placeholder = UI_DATE_PLACEHOLDER,
  width = 220,
  flowBar,
  accentColor = "#2E86C1",
  inputSx,
  sx,
  error = false,
  helperText,
  required = false,
}: FlowBarDateFieldProps) => {
  const hasValue = Boolean(String(value ?? "").trim());

  // Merge error and helperText into DatePicker slotProps
  const baseSlotProps = buildAppDatePickerSlotProps({
    placeholder,
    sx,
    inputSx: resolveInputSx(flowBar, hasValue, accentColor, inputSx),
  });

  const slotProps = {
    ...baseSlotProps,
    textField: {
      ...baseSlotProps?.textField,
      error,
      helperText,
      required,
    },
  };

  return (
    <Box sx={flowBar?.selectField?.(width) ?? { width, flexShrink: 0 }}>
      {label ? (
        <Typography
          component="label"
          sx={
            flowBar?.selectLabel ?? {
              fontSize: "0.72rem",
              fontWeight: 700,
              letterSpacing: "0.03em",
              mb: 0.65,
              display: "block",
            }
          }
        >
          {label}
          {required && (
            <Box component="span" sx={{ color: "error.main", ml: 0.5 }}>
              *
            </Box>
          )}
        </Typography>
      ) : null}
      <AppDatePickerProvider>
        <DatePicker
          {...appDatePickerFieldSlots}
          format={UI_DATE_FORMAT}
          disabled={disabled}
          value={parseUiDate(value)}
          onChange={(picked) => onChange(picked?.format(UI_DATE_FORMAT) || "")}
          slotProps={slotProps}
          sx={{ width: "100%" }}
        />
      </AppDatePickerProvider>
    </Box>
  );
};

export default FlowBarDateField;
