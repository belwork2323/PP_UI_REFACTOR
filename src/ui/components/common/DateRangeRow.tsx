import { Stack, Typography, Chip, SxProps, Theme, TextFieldProps } from "@mui/material";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import {
  AppDatePickerProvider,
  appDatePickerFieldSlots,
  buildAppDatePickerSlotProps,
  parseUiDate,
  UI_DATE_FORMAT,
} from "./datePickerShared";
import { formatDateToApiDate, formatToUiDate } from "../../../utils/dateUtils";

interface DateRangeRowProps {
  from: string;
  to: string;
  onFromChange: (v: string) => void;
  onToChange: (v: string) => void;

  currentMonthOnly?: boolean;
  onToggleMonth?: () => void;

  fromLabel?: string;
  toLabel?: string;
  separatorLabel?: string;
  thisMonthLabel?: string;

  /** Hide the leading decorative calendar icon (pickers already have one). */
  showLeadingIcon?: boolean;
  calendarIconSx?: SxProps<Theme>;
  datePickerSx?: SxProps<Theme>;
  separatorSx?: SxProps<Theme>;
  thisMonthChipSx?: (active: boolean) => SxProps<Theme>;
  textFieldProps?: Partial<TextFieldProps>;
  /** Compact height / font to match adjacent filter controls. */
  controlHeight?: number;
}

/** Parse filter value (DD-MM-YYYY or YYYY-MM-DD) to dayjs. */
const toDayjsValue = (date: string) => {
  const normalized = formatToUiDate(date);
  return normalized ? parseUiDate(normalized) : null;
};

/** Emit DD-MM-YYYY for filter/API consumers. */
const toFilterDate = (value: ReturnType<typeof parseUiDate>) =>
  value?.isValid() ? formatDateToApiDate(value.toDate()) : "";

const DateRangeRow = ({
  from,
  to,
  onFromChange,
  onToChange,

  currentMonthOnly = false,
  onToggleMonth,

  fromLabel = "From",
  toLabel = "To",
  separatorLabel = "to",
  thisMonthLabel = "This Month",

  showLeadingIcon = true,
  calendarIconSx,
  datePickerSx,
  separatorSx,
  thisMonthChipSx,
  textFieldProps,
  controlHeight = 36,
}: DateRangeRowProps) => {
  const compactFieldSx = {
    mb: 0,
    width: 152,
    minWidth: 152,
    ...(datePickerSx as object),
    "& .MuiInputBase-root:not(.MuiInputBase-multiline)": {
      minHeight: controlHeight,
      height: controlHeight,
    },
    "& .MuiInputBase-input:not(textarea)": {
      py: 0,
      px: 1.25,
      fontSize: "0.8125rem",
      letterSpacing: "0.01em",
    },
  };

  const sharedSlotProps = {
    ...buildAppDatePickerSlotProps({ sx: compactFieldSx as SxProps<Theme> }),
    textField: {
      ...buildAppDatePickerSlotProps({ sx: compactFieldSx as SxProps<Theme> }).textField,
      ...textFieldProps,
    },
  };

  return (
    <AppDatePickerProvider>
      <Stack direction="row" gap={1} alignItems="center" flexWrap="wrap">
        {showLeadingIcon && (
          <CalendarMonthIcon sx={{ fontSize: 18, opacity: 0.7, ...((calendarIconSx as object) || {}) }} />
        )}

        <DatePicker
          {...appDatePickerFieldSlots}
          label={fromLabel}
          format={UI_DATE_FORMAT}
          disabled={currentMonthOnly}
          value={toDayjsValue(from)}
          onChange={(value) => {
            const start = toFilterDate(value);

            onFromChange(start);

            if (to && value && toDayjsValue(to)?.isBefore(value, "day")) {
              onToChange("");
            }
          }}
          slotProps={sharedSlotProps}
        />

        <Typography sx={{ fontSize: "0.85rem", color: "text.secondary", px: 0.25, ...((separatorSx as object) || {}) }}>
          {separatorLabel}
        </Typography>

        <DatePicker
          {...appDatePickerFieldSlots}
          label={toLabel}
          format={UI_DATE_FORMAT}
          disabled={currentMonthOnly}
          value={toDayjsValue(to)}
          minDate={toDayjsValue(from) ?? undefined}
          onChange={(value) => onToChange(toFilterDate(value))}
          slotProps={sharedSlotProps}
        />

        {onToggleMonth && thisMonthChipSx && (
          <Chip
            clickable
            size="small"
            label={thisMonthLabel}
            onClick={onToggleMonth}
            sx={thisMonthChipSx(currentMonthOnly)}
          />
        )}
      </Stack>
    </AppDatePickerProvider>
  );
};

export default DateRangeRow;
